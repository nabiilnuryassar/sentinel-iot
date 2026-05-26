<?php

use App\Ai\Tools\AuditMqttBroker;
use App\Models\DevicePolicy;
use App\Models\SecurityEvent;
use Laravel\Ai\Tools\Request;

it('compares device_policies to last-24h security events and notes null clients', function (): void {
    DevicePolicy::factory()->create([
        'device_id' => 'temp-001',
        'allowed_client_id' => 'temp-001',
        'is_active' => true,
    ]);

    SecurityEvent::factory()->ofType(SecurityEvent::TYPE_MALFORMED_PAYLOAD)->create([
        'source_client_id' => 'temp-001',
        'detected_at' => now()->subHours(2),
    ]);
    SecurityEvent::factory()->ofType(SecurityEvent::TYPE_DEVICE_SPOOFING)->create([
        'source_client_id' => null,
        'detected_at' => now()->subHours(1),
    ]);
    SecurityEvent::factory()->ofType(SecurityEvent::TYPE_PUBLISH_FLOOD)->create([
        'source_client_id' => 'attacker-client',
        'detected_at' => now()->subHours(3),
    ]);
    SecurityEvent::factory()->create([
        'detected_at' => now()->subDays(2), // outside window
    ]);

    $payload = json_decode((new AuditMqttBroker)->handle(new Request), true);

    expect($payload['policies_count'])->toBe(1)
        ->and($payload['active_policies'])->toBe(1)
        ->and($payload['events_last_24h'])->toBe(3)
        ->and($payload['events_by_type'])->toHaveKey(SecurityEvent::TYPE_MALFORMED_PAYLOAD, 1)
        ->and($payload['events_by_type'])->toHaveKey(SecurityEvent::TYPE_DEVICE_SPOOFING, 1)
        ->and($payload['events_by_type'])->toHaveKey(SecurityEvent::TYPE_PUBLISH_FLOOD, 1)
        ->and($payload['policy_violations'])->toHaveCount(2);

    $byClient = collect($payload['policy_violations'])->keyBy('source_client_id');
    expect($byClient['temp-001']['has_matching_policy'])->toBeTrue()
        ->and($byClient['attacker-client']['has_matching_policy'])->toBeFalse()
        ->and($payload['notes'])->toContain('null source_client_id');
});

it('reports cleanly when nothing happened in the last 24h', function (): void {
    $payload = json_decode((new AuditMqttBroker)->handle(new Request), true);

    expect($payload['policies_count'])->toBe(0)
        ->and($payload['events_last_24h'])->toBe(0)
        ->and($payload['policy_violations'])->toBe([]);
});
