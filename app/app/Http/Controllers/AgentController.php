<?php

namespace App\Http\Controllers;

use App\Ai\Agents\SentinelAgent;
use App\Ai\Middleware\LogAgentInteractions;
use App\Events\AgentMessageCompleted;
use App\Http\Requests\AskAgentRequest;
use App\Jobs\SendAgentWebhook;
use App\Models\AgentMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Event;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Responses\StreamableAgentResponse;
use Laravel\Ai\Streaming\Events\TextDelta;
use Laravel\Ai\Streaming\Events\TextEnd;
use Laravel\Ai\Streaming\Events\ToolCall;
use Laravel\Ai\Streaming\Events\ToolResult;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class AgentController extends Controller
{
    /**
     * Render the agent console with the user's last 20 prompt/response pairs.
     *
     * Sends `stream_url` so the client can POST to the SSE endpoint without
     * hardcoding a URL (kept under Wayfinder discipline server-side).
     */
    public function index(Request $request): Response
    {
        $messages = AgentMessage::query()
            ->where('user_id', $request->user()?->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['id', 'prompt', 'response', 'source', 'metadata_json', 'created_at'])
            ->map(fn (AgentMessage $message) => [
                'id' => $message->id,
                'prompt' => $message->prompt,
                'response' => $message->response,
                'source' => $message->source,
                'metadata_json' => $message->metadata_json,
                'created_at' => $message->created_at?->toIso8601String(),
            ])
            ->all();

        return Inertia::render('agent/index', [
            'messages' => $messages,
            'stream_url' => route('agent.stream'),
        ]);
    }

    /**
     * Run the SentinelAgent against the prompt and flash the response back to
     * the page. The audit row in `agent_messages` is written by
     * {@see LogAgentInteractions}, never here.
     */
    public function ask(AskAgentRequest $request): RedirectResponse
    {
        $agentResponse = $this->runAgent(
            (new SentinelAgent)->forUser($request->user()),
            $request->validated('prompt'),
        );

        return redirect()
            ->route('agent.index')
            ->with('agent_response', $agentResponse);
    }

    /**
     * Stream the SentinelAgent response as JSON-lines over Server-Sent Events.
     *
     * The frontend opens a `fetch()` with a `ReadableStream` reader and
     * progressively renders tokens. The `agent_messages` row is still
     * persisted by {@see LogAgentInteractions} when
     * StreamableAgentResponse iteration completes.
     *
     * Event payloads (one per `data: ` line):
     *   { type: "start", conversation_id?: string }
     *   { type: "delta", content: string }
     *   { type: "tool", name: string, phase: "call"|"result" }
     *   { type: "end", text: string, conversation_id?: string, duration_ms: int }
     *   { type: "error", message: string }
     */
    public function stream(AskAgentRequest $request): StreamedResponse
    {
        $agent = (new SentinelAgent)->forUser($request->user());
        $prompt = (string) $request->validated('prompt');

        // Release the session write-lock before starting the long-lived SSE
        // response. Without this, every other authenticated request from the
        // same user (including the Inertia partial reload that refreshes the
        // history pane) blocks until the stream ends. See WORKLOG.md B1.
        $request->session()->save();

        // Snapshot the audit feed's high-water mark before invoking the agent
        // so afterStream() can resolve *this* stream's row by id, not by raw
        // prompt text. Closes WORKLOG.md B2.
        $auditBaselineId = (int) (AgentMessage::query()->max('id') ?? 0);
        $userId = $request->user()?->id;

        $stream = $agent->stream($prompt);
        $startedAt = (int) (microtime(true) * 1000);

        return response()->stream(function () use (
            $stream,
            $startedAt,
            $prompt,
            $auditBaselineId,
            $userId,
        ) {
            $emit = static function (array $payload): void {
                echo 'data: '.json_encode(
                    $payload,
                    JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
                )."\n\n";

                if (function_exists('ob_flush')) {
                    @ob_flush();
                }

                @flush();
            };

            try {
                $emit([
                    'type' => 'start',
                    'invocation_id' => $stream->invocationId,
                ]);

                foreach ($stream as $event) {
                    if ($event instanceof TextDelta) {
                        $emit(['type' => 'delta', 'content' => $event->delta]);
                    } elseif ($event instanceof ToolCall) {
                        $emit(['type' => 'tool', 'name' => $event->toolCall->name, 'phase' => 'call']);
                    } elseif ($event instanceof ToolResult) {
                        $emit(['type' => 'tool', 'name' => $event->toolResult->name, 'phase' => 'result']);
                    } elseif ($event instanceof TextEnd) {
                        // Surface end-of-text early so the typing indicator can
                        // settle before the audit row is persisted.
                        $emit(['type' => 'turn_end']);
                    }
                }

                $emit([
                    'type' => 'end',
                    'text' => trim((string) $stream->text),
                    'conversation_id' => $stream->conversationId,
                    'duration_ms' => (int) (microtime(true) * 1000) - $startedAt,
                ]);

                $this->afterStream($prompt, $stream, $startedAt, $auditBaselineId, $userId);
            } catch (Throwable $e) {
                report($e);
                $emit(['type' => 'error', 'message' => 'Agent run failed.']);
            }

            echo "data: [DONE]\n\n";
            @flush();
        }, headers: [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-transform',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Run the dashboard agent in the same 9router-compatible mode as Telegram.
     *
     * 9router's combo path can return Responses API output as SSE. When
     * `AI_AGENT_FORCE_STREAMING=true`, consume that stream and flash the
     * combined text back to the Inertia page.
     *
     * @return array{response: string, conversation_id: string|null}
     */
    private function runAgent(Agent $agent, string $prompt): array
    {
        if (filter_var(env('AI_AGENT_FORCE_STREAMING', false), FILTER_VALIDATE_BOOL)) {
            $stream = $agent->stream($prompt);

            foreach ($stream as $_event) {
                // Exhaust the stream so StreamableAgentResponse combines text.
            }

            return [
                'response' => trim((string) $stream->text),
                'conversation_id' => $stream->conversationId,
            ];
        }

        $response = $agent->prompt($prompt);

        return [
            'response' => (string) $response,
            'conversation_id' => $response->conversationId,
        ];
    }

    /**
     * Fire {@see AgentMessageCompleted} for the row written by the audit
     * middleware, and POST the same payload to `AGENT_WEBHOOK_URL` if set.
     *
     * Wrapped in try/catch because a webhook misfire must never break the
     * user-facing stream.
     */
    private function afterStream(
        string $prompt,
        StreamableAgentResponse $stream,
        int $startedAt,
        int $auditBaselineId,
        ?int $userId,
    ): void {
        try {
            // Resolve the row this stream just wrote: it must have an id
            // strictly greater than the pre-stream baseline. Falling back to
            // the prompt text only as a tiebreaker (same user can have
            // multiple in-flight prompts but never with the same id newer
            // than the same baseline at once).
            $message = AgentMessage::query()
                ->where('id', '>', $auditBaselineId)
                ->when($userId !== null, fn ($q) => $q->where('user_id', $userId))
                ->where('prompt', $prompt)
                ->orderBy('id')
                ->first();

            if ($message === null) {
                return;
            }

            $context = [
                'conversation_id' => $stream->conversationId,
                'usage' => $stream->usage?->toArray(),
                'duration_ms' => (int) (microtime(true) * 1000) - $startedAt,
                'source' => AgentMessage::SOURCE_WEB,
            ];

            Event::dispatch(new AgentMessageCompleted($message, $context));

            $webhook = (string) env('AGENT_WEBHOOK_URL', '');

            if ($webhook !== '') {
                // Dispatch through the queue so the user-visible stream is
                // not gated by a third-party endpoint. Closes WORKLOG.md B3.
                Bus::dispatch(new SendAgentWebhook($webhook, [
                    'event' => 'agent.message.completed',
                    'message_id' => $message->id,
                    'conversation_id' => $context['conversation_id'],
                    'duration_ms' => $context['duration_ms'],
                ]));
            }
        } catch (Throwable $e) {
            report($e);
        }
    }
}
