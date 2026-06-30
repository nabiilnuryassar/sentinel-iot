<?php

use App\Models\Device;
use App\Models\DevicePolicy;
use App\Models\Incident;
use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the dashboard with all required props', function (): void {
    $user = User::factory()->create();
    $tenantId = $user->tenant_id;

    $devices = Device::factory()->online()->count(3)->create(['tenant_id' => $tenantId]);
    Device::factory()->offline()->count(2)->create(['tenant_id' => $tenantId]);
    DevicePolicy::factory()->create(['tenant_id' => $tenantId, 'device_id' => $devices[0]->device_id]);

    SecurityEvent::factory()->count(4)->create([
        'tenant_id' => $tenantId,
        'detected_at' => now()->subMinutes(10),
    ]);

    Incident::factory()->open()->severity(Incident::SEVERITY_HIGH)->create(['tenant_id' => $tenantId]);

    TelemetryLog::factory()->count(5)->create([
        'tenant_id' => $tenantId,
        'received_at' => now()->subMinutes(5),
        'temperature' => 22.5,
        'humidity' => 45.0,
        'battery' => 80.0,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('total_devices')
            ->has('online_devices')
            ->has('offline_devices')
            ->has('security_events_today')
            ->has('open_incidents')
            ->has('risk_level')
            ->has('recent_telemetry', 60)
            ->has('recent_telemetry.0.temperature')
            ->has('recent_telemetry.0.humidity')
            ->has('recent_telemetry.0.battery')
            ->has('recent_events')
            ->has('bot_token')
            ->has('incidents')
            ->has('devices')
            ->has('devices.0.device_id')
            ->has('devices.0.name')
            ->has('devices.0.type')
            ->has('devices.0.status')
            ->has('security_score')
            ->has('security_score.overall')
            ->has('security_score.sub_scores')
            ->has('security_score.label')
            ->has('operator')
            ->has('operator.name')
            ->has('operator.email')
            ->has('operator.resolved_this_week')
        );
});

it('returns recent open incidents with formatted shape', function (): void {
    $user = User::factory()->create();
    Incident::factory()->open()->severity(Incident::SEVERITY_HIGH)->create([
        'tenant_id' => $user->tenant_id,
        'title' => 'Test incident',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('incidents', 1)
            ->where('incidents.0.title', 'Test incident')
            ->where('incidents.0.severity', Incident::SEVERITY_HIGH)
            ->where('incidents.0.status', Incident::STATUS_OPEN)
        );
});
