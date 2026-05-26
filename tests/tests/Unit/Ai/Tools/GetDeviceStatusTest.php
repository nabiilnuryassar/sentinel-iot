<?php

use App\Ai\Tools\GetDeviceStatus;
use App\Models\Device;
use Laravel\Ai\Tools\Request;

it('returns total/online/offline counts plus stale list', function (): void {
    Device::factory()->create([
        'device_id' => 'temp-online-001',
        'last_seen_at' => now()->subSeconds(30),
        'type' => Device::TYPE_TEMPERATURE_SENSOR,
    ]);
    Device::factory()->create([
        'device_id' => 'door-stale-001',
        'last_seen_at' => now()->subMinutes(15),
        'type' => Device::TYPE_DOOR_LOCK,
    ]);
    Device::factory()->create([
        'device_id' => 'door-never-001',
        'last_seen_at' => null,
        'type' => Device::TYPE_DOOR_LOCK,
    ]);

    $payload = json_decode((new GetDeviceStatus)->handle(new Request), true);

    expect($payload['total'])->toBe(3)
        ->and($payload['online'])->toBe(1)
        ->and($payload['offline'])->toBe(2)
        ->and($payload['by_type'])->toHaveKey(Device::TYPE_TEMPERATURE_SENSOR, 1)
        ->and($payload['by_type'])->toHaveKey(Device::TYPE_DOOR_LOCK, 2)
        ->and($payload['stale'])->toHaveCount(2);

    $staleIds = collect($payload['stale'])->pluck('device_id')->all();
    expect($staleIds)->toContain('door-stale-001', 'door-never-001');
});

it('returns zeros when no devices exist', function (): void {
    $payload = json_decode((new GetDeviceStatus)->handle(new Request), true);

    expect($payload['total'])->toBe(0)
        ->and($payload['online'])->toBe(0)
        ->and($payload['offline'])->toBe(0)
        ->and($payload['stale'])->toBe([]);
});
