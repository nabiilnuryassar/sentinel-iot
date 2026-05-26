<?php

use App\Models\Device;
use App\Models\User;

it('requires authentication to quarantine a device', function (): void {
    $device = Device::factory()->create(['status' => 'offline']);

    $this->post(route('devices.quarantine', ['device_id' => $device->device_id]))
        ->assertRedirect(route('login'));
});

it('toggles a device status from offline to quarantined', function (): void {
    $user = User::factory()->create();
    $device = Device::factory()->create(['status' => 'offline']);

    $response = $this->actingAs($user)
        ->from(route('devices.show', ['device_id' => $device->device_id]))
        ->post(route('devices.quarantine', ['device_id' => $device->device_id]));

    $response->assertRedirect(route('devices.show', ['device_id' => $device->device_id]));
    $response->assertSessionHas('status', 'Device status updated.');

    expect($device->fresh()->status)->toBe('quarantined');
});

it('toggles a device status from quarantined to offline', function (): void {
    $user = User::factory()->create();
    $device = Device::factory()->create(['status' => 'quarantined']);

    $response = $this->actingAs($user)
        ->from(route('devices.show', ['device_id' => $device->device_id]))
        ->post(route('devices.quarantine', ['device_id' => $device->device_id]));

    $response->assertRedirect(route('devices.show', ['device_id' => $device->device_id]));
    $response->assertSessionHas('status', 'Device status updated.');

    expect($device->fresh()->status)->toBe('offline');
});

it('returns 404 for quarantining a non-existent device', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('devices.quarantine', ['device_id' => 'does-not-exist']))
        ->assertNotFound();
});
