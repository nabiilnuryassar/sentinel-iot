<?php

use App\Ai\Tools\AnalyzeAnomaly;
use App\Models\Device;
use App\Models\TelemetryLog;
use Laravel\Ai\Tools\Request;

it('flags an anomaly when the latest reading is >3 stddev from the mean', function (): void {
    Device::factory()->create(['device_id' => 'temp-aaa']);

    // 49 normal readings around 25C
    foreach (range(1, 49) as $i) {
        TelemetryLog::factory()->create([
            'device_id' => 'temp-aaa',
            'temperature' => 25 + (($i % 5) * 0.1),
            'received_at' => now()->subMinutes(60 - $i),
        ]);
    }
    // Latest reading: way out of band
    TelemetryLog::factory()->create([
        'device_id' => 'temp-aaa',
        'temperature' => 88.0,
        'received_at' => now(),
    ]);

    $payload = json_decode(
        (new AnalyzeAnomaly)->handle(new Request(['device_id' => 'temp-aaa'])),
        true
    );

    expect($payload['device_id'])->toBe('temp-aaa')
        ->and($payload['sample_size'])->toBe(50)
        ->and($payload['stats']['temperature']['is_anomaly'])->toBeTrue()
        ->and($payload['any_anomaly'])->toBeTrue();
});

it('does not flag an anomaly for a stable signal', function (): void {
    Device::factory()->create(['device_id' => 'stable']);

    foreach (range(1, 30) as $i) {
        TelemetryLog::factory()->create([
            'device_id' => 'stable',
            'temperature' => 25 + (($i % 3) * 0.1),
            'humidity' => 60,
            'received_at' => now()->subMinutes(31 - $i),
        ]);
    }

    $payload = json_decode(
        (new AnalyzeAnomaly)->handle(new Request(['device_id' => 'stable'])),
        true
    );

    expect($payload['any_anomaly'])->toBeFalse();
});

it('returns a noted empty result for an unknown device', function (): void {
    $payload = json_decode(
        (new AnalyzeAnomaly)->handle(new Request(['device_id' => 'unknown'])),
        true
    );

    expect($payload['sample_size'])->toBe(0)
        ->and($payload['any_anomaly'])->toBeFalse()
        ->and($payload)->toHaveKey('note');
});
