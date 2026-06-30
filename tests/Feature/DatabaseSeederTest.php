<?php

use App\Models\Device;
use App\Models\Incident;
use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use App\Models\User;

it('seeds deterministic tenant data without authenticating the seeder process', function (): void {
    $this->seed();
    $this->seed();

    expect(auth()->check())->toBeFalse()
        ->and(User::withoutTenantScope()->where('email', 'admin@sentinel.local')->count())->toBe(1)
        ->and(User::withoutTenantScope()->whereNull('tenant_id')->exists())->toBeFalse()
        ->and(Device::withoutTenantScope()->whereNull('tenant_id')->exists())->toBeFalse()
        ->and(TelemetryLog::withoutTenantScope()->whereNull('tenant_id')->exists())->toBeFalse()
        ->and(SecurityEvent::withoutTenantScope()->whereNull('tenant_id')->exists())->toBeFalse()
        ->and(Incident::withoutTenantScope()->whereNull('tenant_id')->exists())->toBeFalse();
});
