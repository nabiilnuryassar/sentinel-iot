<?php

use App\Ai\Agents\SentinelAgent;
use App\Events\AgentMessageCompleted;
use App\Models\AgentMessage;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Ai\Ai;

it('renders the agent console with the user message history', function (): void {
    $user = User::factory()->create();
    AgentMessage::factory()->count(2)->create([
        'user_id' => $user->id,
        'source' => AgentMessage::SOURCE_WEB,
    ]);

    $this->actingAs($user)
        ->get(route('agent.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('agent/index')
            ->has('messages', 2)
        );
});

it('runs SentinelAgent and persists an audit row with source=web', function (): void {
    $user = User::factory()->create();
    Ai::fakeAgent(SentinelAgent::class, ['All five devices online. No critical events in the last 24h.']);

    $response = $this->actingAs($user)
        ->post(route('agent.ask'), ['prompt' => 'Status of the lab?']);

    $response->assertRedirect(route('agent.index'))
        ->assertSessionHas('agent_response', fn ($flash) => $flash['response'] === 'All five devices online. No critical events in the last 24h.');

    expect(AgentMessage::query()->count())->toBe(1);

    $row = AgentMessage::query()->first();
    expect($row->user_id)->toBe($user->id)
        ->and($row->source)->toBe(AgentMessage::SOURCE_WEB)
        ->and($row->prompt)->toBe('Status of the lab?')
        ->and($row->response)->toBe('All five devices online. No critical events in the last 24h.')
        ->and($row->metadata_json)->toHaveKey('conversation_id')
        ->and($row->metadata_json)->toHaveKey('usage');

    // SDK conversation memory tables also populated.
    expect(DB::table('agent_conversations')->count())->toBe(1)
        ->and(DB::table('agent_conversation_messages')->count())->toBeGreaterThan(0);
});

it('rejects an empty prompt', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('agent.ask'), ['prompt' => ''])
        ->assertSessionHasErrors('prompt');

    expect(AgentMessage::query()->count())->toBe(0);
});

it('streams agent tokens over SSE and dispatches AgentMessageCompleted', function (): void {
    $user = User::factory()->create();
    Ai::fakeAgent(SentinelAgent::class, ['All quiet on the wire.']);

    Event::fake([AgentMessageCompleted::class]);

    $response = $this->actingAs($user)
        ->post(route('agent.stream'), ['prompt' => 'Run a quick audit.']);

    $response->assertOk()
        ->assertHeader('Content-Type', 'text/event-stream; charset=UTF-8');

    $body = $response->streamedContent();

    expect($body)->toContain('data: ')
        ->and($body)->toContain('"type":"start"')
        ->and($body)->toContain('"type":"end"')
        ->and($body)->toContain('All quiet on the wire.')
        ->and($body)->toContain('[DONE]');

    // Audit row written by LogAgentInteractions during stream iteration.
    expect(AgentMessage::query()->count())->toBe(1);
    expect(AgentMessage::query()->first()->prompt)->toBe('Run a quick audit.');

    Event::assertDispatched(AgentMessageCompleted::class);
});

it('rejects an empty prompt on the stream endpoint', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('agent.stream'), ['prompt' => ''])
        ->assertSessionHasErrors('prompt');

    expect(AgentMessage::query()->count())->toBe(0);
});
