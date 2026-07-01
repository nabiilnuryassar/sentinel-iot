<?php

namespace App\Ai\Agents;

use App\Ai\Middleware\LogAgentInteractions;
use App\Ai\Tools\AnalyzeAnomaly;
use App\Ai\Tools\AuditMqttBroker;
use App\Ai\Tools\GetDeviceStatus;
use App\Ai\Tools\GetOpenIncidents;
use App\Ai\Tools\GetRecentTelemetry;
use App\Ai\Tools\GetSecurityEvents;
use App\Ai\Tools\RecommendMitigation;
use App\Models\User;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasMiddleware;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

/**
 * SentinelAgent.
 *
 * General-purpose Sentinel-IoT assistant. Powers the dashboard agent
 * console and the Telegram free-text path. The Provider attribute pins
 * OpenAI as the default lab; swap by exporting a different `*_API_KEY`
 * and either flipping `config/ai.php`'s `default` or passing
 * `provider: Lab::Anthropic` per call. We keep the attribute static for
 * MVP per Phase 4 decision #1.
 */
#[Provider(Lab::OpenAI)]
#[MaxSteps(6)]
#[Model('cx/gpt-5.5')]
class SentinelAgent implements Agent, Conversational, HasMiddleware, HasTools
{
    use Promptable;
    use RemembersConversations;

    public function model(): string
    {
        return config('ai.providers.openai.models.text.default', 'cx/gpt-5.5');
    }

    public function __construct(public ?User $user = null)
    {
        if ($user !== null) {
            $this->forUser($user);
        }
    }

    public function instructions(): Stringable|string
    {
        return file_get_contents(resource_path('ai/prompts/sentinel-system.md'));
    }

    /**
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new GetDeviceStatus,
            new GetRecentTelemetry,
            new GetSecurityEvents,
            new GetOpenIncidents,
            new AnalyzeAnomaly,
            new AuditMqttBroker,
            new RecommendMitigation,
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
}
