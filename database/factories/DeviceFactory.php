<?php

namespace Database\Factories;

use App\Models\Device;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Device>
 */
class DeviceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement([
            Device::TYPE_TEMPERATURE_SENSOR,
            Device::TYPE_DOOR_LOCK,
            Device::TYPE_POWER_METER,
            Device::TYPE_AIR_QUALITY,
            Device::TYPE_WATER_LEAK,
        ]);

        $building = 'building-'.fake()->randomElement(['a', 'b', 'c']);
        $room = fake()->randomElement(['lab-a', 'lab-b', 'office', 'lobby', 'server-room']);

        return [
            'device_id' => str_replace('_', '-', $type).'-'.fake()->unique()->numberBetween(100, 999),
            'name' => fake()->words(2, true),
            'type' => $type,
            'location' => $building.'/'.$room,
            'status' => fake()->randomElement([
                Device::STATUS_ONLINE,
                Device::STATUS_OFFLINE,
                Device::STATUS_UNKNOWN,
            ]),
            'last_seen_at' => fake()->dateTimeBetween('-1 hour', 'now'),
            'metadata_json' => [
                'firmware' => 'v'.fake()->numerify('#.#.#'),
                'building' => $building,
                'room' => $room,
            ],
        ];
    }

    public function online(): static
    {
        return $this->state(fn () => [
            'status' => Device::STATUS_ONLINE,
            'last_seen_at' => now(),
        ]);
    }

    public function offline(): static
    {
        return $this->state(fn () => [
            'status' => Device::STATUS_OFFLINE,
            'last_seen_at' => now()->subHours(2),
        ]);
    }
}
