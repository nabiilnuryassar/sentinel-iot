<?php

use App\Models\Device;
use App\Models\DevicePolicy;
use App\Models\SecurityEvent;
use App\Services\SecurityScoreCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('returns perfect score when all devices are online with policies and no events', function (): void {
    $devices = Device::factory()->online()->count(3)->create();

    foreach ($devices as $device) {
        DevicePolicy::factory()->create(['device_id' => $device->device_id]);
    }

    $result = app(SecurityScoreCalculator::class)->calculate();

    expect($result['overall'])->toBe(100)
        ->and($result['label'])->toBe('Excellent')
        ->and($result['sub_scores'])->toHaveCount(4);

    foreach ($result['sub_scores'] as $sub) {
        expect($sub['value'])->toBe(100);
    }
});

it('returns low score when devices are offline with network events', function (): void {
    Device::factory()->offline()->count(3)->create();
    SecurityEvent::factory()->count(10)->create([
        'event_type' => SecurityEvent::TYPE_UNAUTHORIZED_PUBLISH,
        'detected_at' => now()->subHour(),
    ]);

    $result = app(SecurityScoreCalculator::class)->calculate();

    expect($result['overall'])->toBeLessThan(50)
        ->and($result['label'])->toBe('Poor');
});

it('calculates identity score from active device policy coverage', function (): void {
    $devices = Device::factory()->online()->count(4)->create();
    DevicePolicy::factory()->create(['device_id' => $devices[0]->device_id]);
    DevicePolicy::factory()->create(['device_id' => $devices[1]->device_id]);
    DevicePolicy::factory()->inactive()->create(['device_id' => $devices[2]->device_id]);

    $result = app(SecurityScoreCalculator::class)->calculate();

    $identity = collect($result['sub_scores'])->firstWhere('label', 'Identity');
    expect($identity['value'])->toBe(50);
});

it('clamps network score to zero when many events exist', function (): void {
    Device::factory()->online()->count(2)->create();
    SecurityEvent::factory()->count(30)->create([
        'event_type' => SecurityEvent::TYPE_PUBLISH_FLOOD,
        'detected_at' => now()->subHour(),
    ]);

    $result = app(SecurityScoreCalculator::class)->calculate();

    $network = collect($result['sub_scores'])->firstWhere('label', 'Network');
    expect($network['value'])->toBe(0);
});
