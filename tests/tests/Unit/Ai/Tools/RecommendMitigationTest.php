<?php

use App\Ai\Tools\RecommendMitigation;
use App\Models\SecurityEvent;
use Laravel\Ai\Tools\Request;

it('returns event details plus type-specific hints for a known event', function (): void {
    $event = SecurityEvent::factory()
        ->ofType(SecurityEvent::TYPE_DEVICE_SPOOFING)
        ->create();

    $payload = json_decode(
        (new RecommendMitigation)->handle(new Request(['event_id' => $event->id])),
        true
    );

    expect($payload['found'])->toBeTrue()
        ->and($payload['event']['id'])->toBe($event->id)
        ->and($payload['event']['event_type'])->toBe(SecurityEvent::TYPE_DEVICE_SPOOFING)
        ->and($payload['canned_hints'])->toBeArray()
        ->and(implode(' ', $payload['canned_hints']))
        ->toContain('Block', 'ACL');
});

it('returns generic hints when the event type is unrecognized', function (): void {
    $event = SecurityEvent::factory()->create([
        'event_type' => 'unknown_thing',
    ]);

    $payload = json_decode(
        (new RecommendMitigation)->handle(new Request(['event_id' => $event->id])),
        true
    );

    expect($payload['found'])->toBeTrue()
        ->and($payload['canned_hints'])->not->toBeEmpty();
});

it('handles a missing event id gracefully', function (): void {
    $payload = json_decode(
        (new RecommendMitigation)->handle(new Request(['event_id' => 99999])),
        true
    );

    expect($payload['found'])->toBeFalse()
        ->and($payload['canned_hints'])->not->toBeEmpty();
});
