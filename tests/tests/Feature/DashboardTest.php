<?php

use App\Models\Device;
use App\Models\Incident;
use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the dashboard for an authenticated user with summary keys', function (): void {
    $user = User::factory()->create();

    Device::factory()->online()->count(3)->create();
    Device::factory()->offline()->count(2)->create();

    SecurityEvent::factory()->count(4)->create([
        'detected_at' => now()->subMinutes(10),
    ]);

    Incident::factory()->open()->severity(Incident::SEVERITY_HIGH)->create();

    TelemetryLog::factory()->count(5)->create([
        'received_at' => now()->subMinutes(5),
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
            ->has('recent_events')
        );
});
