<?php

use App\Ai\Agents\IncidentAnalyst;
use App\Models\AgentMessage;
use App\Models\Incident;
use App\Models\IncidentReport;
use App\Models\User;
use Laravel\Ai\Ai;
use Laravel\Sanctum\Sanctum;

it('returns 401 without a token', function (): void {
    $incident = Incident::factory()->create();

    $this->postJson(route('api.agent.analyze-incident', $incident))->assertUnauthorized();
});

it('runs IncidentAnalyst, persists a report, and updates the incident', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    $incident = Incident::factory()->create([
        'severity' => Incident::SEVERITY_LOW,
        'recommendation' => 'old',
        'summary' => 'old summary',
        'root_cause' => 'old cause',
    ]);

    Ai::fakeAgent(IncidentAnalyst::class, [[
        'severity' => 'high',
        'summary' => 'Spoofed payload detected.',
        'root_cause' => 'Attacker-client published to a temp-sensor topic.',
        'impact' => 'Lab telemetry reliability compromised.',
        'recommendation' => 'Block attacker-client at the broker.',
        'recommendations' => [
            'Block attacker-client at the broker.',
            'Rotate device credentials.',
            'Audit ACLs.',
        ],
        'report_markdown' => "# Incident Report\n\n## Summary\nSpoofed payload detected.\n",
    ]]);

    $response = $this->postJson(route('api.agent.analyze-incident', $incident))
        ->assertOk()
        ->assertJsonStructure([
            'severity', 'summary', 'root_cause', 'impact',
            'recommendation', 'recommendations', 'report_markdown',
            'conversation_id', 'incident_report_id',
        ]);

    expect($response->json('severity'))->toBe('high');

    $incident->refresh();
    expect($incident->severity)->toBe('high')
        ->and($incident->recommendation)->toBe('Block attacker-client at the broker.')
        ->and($incident->summary)->toBe('Spoofed payload detected.');

    expect(IncidentReport::query()->where('incident_id', $incident->id)->count())->toBe(1);

    $row = AgentMessage::query()->first();
    expect($row->source)->toBe(AgentMessage::SOURCE_TELEGRAM)
        ->and($row->prompt)->toContain("Analyze incident #{$incident->id}");
});

it('returns 404 for an unknown incident id', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    $this->postJson('/api/agent/analyze-incident/999999')->assertNotFound();
});
