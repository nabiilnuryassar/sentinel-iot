<?php

it('returns ok and a parseable timestamp without auth', function (): void {
    $response = $this->getJson(route('api.health'));

    $response->assertOk()
        ->assertJsonStructure(['status', 'timestamp'])
        ->assertJson(['status' => 'ok']);

    $timestamp = $response->json('timestamp');

    expect($timestamp)->toBeString();
    expect(strtotime($timestamp))->not->toBeFalse();
});
