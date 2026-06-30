<?php

namespace Database\Factories;

use App\Models\Device;
use App\Models\TelemetryLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TelemetryLog>
 */
class TelemetryLogFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $device = Device::query()->inRandomOrder()->first()
            ?? Device::factory()->create();

        $receivedAt = fake()->dateTimeBetween('-1 hour', 'now');
        $building = fake()->randomElement(['building-a', 'building-b', 'building-c']);
        $room = fake()->randomElement(['lab-a', 'lab-b', 'office']);
        $topic = "iot/{$building}/{$room}/{$device->device_id}/telemetry";

        $temperature = fake()->randomFloat(2, 18, 32);
        $humidity = fake()->randomFloat(2, 30, 80);
        $battery = fake()->randomFloat(2, 20, 100);
        $rssi = fake()->numberBetween(-90, -40);

        return [
            'tenant_id' => $device->tenant_id,
            'device_id' => $device->device_id,
            'topic' => $topic,
            'payload_json' => [
                'device_id' => $device->device_id,
                'type' => 'telemetry',
                'timestamp' => $receivedAt->format(DATE_ATOM),
                'location' => "{$building}/{$room}",
                'temperature' => $temperature,
                'humidity' => $humidity,
                'battery' => $battery,
                'rssi' => $rssi,
            ],
            'temperature' => $temperature,
            'humidity' => $humidity,
            'battery' => $battery,
            'rssi' => $rssi,
            'received_at' => $receivedAt,
        ];
    }
}
