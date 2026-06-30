<?php

namespace Database\Factories;

use App\Models\AgentMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AgentMessage>
 */
class AgentMessageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::query()->inRandomOrder()->first() ?? User::factory()->create();

        return [
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'source' => fake()->randomElement([
                AgentMessage::SOURCE_WEB,
                AgentMessage::SOURCE_TELEGRAM,
                AgentMessage::SOURCE_SYSTEM,
            ]),
            'prompt' => fake()->sentence(),
            'response' => fake()->paragraph(),
            'metadata_json' => [
                'tool_calls' => [],
                'latency_ms' => fake()->numberBetween(150, 4000),
            ],
        ];
    }

    public function fromTelegram(): static
    {
        return $this->state(fn () => ['source' => AgentMessage::SOURCE_TELEGRAM]);
    }

    public function fromWeb(): static
    {
        return $this->state(fn () => ['source' => AgentMessage::SOURCE_WEB]);
    }
}
