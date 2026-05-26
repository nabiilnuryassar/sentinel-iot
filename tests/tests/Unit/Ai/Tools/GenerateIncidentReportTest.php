<?php

use App\Ai\Tools\GenerateIncidentReport;
use App\Models\Device;
use App\Models\Incident;
use App\Models\IncidentReport;
use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use Laravel\Ai\Tools\Request;

it('returns incident plus related events, telemetry, and existing reports', function (): void {
    Device::factory()->create(['device_id' => 'temp-aaa']);

    $incident = Incident::factory()->create([
        'affected_device_id' => 'temp-aaa',
        'title' => 'Spoofed payload',
        'severity' => Incident::SEVERITY_HIGH,
    ]);

    SecurityEvent::factory()->count(3)->create([
        'source_client_id' => 'temp-aaa',
        'detected_at' => now()->subMinutes(10),
    ]);
    SecurityEvent::factory()->create([
        'source_client_id' => 'unrelated',
    ]);

    TelemetryLog::factory()->count(5)->create(['device_id' => 'temp-aaa']);
    TelemetryLog::factory()->count(2)->create(['device_id' => 'temp-bbb']);

    IncidentReport::factory()->create([
        'incident_id' => $incident->id,
        'generated_by' => 'agent',
    ]);

    $payload = json_decode(
        (new GenerateIncidentReport)->handle(new Request(['incident_id' => $incident->id])),
        true
    );

    expect($payload['found'])->toBeTrue()
        ->and($payload['incident']['id'])->toBe($incident->id)
        ->and($payload['incident']['title'])->toBe('Spoofed payload')
        ->and($payload['related_events'])->toHaveCount(3)
        ->and($payload['recent_telemetry'])->toHaveCount(5)
        ->and($payload['existing_reports'])->toHaveCount(1);
});

it('returns found=false for an unknown incident id', function (): void {
    $payload = json_decode(
        (new GenerateIncidentReport)->handle(new Request(['incident_id' => 99999])),
        true
    );

    expect($payload['found'])->toBeFalse();
});

it('handles incidents without an affected device', function (): void {
    $incident = Incident::factory()->create(['affected_device_id' => null]);

    $payload = json_decode(
        (new GenerateIncidentReport)->handle(new Request(['incident_id' => $incident->id])),
        true
    );

    expect($payload['found'])->toBeTrue()
        ->and($payload['related_events'])->toBe([])
        ->and($payload['recent_telemetry'])->toBe([]);
});
