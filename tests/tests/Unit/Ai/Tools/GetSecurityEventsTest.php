<?php

use App\Ai\Tools\GetSecurityEvents;
use App\Models\SecurityEvent;
use Laravel\Ai\Tools\Request;

it('returns events ordered newest first', function (): void {
    SecurityEvent::factory()->create([
        'severity' => SecurityEvent::SEVERITY_LOW,
        'detected_at' => now()->subHours(2),
        'description' => 'older',
    ]);
    SecurityEvent::factory()->create([
        'severity' => SecurityEvent::SEVERITY_HIGH,
        'detected_at' => now()->subMinutes(30),
        'description' => 'newer',
    ]);

    $payload = json_decode((new GetSecurityEvents)->handle(new Request), true);

    expect($payload['count'])->toBe(2)
        ->and($payload['events'][0]['description'])->toBe('newer');
});

it('filters by severity', function (): void {
    SecurityEvent::factory()->create(['severity' => SecurityEvent::SEVERITY_LOW]);
    SecurityEvent::factory()->count(2)->create(['severity' => SecurityEvent::SEVERITY_HIGH]);

    $payload = json_decode(
        (new GetSecurityEvents)->handle(new Request(['severity' => SecurityEvent::SEVERITY_HIGH])),
        true
    );

    expect($payload['count'])->toBe(2)
        ->and(collect($payload['events'])->pluck('severity')->unique()->all())
        ->toBe([SecurityEvent::SEVERITY_HIGH]);
});

it('filters by since=today', function (): void {
    SecurityEvent::factory()->create(['detected_at' => now()->subDays(2)]);
    SecurityEvent::factory()->create(['detected_at' => now()->startOfDay()->addHour()]);

    $payload = json_decode(
        (new GetSecurityEvents)->handle(new Request(['since' => 'today'])),
        true
    );

    expect($payload['count'])->toBe(1);
});

it('returns empty when there are no events', function (): void {
    $payload = json_decode((new GetSecurityEvents)->handle(new Request), true);

    expect($payload['count'])->toBe(0)
        ->and($payload['events'])->toBe([]);
});
