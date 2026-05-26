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
        $deviceId = Device::query()->inRandomOrder()->value('device_id')
            ?? Device::factory()->create()->device_id;

        $receivedAt = fake()->dateTimeBetween('-1 hour', 'now');
        $building = fake()->randomElement(['building-a', 'building-b', 'building-c']);
        $room = fake()->randomElement(['lab-a', 'lab-b', 'office']);
        $topic = "iot/{$building}/{$room}/{$deviceId}/telemetry";

        $temperature = fake()->randomFloat(2, 18, 32);
        $humidity = fake()->randomFloat(2, 30, 80);
        $battery = fake()->randomFloat(2, 20, 100);
        $rssi = fake()->numberBetween(-90, -40);

        return [
            'device_id' => $deviceId,
            'topic' => $topic,
            'payload_json' => [
                'device_id' => $deviceId,
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
