<?php

namespace App\Ai\Middleware;

use App\Models\AgentMessage;
use Closure;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Prompts\AgentPrompt;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\StructuredAgentResponse;

/**
 * LogAgentInteractions.
 *
 * Writes one row to `agent_messages` per agent invocation, after the SDK
 * has finalized the response (post tool-loop). This is the **only** writer
 * to the audit feed — controllers do not insert into `agent_messages`
 * directly. Streaming responses are out of scope for Phase 4.
 */
class LogAgentInteractions
{
    /**
     * Handle the incoming prompt.
     */
    public function handle(AgentPrompt $prompt, Closure $next)
    {
        return $next($prompt)->then(function (AgentResponse $response) use ($prompt) {
            $agent = $prompt->agent;

            $isStructured = $agent instanceof HasStructuredOutput
                && $response instanceof StructuredAgentResponse;

            $structured = $isStructured ? $response->toArray() : null;

            $responseText = $isStructured
                ? json_encode($structured, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
                : (string) $response;

            $request = request();

            AgentMessage::query()->create([
                'tenant_id' => auth()->user()?->tenant_id ?? 1,
                'user_id' => $this->resolveUserId($agent),
                'source' => $request !== null && $request->is('api/*')
                    ? AgentMessage::SOURCE_TELEGRAM
                    : AgentMessage::SOURCE_WEB,
                'prompt' => $prompt->prompt,
                'response' => $responseText,
                'metadata_json' => [
                    'conversation_id' => $response->conversationId,
                    'recommendations' => $structured['recommendations'] ?? null,
                    'tool_calls' => $response->toolCalls
                        ->map(fn ($call) => [
                            'name' => $call->name,
                            'arguments' => $call->arguments,
                        ])
                        ->all(),
                    'usage' => $response->usage->toArray(),
                ],
            ]);
        });
    }

    /**
     * Pull the user id from the agent's conversation participant when the
     * agent uses RemembersConversations. Telegram requests over Sanctum may
     * not have a User model, so this stays nullable.
     */
    protected function resolveUserId(object $agent): ?int
    {
        if (! method_exists($agent, 'conversationParticipant')) {
            return null;
        }

        $participant = $agent->conversationParticipant();

        return $participant?->id;
    }
}
