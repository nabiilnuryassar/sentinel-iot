<?php

use App\Ai\Tools\GetOpenIncidents;
use App\Models\Incident;
use Laravel\Ai\Tools\Request;

it('returns only open and investigating incidents ordered by severity', function (): void {
    Incident::factory()->create([
        'title' => 'low-open',
        'status' => Incident::STATUS_OPEN,
        'severity' => Incident::SEVERITY_LOW,
    ]);
    Incident::factory()->create([
        'title' => 'critical-open',
        'status' => Incident::STATUS_OPEN,
        'severity' => Incident::SEVERITY_CRITICAL,
    ]);
    Incident::factory()->create([
        'title' => 'high-investigating',
        'status' => Incident::STATUS_INVESTIGATING,
        'severity' => Incident::SEVERITY_HIGH,
    ]);
    Incident::factory()->create([
        'title' => 'closed-out',
        'status' => Incident::STATUS_CLOSED,
        'severity' => Incident::SEVERITY_CRITICAL,
    ]);

    $payload = json_decode((new GetOpenIncidents)->handle(new Request), true);

    expect($payload['count'])->toBe(3);

    $titles = collect($payload['incidents'])->pluck('title')->all();
    expect($titles[0])->toBe('critical-open')
        ->and($titles[1])->toBe('high-investigating')
        ->and($titles[2])->toBe('low-open');
});

it('returns empty list when nothing is open', function (): void {
    Incident::factory()->create(['status' => Incident::STATUS_CLOSED]);

    $payload = json_decode((new GetOpenIncidents)->handle(new Request), true);

    expect($payload['count'])->toBe(0)
        ->and($payload['incidents'])->toBe([]);
});
