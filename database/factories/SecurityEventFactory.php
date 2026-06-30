<?php

namespace Database\Factories;

use App\Models\Device;
use App\Models\SecurityEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SecurityEvent>
 */
class SecurityEventFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $eventType = fake()->randomElement([
            SecurityEvent::TYPE_MALFORMED_PAYLOAD,
            SecurityEvent::TYPE_DEVICE_SPOOFING,
            SecurityEvent::TYPE_UNAUTHORIZED_PUBLISH,
            SecurityEvent::TYPE_PUBLISH_FLOOD,
        ]);

        $severity = match ($eventType) {
            SecurityEvent::TYPE_MALFORMED_PAYLOAD => SecurityEvent::SEVERITY_MEDIUM,
            SecurityEvent::TYPE_DEVICE_SPOOFING => SecurityEvent::SEVERITY_HIGH,
            SecurityEvent::TYPE_UNAUTHORIZED_PUBLISH => SecurityEvent::SEVERITY_HIGH,
            SecurityEvent::TYPE_PUBLISH_FLOOD => SecurityEvent::SEVERITY_HIGH,
            default => SecurityEvent::SEVERITY_LOW,
        };

        $device = Device::inRandomOrder()->first() ?? Device::factory()->create();

        return [
            'tenant_id' => $device->tenant_id,
            'event_type' => $eventType,
            'severity' => $severity,
            'source_client_id' => $device->device_id,
            'topic' => fake()->text(50),
            'payload_json' => [
                'raw' => fake()->sentence(),
            ],
            'description' => fake()->sentence(),
            'detected_at' => fake()->dateTimeBetween('-1 day', 'now'),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (SecurityEvent $event) {
            if (! $event->tenant_id && $event->device) {
                $event->tenant_id = $event->device->tenant_id;
                $event->save();
            }
        });
    }

    public function severity(string $severity): static
    {
        return $this->state(fn () => ['severity' => $severity]);
    }

    public function ofType(string $eventType): static
    {
        return $this->state(fn () => ['event_type' => $eventType]);
    }
}
