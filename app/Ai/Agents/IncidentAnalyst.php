<?php

namespace App\Ai\Agents;

use App\Ai\Middleware\LogAgentInteractions;
use App\Ai\Tools\GenerateIncidentReport;
use App\Ai\Tools\GetRecentTelemetry;
use App\Ai\Tools\GetSecurityEvents;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasMiddleware;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

/**
 * IncidentAnalyst.
 *
 * Structured-output agent that produces a full incident report. Powers
 * `IncidentController@generateReport` (web) and
 * `Api/AgentController@analyzeIncident` (Telegram path).
 *
 * No `Conversational` / `RemembersConversations` — incident analysis is
 * one-shot per call; we don't want stale conversation context bleeding
 * across two unrelated incidents.
 */
#[Provider(Lab::OpenAI)]
#[MaxSteps(6)]
#[Model('main-combo')]
class IncidentAnalyst implements Agent, HasMiddleware, HasStructuredOutput, HasTools
{
    use Promptable;

    public function model(): string
    {
        return config('ai.providers.openai.models.text.default', 'cx/gpt-5.5');
    }

    public function instructions(): Stringable|string
    {
        return file_get_contents(resource_path('ai/prompts/incident-analyst.md'));
    }

    /**
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new GetRecentTelemetry,
            new GetSecurityEvents,
            new GenerateIncidentReport,
        ];
    }

    /**
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [
            new LogAgentInteractions,
        ];
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'severity' => $schema->string()
                ->enum(['low', 'medium', 'high', 'critical'])
                ->required(),
            'summary' => $schema->string()->required(),
            'root_cause' => $schema->string()->required(),
            'impact' => $schema->string()->required(),
            'recommendation' => $schema->string()->required(),
            'recommendations' => $schema->array()
                ->items($schema->string())
                ->required(),
            'report_markdown' => $schema->string()->required(),
        ];
    }
}
