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
        $device = Device::query()->inRandomOrder()->first() ?? Device::factory()->create();

        return [
            'tenant_id' => $device->tenant_id,
            'device_id' => $device->device_id,
            'allowed_client_id' => $device->device_id,
            'allowed_topic' => "iot/+/+/{$device->device_id}/#",
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
