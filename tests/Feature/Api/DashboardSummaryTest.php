<?php

use App\Models\Device;
use App\Models\Incident;
use App\Models\SecurityEvent;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('returns 401 without a token', function (): void {
    $this->getJson(route('api.dashboard.summary'))->assertUnauthorized();
});

it('returns the PRD §14.1 summary shape with correct types', function (): void {
    // Freeze the clock to midday so the "events today" calendar-day window is
    // deterministic: relative offsets like subMinutes(10) must not cross the
    // UTC midnight boundary when the suite happens to run just after 00:00.
    $this->travelTo(today()->setTime(12, 0));

    $user = User::factory()->create();
    Sanctum::actingAs($user, ['*']);

    Device::factory()->state(['tenant_id' => $user->tenant_id])->online()->count(3)->create();
    Device::factory()->state(['tenant_id' => $user->tenant_id])->offline()->count(2)->create();

    SecurityEvent::factory()->state(['tenant_id' => $user->tenant_id])->count(4)->create([
        'detected_at' => now()->subMinutes(10),
    ]);

    Incident::factory()->state(['tenant_id' => $user->tenant_id])->open()->severity(Incident::SEVERITY_HIGH)->create();

    $response = $this->getJson(route('api.dashboard.summary'))->assertOk();

    $response->assertJsonStructure([
        'total_devices',
        'online_devices',
        'offline_devices',
        'security_events_today',
        'open_incidents',
        'risk_level',
    ]);

    $body = $response->json();

    expect($body['total_devices'])->toBeInt()->toBe(5);
    expect($body['online_devices'])->toBeInt()->toBe(3);
    expect($body['offline_devices'])->toBeInt()->toBe(2);
    expect($body['security_events_today'])->toBeInt()->toBe(4);
    expect($body['open_incidents'])->toBeInt()->toBe(1);
    expect($body['risk_level'])->toBeIn(['low', 'medium', 'high', 'critical']);
});
