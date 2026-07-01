<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\Incident;
use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

/**
 * DemoSeeder.
 *
 * Idempotent demo dataset for the Phase 7 walkthrough. Truncates the runtime
 * tables (devices, telemetry_logs, security_events, incidents,
 * incident_reports, agent_messages, device_policies, agent_conversations,
 * agent_conversation_messages) without touching `users` or migrations, then
 * re-seeds the five simulator profiles, an hour of telemetry, five security
 * events, and two open incidents. Finishes by issuing a fresh Sanctum `bot`
 * token and printing it as `BOT_API_TOKEN=*** so the demo runner can
 * paste it into the Telegram bot's env.
 *
 * Run via: `php artisan db:seed --class=DemoSeeder --no-interaction`.
 */
class DemoSeeder extends Seeder
{
    /**
     * Tables we control on every demo run. Order matters for FK-aware DBs:
     * children before parents (FKs use ON DELETE CASCADE in this project,
     * but we truncate in dependency order anyway to stay portable).
     *
     * @var list<string>
     */
    protected array $resetTables = [
        'incident_reports',
        'incidents',
        'security_events',
        'telemetry_logs',
        'devices',
        'device_policies',
        'agent_messages',
        'agent_conversation_messages',
        'agent_conversations',
    ];

    public function run(): void
    {
        $this->truncateRuntimeTables();

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@sentinel.local'],
            [
                'name' => 'Sentinel Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $devices = $this->seedDevices();
        $this->seedTelemetry($devices);
        $events = $this->seedSecurityEvents();
        $this->seedIncidents($admin, $events);

        $this->issueBotToken($admin);
    }

    /**
     * Truncate the demo-mutable tables. We avoid `migrate:fresh` so users
     * (admin) and personal_access_tokens stay intact across runs — only the
     * bot token is rotated explicitly below.
     */
    protected function truncateRuntimeTables(): void
    {
        foreach ($this->resetTables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            // PG/MySQL portability: TRUNCATE ... RESTART IDENTITY CASCADE on
            // pgsql, plain truncate on others.
            $driver = DB::connection()->getDriverName();
            if ($driver === 'pgsql') {
                DB::statement("TRUNCATE TABLE {$table} RESTART IDENTITY CASCADE");
            } else {
                DB::table($table)->truncate();
            }
        }
    }

    /**
     * @return array<string, Device>
     */
    protected function seedDevices(): array
    {
        /**
         * Mirror simulator/device_profiles.json so the dashboard matches what
         * a live simulator run produces.
         *
         * @var list<array{device_id: string, name: string, type: string, location: string, status: string, building: string, room: string}>
         */
        $profiles = [
            [
                'device_id' => 'temp-sensor-001',
                'name' => 'Temperature Sensor 001',
                'type' => Device::TYPE_TEMPERATURE_SENSOR,
                'location' => 'lab-a',
                'status' => Device::STATUS_ONLINE,
                'building' => 'building-a',
                'room' => 'lab-a',
            ],
            [
                'device_id' => 'door-lock-001',
                'name' => 'Door Lock 001',
                'type' => Device::TYPE_DOOR_LOCK,
                'location' => 'lobby',
                'status' => Device::STATUS_ONLINE,
                'building' => 'building-a',
                'room' => 'lobby',
            ],
            [
                'device_id' => 'power-meter-001',
                'name' => 'Power Meter 001',
                'type' => Device::TYPE_POWER_METER,
                'location' => 'server-room',
                'status' => Device::STATUS_ONLINE,
                'building' => 'building-a',
                'room' => 'server-room',
            ],
            [
                'device_id' => 'air-quality-001',
                'name' => 'Air Quality Monitor 001',
                'type' => Device::TYPE_AIR_QUALITY,
                'location' => 'lab-a',
                'status' => Device::STATUS_ONLINE,
                'building' => 'building-a',
                'room' => 'lab-a',
            ],
            [
                'device_id' => 'water-leak-001',
                'name' => 'Water Leak Detector 001',
                'type' => Device::TYPE_WATER_LEAK,
                'location' => 'server-room',
                'status' => Device::STATUS_ONLINE,
                'building' => 'building-a',
                'room' => 'server-room',
            ],
        ];

        $devices = [];
        foreach ($profiles as $profile) {
            $devices[$profile['device_id']] = Device::query()->create([
                'tenant_id' => 1,
                'device_id' => $profile['device_id'],
                'name' => $profile['name'],
                'type' => $profile['type'],
                'location' => $profile['location'],
                'status' => $profile['status'],
                'last_seen_at' => now(),
                'metadata_json' => [
                    'firmware' => 'v1.0.0',
                    'building' => $profile['building'],
                    'room' => $profile['room'],
                ],
            ]);
        }

        return $devices;
    }

    /**
     * 30 telemetry rows per device across the past hour, ~2 min apart, so
     * the dashboard chart renders a non-flat line and the "telemetry today"
     * counter has real data.
     *
     * @param  array<string, Device>  $devices
     */
    protected function seedTelemetry(array $devices): void
    {
        $rows = [];
        $now = now();

        foreach ($devices as $device) {
            $building = $device->metadata_json['building'] ?? 'building-a';
            $room = $device->metadata_json['room'] ?? 'lab-a';
            $topic = "iot/{$building}/{$room}/{$device->device_id}/telemetry";

            for ($i = 0; $i < 30; $i++) {
                $receivedAt = $now->copy()->subSeconds($i * 120 + random_int(0, 30));

                $temperature = $this->randomFloat(22.0, 31.5, 1);
                $humidity = $this->randomFloat(45.0, 78.0, 1);
                $battery = $this->randomFloat(75.0, 100.0, 1);
                $rssi = random_int(-85, -55);

                $rows[] = [
                    'tenant_id' => 1,
                    'device_id' => $device->device_id,
                    'topic' => $topic,
                    'payload_json' => json_encode([
                        'device_id' => $device->device_id,
                        'type' => $device->type,
                        'timestamp' => $receivedAt->toAtomString(),
                        'location' => "{$building}/{$room}",
                        'temperature' => $temperature,
                        'humidity' => $humidity,
                        'battery' => $battery,
                        'rssi' => $rssi,
                    ]),
                    'temperature' => $temperature,
                    'humidity' => $humidity,
                    'battery' => $battery,
                    'rssi' => $rssi,
                    'received_at' => $receivedAt,
                    'created_at' => $receivedAt,
                ];
            }
        }

        // Bulk insert keeps the seeder fast (5 * 30 = 150 rows).
        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table((new TelemetryLog)->getTable())->insert($chunk);
        }
    }

    /**
     * @return array{spoof: SecurityEvent, malformed_a: SecurityEvent, malformed_b: SecurityEvent, flood: SecurityEvent, unauthorized: SecurityEvent}
     */
    protected function seedSecurityEvents(): array
    {
        $now = now();

        $malformedA = SecurityEvent::query()->create([
            'tenant_id' => 1,
            'event_type' => SecurityEvent::TYPE_MALFORMED_PAYLOAD,
            'severity' => SecurityEvent::SEVERITY_MEDIUM,
            'source_client_id' => 'temp-sensor-001',
            'topic' => 'iot/building-a/lab-a/temp-sensor-001/telemetry',
            'payload_json' => ['raw' => 'not-json{{'],
            'description' => 'Telemetry payload was not valid JSON.',
            'detected_at' => $now->copy()->subMinutes(42),
        ]);

        $malformedB = SecurityEvent::query()->create([
            'tenant_id' => 1,
            'event_type' => SecurityEvent::TYPE_MALFORMED_PAYLOAD,
            'severity' => SecurityEvent::SEVERITY_MEDIUM,
            'source_client_id' => 'temp-sensor-001',
            'topic' => 'iot/building-a/lab-a/temp-sensor-001/telemetry',
            'payload_json' => ['raw' => '{"device_id":"temp-sensor-001"'],
            'description' => 'Telemetry payload missing required fields.',
            'detected_at' => $now->copy()->subMinutes(28),
        ]);

        $spoof = SecurityEvent::query()->create([
            'tenant_id' => 1,
            'event_type' => SecurityEvent::TYPE_DEVICE_SPOOFING,
            'severity' => SecurityEvent::SEVERITY_HIGH,
            'source_client_id' => 'attacker-client',
            'topic' => 'iot/building-a/lab-a/temp-sensor-001/telemetry',
            'payload_json' => [
                'device_id' => 'evil-sensor',
                'topic_device_id' => 'temp-sensor-001',
            ],
            'description' => 'Payload device_id (evil-sensor) does not match topic device_id (temp-sensor-001).',
            'detected_at' => $now->copy()->subMinutes(14),
        ]);

        $flood = SecurityEvent::query()->create([
            'tenant_id' => 1,
            'event_type' => SecurityEvent::TYPE_PUBLISH_FLOOD,
            'severity' => SecurityEvent::SEVERITY_HIGH,
            'source_client_id' => 'noisy-client',
            'topic' => 'iot/building-a/lab-a/temp-sensor-001/telemetry',
            'payload_json' => [
                'window_seconds' => 10,
                'message_count' => 412,
            ],
            'description' => 'Source client exceeded the per-client rate window (412 msgs / 10s).',
            'detected_at' => $now->copy()->subMinutes(8),
        ]);

        $unauthorized = SecurityEvent::query()->create([
            'tenant_id' => 1,
            'event_type' => SecurityEvent::TYPE_UNAUTHORIZED_PUBLISH,
            'severity' => SecurityEvent::SEVERITY_CRITICAL,
            'source_client_id' => 'attacker-client',
            'topic' => 'iot/building-a/server-room/power-meter-001/telemetry',
            'payload_json' => [
                'attempted_topic' => 'iot/building-a/server-room/power-meter-001/telemetry',
                'broker_response' => 'Connection rejected: not authorised',
            ],
            'description' => 'Mosquitto rejected publish from non-allowlisted client.',
            'detected_at' => $now->copy()->subMinutes(3),
        ]);

        return [
            'malformed_a' => $malformedA,
            'malformed_b' => $malformedB,
            'spoof' => $spoof,
            'flood' => $flood,
            'unauthorized' => $unauthorized,
        ];
    }

    /**
     * Two open incidents: a high-severity one tied to the spoof event (no
     * report yet — the demo's "Generate report" click writes the first one),
     * and a medium-severity one referencing the malformed payload bursts.
     *
     * @param  array<string, SecurityEvent>  $events
     */
    protected function seedIncidents(User $admin, array $events): void
    {
        Incident::query()->create([
            'tenant_id' => 1,
            'title' => 'Unauthorized publish attempt detected',
            'severity' => Incident::SEVERITY_HIGH,
            'status' => Incident::STATUS_OPEN,
            'affected_device_id' => 'temp-sensor-001',
            'summary' => 'A non-allowlisted client tried to spoof temp-sensor-001 telemetry. '
                .'Source: SecurityEvent #'.$events['spoof']->id.'.',
            'root_cause' => null,
            'recommendation' => null,
            'created_by' => $admin->id,
            'created_at' => Carbon::now()->subMinutes(13),
            'updated_at' => Carbon::now()->subMinutes(13),
        ]);

        Incident::query()->create([
            'tenant_id' => 1,
            'title' => 'Repeated malformed payloads from temp-sensor-001',
            'severity' => Incident::SEVERITY_MEDIUM,
            'status' => Incident::STATUS_OPEN,
            'affected_device_id' => 'temp-sensor-001',
            'summary' => 'Two malformed payloads observed within ~14 minutes from temp-sensor-001. '
                .'Possible firmware issue or man-in-the-middle. '
                .'Source: SecurityEvent #'.$events['malformed_a']->id
                .' and #'.$events['malformed_b']->id.'.',
            'root_cause' => null,
            'recommendation' => null,
            'created_by' => $admin->id,
            'created_at' => Carbon::now()->subMinutes(27),
            'updated_at' => Carbon::now()->subMinutes(27),
        ]);
    }

    /**
     * Rotate the bot token and surface it via the command output line so a
     * `make` target can pipe `php artisan db:seed --class=DemoSeeder | grep
     * BOT_API_TOKEN`.
     */
    protected function issueBotToken(User $admin): void
    {
        $admin->tokens()->where('name', 'bot')->delete();
        $token = $admin->createToken('bot')->plainTextToken;

        $admin->tokens()->where("name", "bot")->delete();
        $token = $admin->createToken("bot")->plainTextToken;
        $this->command->info("BOT_API_TOKEN={$token}");
    }

    protected function randomFloat(float $min, float $max, int $decimals): float
    {
        $scale = 10 ** $decimals;
        $value = random_int((int) ($min * $scale), (int) ($max * $scale)) / $scale;

        return round($value, $decimals);
    }
}