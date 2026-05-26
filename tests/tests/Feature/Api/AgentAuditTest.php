<?php

use App\Ai\Agents\AuditAgent;
use App\Models\AgentMessage;
use App\Models\User;
use Laravel\Ai\Ai;
use Laravel\Sanctum\Sanctum;

it('returns 401 without a token', function (): void {
    $this->postJson(route('api.agent.audit'))->assertUnauthorized();
});

it('runs AuditAgent and writes a telegram-source audit row', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);
    Ai::fakeAgent(AuditAgent::class, ['Audit complete. 0 violations in the last 24h.']);

    $this->postJson(route('api.agent.audit'))
        ->assertOk()
        ->assertJsonStructure(['response', 'conversation_id'])
        ->assertJson(['response' => 'Audit complete. 0 violations in the last 24h.']);

    $row = AgentMessage::query()->first();
    expect($row->source)->toBe(AgentMessage::SOURCE_TELEGRAM)
        ->and($row->response)->toBe('Audit complete. 0 violations in the last 24h.');
});
