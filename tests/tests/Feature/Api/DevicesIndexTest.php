<?php

use App\Models\Device;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('returns 401 without a token', function (): void {
    $this->getJson(route('api.devices.index'))->assertUnauthorized();
});

it('returns paginated DeviceResource collection with token', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    Device::factory()->online()->count(2)->create();
    Device::factory()->offline()->count(1)->create();

    $response = $this->getJson(route('api.devices.index'))->assertOk();

    $response->assertJsonStructure([
        'data' => [
            ['id', 'device_id', 'name', 'type', 'location', 'status', 'last_seen_at', 'is_online'],
        ],
        'links' => ['first', 'last', 'prev', 'next'],
        'meta' => ['current_page', 'from', 'last_page', 'path', 'per_page', 'to', 'total'],
    ]);

    expect($response->json('meta.total'))->toBe(3);
});

it('filters by ?status=online', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    Device::factory()->online()->count(2)->create();
    Device::factory()->offline()->count(3)->create();

    $response = $this->getJson(route('api.devices.index', ['status' => 'online']))->assertOk();

    expect($response->json('meta.total'))->toBe(2);

    foreach ($response->json('data') as $device) {
        expect($device['is_online'])->toBeTrue();
    }
});

it('filters by ?status=offline', function (): void {
    Sanctum::actingAs(User::factory()->create(), ['*']);

    Device::factory()->online()->count(2)->create();
    Device::factory()->offline()->count(3)->create();

    $response = $this->getJson(route('api.devices.index', ['status' => 'offline']))->assertOk();

    expect($response->json('meta.total'))->toBe(3);

    foreach ($response->json('data') as $device) {
        expect($device['is_online'])->toBeFalse();
    }
});
