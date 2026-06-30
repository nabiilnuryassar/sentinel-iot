<?php

use App\Models\Device;
use App\Models\TelemetryLog;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('paginates the telemetry log for an authenticated user', function (): void {
    $user = User::factory()->create();
    Device::factory()->count(2)->state(['tenant_id' => $user->tenant_id])->create();
    TelemetryLog::factory()->count(5)->state(['tenant_id' => $user->tenant_id])->create();

    $this->actingAs($user)
        ->get(route('telemetry.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('telemetry/index')
            ->has('logs.data')
            ->has('devices')
            ->has('filters')
        );
});

it('filters telemetry by device_id', function (): void {
    $user = User::factory()->create();
    $kept = Device::factory()->state(['tenant_id' => $user->tenant_id])->create(['device_id' => 'temp-sensor-keep-001']);
    $other = Device::factory()->state(['tenant_id' => $user->tenant_id])->create(['device_id' => 'temp-sensor-other-001']);

    TelemetryLog::factory()->count(2)->state(['tenant_id' => $user->tenant_id])->create(['device_id' => $kept->device_id]);
    TelemetryLog::factory()->count(3)->state(['tenant_id' => $user->tenant_id])->create(['device_id' => $other->device_id]);

    $this->actingAs($user)
        ->get(route('telemetry.index', ['device_id' => $kept->device_id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('telemetry/index')
            ->has('logs.data', 2)
        );
});
