<?php

it('returns detailed health with database and mqtt checks', function (): void {
    $response = $this->getJson(route('api.health.detailed'));

    // Accept both 200 (all ok) and 503 (mqtt unreachable in test env)
    expect($response->status())->toBeIn([200, 503]);

    $response->assertJsonStructure([
        'status',
        'checks' => ['database', 'mqtt'],
        'timestamp',
    ]);

    // Database check must pass (SQLite in-memory in test env)
    $response->assertJson(['checks' => ['database' => 'ok']]);

    // Status reflects aggregate health
    $mqttStatus = $response->json('checks.mqtt');
    if ($mqttStatus === 'ok') {
        $response->assertJson(['status' => 'ok']);
    } else {
        $response->assertJson(['status' => 'degraded']);
    }

    $timestamp = $response->json('timestamp');
    expect($timestamp)->toBeString();
    expect(strtotime($timestamp))->not->toBeFalse();
});
