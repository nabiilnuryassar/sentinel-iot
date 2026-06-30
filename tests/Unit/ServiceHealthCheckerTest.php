<?php

use App\Services\ServiceHealthChecker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('returns an entry for every infrastructure service', function (): void {
    Http::fake([
        'localhost:8001/health' => Http::response(['version' => 'v1.8.3'], 200),
        'localhost:8086/ping' => Http::response('', 204),
    ]);

    $result = app(ServiceHealthChecker::class)->check();

    expect($result)->toBeArray()
        ->and($result)->toHaveCount(6);

    $laravel = collect($result)->firstWhere('name', 'Laravel App');
    expect($laravel)->not->toBeNull()
        ->and($laravel['status'])->toBe('healthy');

    foreach ($result as $service) {
        expect($service)->toHaveKeys(['name', 'version', 'status', 'icon']);
    }
});

it('returns error status when MQTT host is unreachable', function (): void {
    Http::fake();
    config(['services.mqtt.host' => '192.0.2.1']);
    config(['services.mqtt.port' => 1]);

    $result = app(ServiceHealthChecker::class)->check();

    $mqtt = collect($result)->firstWhere('name', 'Mosquitto MQTT Broker');
    expect($mqtt['status'])->toBe('error');
});
