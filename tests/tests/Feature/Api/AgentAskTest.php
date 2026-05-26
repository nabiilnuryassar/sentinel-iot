<?php

use App\Ai\Agents\SentinelAgent;
use App\Models\AgentMessage;
use App\Models\User;
use Laravel\Ai\Ai;
use Laravel\Sanctum\Sanctum;

it('returns 401 without a token', function (): void {
    $this->postJson(route('api.agent.ask'), ['prompt' => 'hi'])->assertUnauthorized();
});

it('runs SentinelAgent and returns the response over Sanctum', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);
    Ai::fakeAgent(SentinelAgent::class, ['All five devices online.']);

    $this->postJson(route('api.agent.ask'), ['prompt' => 'Status of the lab?'])
        ->assertOk()
        ->assertJsonStructure(['response', 'conversation_id'])
        ->assertJson(['response' => 'All five devices online.']);

    expect(AgentMessage::query()->count())->toBe(1);
    expect(AgentMessage::query()->first()->source)->toBe(AgentMessage::SOURCE_TELEGRAM);
});

it('returns 422 with an empty prompt', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    $this->postJson(route('api.agent.ask'), ['prompt' => ''])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['prompt']);
});

it('returns 422 when the prompt exceeds 2000 characters', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    $this->postJson(route('api.agent.ask'), ['prompt' => str_repeat('a', 2001)])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['prompt']);
});
