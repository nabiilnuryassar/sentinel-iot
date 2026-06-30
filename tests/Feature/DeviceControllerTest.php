<?php

use App\Models\Device;
use App\Models\TelemetryLog;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('lists devices for an authenticated user', function (): void {
    $user = User::factory()->create();
    Device::factory()->count(3)->state(['tenant_id' => $user->tenant_id])->create();

    $this->actingAs($user)
        ->get(route('devices.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('devices/index')
            ->has('devices.data', 3)
        );
});

it('shows a device by its string device_id', function (): void {
    $user = User::factory()->create();
    $device = Device::factory()->state(['tenant_id' => $user->tenant_id])->create(['device_id' => 'temp-sensor-test-001']);
    TelemetryLog::factory()->count(2)->state(['tenant_id' => $user->tenant_id])->create(['device_id' => $device->device_id]);

    $this->actingAs($user)
        ->get(route('devices.show', ['device_id' => $device->device_id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('devices/show')
            ->where('device.device_id', 'temp-sensor-test-001')
            ->has('telemetry', 2)
            ->has('events')
        );
});

it('returns 404 for an unknown device_id', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('devices.show', ['device_id' => 'does-not-exist']))
        ->assertNotFound();
});
