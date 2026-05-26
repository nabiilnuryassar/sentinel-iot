<?php

namespace App\Http\Controllers\Api;

use App\Ai\Agents\AuditAgent;
use App\Ai\Agents\IncidentAnalyst;
use App\Ai\Agents\SentinelAgent;
use App\Ai\Middleware\LogAgentInteractions;
use App\Http\Controllers\Controller;
use App\Http\Requests\AskAgentRequest;
use App\Models\Incident;
use App\Models\IncidentReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Ai\Contracts\Agent;

/**
 * Agent endpoints (Telegram bot surface).
 *
 * Backed by the in-process `laravel/ai` agents. Audit rows in
 * `agent_messages` are written by
 * {@see LogAgentInteractions} with `source='telegram'`
 * because every request here matches the `api/*` path prefix.
 */
class AgentController extends Controller
{
    public function ask(AskAgentRequest $request): JsonResponse
    {
        $agent = (new SentinelAgent)->forUser($request->user());

        return response()->json($this->runAgent($agent, $request->validated('prompt')));
    }

    public function audit(Request $request): JsonResponse
    {
        return response()->json($this->runAgent(
            new AuditAgent,
            'Run an MQTT broker audit and summarize findings.',
        ));
    }

    /**
     * Run an unstructured agent and return the JSON shape expected by Telegram.
     *
     * 9router's Kiro-backed combo path returns OpenAI Responses as SSE even
     * when the non-stream endpoint is called. Laravel AI SDK's `prompt()`
     * expects a JSON body there, so deployments using 9router can opt into
     * `stream()` and still return a normal JSON response to the bot.
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

    public function analyzeIncident(Request $request, Incident $incident): JsonResponse
    {
        $response = (new IncidentAnalyst)->prompt(
            "Analyze incident #{$incident->id}: {$incident->title}"
        );

        $structured = $response->toArray();

        $report = IncidentReport::query()->create([
            'incident_id' => $incident->id,
            'report_markdown' => $structured['report_markdown'] ?? '',
            'generated_by' => 'agent',
            'generated_at' => now(),
        ]);

        $incident->update([
            'severity' => $structured['severity'] ?? $incident->severity,
            'recommendation' => $structured['recommendation'] ?? $incident->recommendation,
            'summary' => $structured['summary'] ?? $incident->summary,
            'root_cause' => $structured['root_cause'] ?? $incident->root_cause,
        ]);

        return response()->json([
            'severity' => $structured['severity'] ?? null,
            'summary' => $structured['summary'] ?? null,
            'root_cause' => $structured['root_cause'] ?? null,
            'impact' => $structured['impact'] ?? null,
            'recommendation' => $structured['recommendation'] ?? null,
            'recommendations' => $structured['recommendations'] ?? [],
            'report_markdown' => $structured['report_markdown'] ?? '',
            'conversation_id' => $response->conversationId,
            'incident_report_id' => $report->id,
        ]);
    }
}
