<?php

use App\Models\Incident;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('returns 401 without a token', function (): void {
    $this->getJson(route('api.incidents.index'))->assertUnauthorized();
});

it('returns paginated IncidentResource collection with token', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    Incident::factory()->open()->count(2)->create();
    Incident::factory()->count(1)->create(['status' => Incident::STATUS_CLOSED]);

    $response = $this->getJson(route('api.incidents.index'))->assertOk();

    $response->assertJsonStructure([
        'data' => [
            [
                'id', 'title', 'severity', 'status', 'affected_device_id',
                'summary', 'root_cause', 'recommendation',
                'created_at', 'updated_at',
            ],
        ],
        'links',
        'meta' => ['current_page', 'total'],
    ]);

    expect($response->json('meta.total'))->toBe(3);
});

it('filters by ?status=open (open + investigating)', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    Incident::factory()->count(1)->create(['status' => Incident::STATUS_OPEN]);
    Incident::factory()->count(1)->create(['status' => Incident::STATUS_INVESTIGATING]);
    Incident::factory()->count(1)->create(['status' => Incident::STATUS_CLOSED]);
    Incident::factory()->count(1)->create(['status' => Incident::STATUS_MITIGATED]);

    $response = $this->getJson(route('api.incidents.index', ['status' => 'open']))->assertOk();

    expect($response->json('meta.total'))->toBe(2);

    foreach ($response->json('data') as $incident) {
        expect($incident['status'])->toBeIn(['open', 'investigating']);
    }
});
