<?php

use App\Ai\Tools\GetRecentTelemetry;
use App\Models\Device;
use App\Models\TelemetryLog;
use Laravel\Ai\Tools\Request;

it('returns latest N rows for the requested device', function (): void {
    Device::factory()->create(['device_id' => 'temp-sensor-aaa']);
    Device::factory()->create(['device_id' => 'temp-sensor-bbb']);

    foreach (range(1, 5) as $i) {
        TelemetryLog::factory()->create([
            'device_id' => 'temp-sensor-aaa',
            'received_at' => now()->subMinutes(10 - $i),
            'temperature' => 20 + $i,
        ]);
    }

    TelemetryLog::factory()->count(3)->create([
        'device_id' => 'temp-sensor-bbb',
    ]);

    $payload = json_decode(
        (new GetRecentTelemetry)->handle(new Request(['device_id' => 'temp-sensor-aaa', 'limit' => 3])),
        true
    );

    expect($payload['device_id'])->toBe('temp-sensor-aaa')
        ->and($payload['count'])->toBe(3)
        ->and($payload['rows'])->toHaveCount(3);

    $temps = collect($payload['rows'])->pluck('temperature')->all();
    expect($temps[0])->toBeGreaterThan($temps[2]);
});

it('caps the limit at 100', function (): void {
    Device::factory()->create(['device_id' => 'd1']);
    TelemetryLog::factory()->count(2)->create(['device_id' => 'd1']);

    $payload = json_decode(
        (new GetRecentTelemetry)->handle(new Request(['device_id' => 'd1', 'limit' => 9999])),
        true
    );

    expect($payload['count'])->toBe(2);
});

it('returns an empty list for an unknown device', function (): void {
    $payload = json_decode(
        (new GetRecentTelemetry)->handle(new Request(['device_id' => 'no-such-device'])),
        true
    );

    expect($payload['count'])->toBe(0)
        ->and($payload['rows'])->toBe([]);
});
