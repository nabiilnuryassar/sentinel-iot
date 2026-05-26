<?php

namespace App\Ai\Agents;

use App\Ai\Middleware\LogAgentInteractions;
use App\Ai\Tools\AuditMqttBroker;
use App\Ai\Tools\GetSecurityEvents;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasMiddleware;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

/**
 * AuditAgent.
 *
 * Narrates an MQTT broker audit. Powers `Api/AgentController@audit`
 * (Telegram `/audit` command path).
 */
#[Provider(Lab::OpenAI)]
#[MaxSteps(4)]
#[Model('main-combo')]
class AuditAgent implements Agent, HasMiddleware, HasTools
{
    use Promptable;

    public function instructions(): Stringable|string
    {
        return file_get_contents(resource_path('ai/prompts/audit.md'));
    }

    /**
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new AuditMqttBroker,
            new GetSecurityEvents,
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
