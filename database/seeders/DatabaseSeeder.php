<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\Incident;
use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Produces a deterministic baseline that mirrors PRD §12.1's simulator
     * profiles so the dashboard renders sensible numbers immediately after a
     * fresh install. Demo-only data lives in `DemoSeeder` (Phase 7).
     */
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'default')->firstOrFail();

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@sentinel.local', 'tenant_id' => $tenant->id],
            [
                'name' => 'Sentinel Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'tenant_id' => $tenant->id,
            ],
        );

        /**
         * Five devices matching the simulator profiles from Phase 1.
         *
         * @var list<array{device_id: string, name: string, type: string, location: string}>
         */
        $deviceProfiles = [
            [
                'device_id' => 'temp-sensor-001',
                'name' => 'Temperature Sensor 001',
                'type' => Device::TYPE_TEMPERATURE_SENSOR,
                'location' => 'building-a/lab-a',
            ],
            [
                'device_id' => 'door-lock-001',
                'name' => 'Door Lock 001',
                'type' => Device::TYPE_DOOR_LOCK,
                'location' => 'building-a/lobby',
            ],
            [
                'device_id' => 'power-meter-001',
                'name' => 'Power Meter 001',
                'type' => Device::TYPE_POWER_METER,
                'location' => 'building-a/server-room',
            ],
            [
                'device_id' => 'air-quality-001',
                'name' => 'Air Quality Monitor 001',
                'type' => Device::TYPE_AIR_QUALITY,
                'location' => 'building-b/office',
            ],
            [
                'device_id' => 'water-leak-001',
                'name' => 'Water Leak Detector 001',
                'type' => Device::TYPE_WATER_LEAK,
                'location' => 'building-b/lab-b',
            ],
        ];

        foreach ($deviceProfiles as $profile) {
            $device = Device::query()->updateOrCreate(
                ['device_id' => $profile['device_id'], 'tenant_id' => $tenant->id],
                [
                    'name' => $profile['name'],
                    'type' => $profile['type'],
                    'location' => $profile['location'],
                    'status' => Device::STATUS_ONLINE,
                    'last_seen_at' => now(),
                    'metadata_json' => [
                        'firmware' => 'v1.0.0',
                        'building' => explode('/', $profile['location'])[0],
                        'room' => explode('/', $profile['location'])[1],
                    ],
                    'tenant_id' => $tenant->id,
                ],
            );

            TelemetryLog::factory()
                ->count(10)
                ->create(['device_id' => $device->device_id, 'tenant_id' => $tenant->id]);
        }

        SecurityEvent::factory()
            ->ofType(SecurityEvent::TYPE_MALFORMED_PAYLOAD)
            ->severity(SecurityEvent::SEVERITY_LOW)
            ->create(['source_client_id' => 'temp-sensor-001', 'tenant_id' => $tenant->id]);

        SecurityEvent::factory()
            ->ofType(SecurityEvent::TYPE_DEVICE_SPOOFING)
            ->severity(SecurityEvent::SEVERITY_MEDIUM)
            ->create(['source_client_id' => 'door-lock-001', 'tenant_id' => $tenant->id]);

        $criticalEvent = SecurityEvent::factory()
            ->ofType(SecurityEvent::TYPE_UNAUTHORIZED_PUBLISH)
            ->severity(SecurityEvent::SEVERITY_HIGH)
            ->create(['source_client_id' => 'attacker-client', 'tenant_id' => $tenant->id]);

        Incident::factory()
            ->open()
            ->severity(Incident::SEVERITY_HIGH)
            ->create([
                'title' => 'Unauthorized publish attempt detected',
                'affected_device_id' => $criticalEvent->source_client_id,
                'summary' => 'A non-allowlisted client tried to publish to a device telemetry topic.',
                'root_cause' => 'Mosquitto ACL rejected the publish; downstream alerting raised an incident.',
                'recommendation' => 'Confirm broker ACL coverage and rotate device credentials if needed.',
                'created_by' => $admin->id,
                'tenant_id' => $tenant->id,
            ]);
    }
}
