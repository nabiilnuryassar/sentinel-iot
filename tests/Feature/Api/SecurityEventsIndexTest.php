<?php

use App\Models\SecurityEvent;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('returns 401 without a token', function (): void {
    $this->getJson(route('api.security-events.index'))->assertUnauthorized();
});

it('returns paginated SecurityEventResource collection ordered by detected_at desc', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    $older = SecurityEvent::factory()->create(['detected_at' => now()->subHours(5)]);
    $newer = SecurityEvent::factory()->create(['detected_at' => now()->subMinutes(5)]);

    $response = $this->getJson(route('api.security-events.index'))->assertOk();

    $response->assertJsonStructure([
        'data' => [
            ['id', 'event_type', 'severity', 'source_client_id', 'topic', 'description', 'detected_at'],
        ],
        'links',
        'meta',
    ]);

    expect($response->json('meta.total'))->toBe(2);
    expect($response->json('data.0.id'))->toBe($newer->id);
    expect($response->json('data.1.id'))->toBe($older->id);
});

it('filters by ?since=today', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    SecurityEvent::factory()->count(2)->create(['detected_at' => now()->subMinutes(30)]);
    SecurityEvent::factory()->count(3)->create(['detected_at' => now()->subDays(2)]);

    $response = $this->getJson(route('api.security-events.index', ['since' => 'today']))->assertOk();

    expect($response->json('meta.total'))->toBe(2);
});

it('filters by ?since=24h', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    SecurityEvent::factory()->count(2)->create(['detected_at' => now()->subHours(6)]);
    SecurityEvent::factory()->count(3)->create(['detected_at' => now()->subDays(3)]);

    $response = $this->getJson(route('api.security-events.index', ['since' => '24h']))->assertOk();

    expect($response->json('meta.total'))->toBe(2);
});
