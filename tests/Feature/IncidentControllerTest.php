<?php

use App\Models\Device;
use App\Models\Incident;
use App\Models\IncidentReport;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('lists incidents for an authenticated user', function (): void {
    $user = User::factory()->create();
    Incident::factory()->count(3)->state(['tenant_id' => $user->tenant_id])->create();

    $this->actingAs($user)
        ->get(route('incidents.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('incidents/index')
            ->has('incidents.data', 3)
        );
});

it('shows an incident with its reports and device', function (): void {
    $user = User::factory()->create();
    $device = Device::factory()->state(['tenant_id' => $user->tenant_id])->create(['device_id' => 'temp-sensor-incident-001']);
    $incident = Incident::factory()->state(['tenant_id' => $user->tenant_id])->create([
        'affected_device_id' => $device->device_id,
    ]);
    IncidentReport::factory()->state(['tenant_id' => $user->tenant_id])->for($incident)->create();

    $this->actingAs($user)
        ->get(route('incidents.show', $incident))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('incidents/show')
            ->where('incident.id', $incident->id)
            ->where('incident.device.device_id', $device->device_id)
            ->has('incident.reports', 1)
        );
});

it('creates an incident with valid input', function (): void {
    $user = User::factory()->create();
    $device = Device::factory()->state(['tenant_id' => $user->tenant_id])->create(['device_id' => 'temp-sensor-store-001']);

    $this->actingAs($user)
        ->post(route('incidents.store'), [
            'title' => 'Suspicious traffic from sensor',
            'severity' => Incident::SEVERITY_HIGH,
            'affected_device_id' => $device->device_id,
            'summary' => 'Unusual publish rate.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('incidents', [
        'title' => 'Suspicious traffic from sensor',
        'severity' => Incident::SEVERITY_HIGH,
        'status' => Incident::STATUS_OPEN,
        'affected_device_id' => $device->device_id,
        'created_by' => $user->id,
        'tenant_id' => $user->tenant_id,
    ]);
});

it('rejects an incident missing the title', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('incidents.store'), [
            'severity' => Incident::SEVERITY_LOW,
        ])
        ->assertSessionHasErrors('title');
});

it('updates an incident status', function (): void {
    $user = User::factory()->create();
    $incident = Incident::factory()->state(['tenant_id' => $user->tenant_id])->open()->create();

    $this->actingAs($user)
        ->put(route('incidents.update', $incident), [
            'status' => Incident::STATUS_INVESTIGATING,
        ])
        ->assertRedirect();

    expect($incident->fresh()->status)->toBe(Incident::STATUS_INVESTIGATING);
});
