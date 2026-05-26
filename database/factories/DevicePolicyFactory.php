<?php

namespace Database\Factories;

use App\Models\Device;
use App\Models\DevicePolicy;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DevicePolicy>
 */
class DevicePolicyFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $deviceId = Device::query()->inRandomOrder()->value('device_id')
            ?? Device::factory()->create()->device_id;

        return [
            'device_id' => $deviceId,
            'allowed_client_id' => $deviceId,
            'allowed_topic' => "iot/+/+/{$deviceId}/#",
            'can_publish' => true,
            'can_subscribe' => false,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
