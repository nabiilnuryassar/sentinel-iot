<?php

namespace Database\Factories;

use App\Models\Incident;
use App\Models\IncidentReport;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IncidentReport>
 */
class IncidentReportFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $incident = Incident::factory()->create();
        $generatedAt = fake()->dateTimeBetween('-1 day', 'now');

        return [
            'tenant_id' => $incident->tenant_id,
            'incident_id' => $incident->id,
            'report_markdown' => '# '.fake()->sentence()."\n\n".
                "## Summary\n\n".fake()->paragraph()."\n\n".
                "## Root Cause\n\n".fake()->paragraph()."\n\n".
                "## Recommendation\n\n- ".fake()->sentence()."\n- ".fake()->sentence(),
            'generated_by' => fake()->randomElement(['agent', 'admin@sentinel.local']),
            'generated_at' => $generatedAt,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (IncidentReport $report) {
            if ($report->incident) {
                $report->tenant_id = $report->incident->tenant_id;
                $report->save();
            }
        });
    }
}
