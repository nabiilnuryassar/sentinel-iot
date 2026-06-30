<?php

namespace Database\Factories;

use App\Models\Incident;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Incident>
 */
class IncidentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::query()->inRandomOrder()->first() ?? User::factory()->create();

        return [
            'tenant_id' => $user->tenant_id,
            'title' => 'Incident: '.fake()->sentence(4),
            'severity' => fake()->randomElement([
                Incident::SEVERITY_LOW,
                Incident::SEVERITY_MEDIUM,
                Incident::SEVERITY_HIGH,
                Incident::SEVERITY_CRITICAL,
            ]),
            'status' => fake()->randomElement([
                Incident::STATUS_OPEN,
                Incident::STATUS_INVESTIGATING,
                Incident::STATUS_MITIGATED,
                Incident::STATUS_CLOSED,
            ]),
            'affected_device_id' => fake()->randomElement([
                'temp-sensor-001',
                'door-lock-001',
                'power-meter-001',
                null,
            ]),
            'summary' => fake()->paragraph(),
            'root_cause' => fake()->paragraph(),
            'recommendation' => fake()->paragraph(),
            'created_by' => $user->id,
        ];
    }

    public function open(): static
    {
        return $this->state(fn () => ['status' => Incident::STATUS_OPEN]);
    }

    public function severity(string $severity): static
    {
        return $this->state(fn () => ['severity' => $severity]);
    }
}
