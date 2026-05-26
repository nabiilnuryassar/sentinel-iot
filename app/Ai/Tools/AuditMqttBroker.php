<?php

namespace App\Ai\Tools;

use App\Models\DevicePolicy;
use App\Models\SecurityEvent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

/**
 * AuditMqttBroker.
 *
 * Read-only. Compares `device_policies` rows against the last 24h of
 * `security_events`, grouped by `source_client_id`. Phase 2 ingestor does
 * not yet populate `source_client_id` (paho-mqtt v2 limitation), so the
 * audit will mostly note "no per-client data available" — that is fine
 * and preserved as a `notes` field for the agent to relay verbatim.
 */
class AuditMqttBroker implements Tool
{
    public function description(): Stringable|string
    {
        return 'Audit the MQTT broker by comparing configured device_policies against the last 24h of security_events. Returns counts, event-type histogram, and any policy violations. Use this for "audit the broker" or "are there policy gaps" type questions.';
    }

    public function handle(Request $request): Stringable|string
    {
        $since = now()->subHours(24);

        $policies = DevicePolicy::query()->get(['id', 'device_id', 'allowed_client_id', 'allowed_topic', 'can_publish', 'can_subscribe', 'is_active']);
        $events = SecurityEvent::query()
            ->where('detected_at', '>=', $since)
            ->get(['id', 'event_type', 'severity', 'source_client_id', 'topic', 'detected_at']);

        $eventsByType = $events->groupBy('event_type')->map->count()->toArray();
        $eventsByClient = $events->groupBy(fn (SecurityEvent $event) => $event->source_client_id ?? '_null_')->map->count()->toArray();

        $violations = $events
            ->filter(fn (SecurityEvent $event) => $event->source_client_id !== null)
            ->map(function (SecurityEvent $event) use ($policies) {
                $matchingPolicy = $policies->first(fn (DevicePolicy $policy) => $policy->allowed_client_id === $event->source_client_id);

                return [
                    'event_id' => $event->id,
                    'event_type' => $event->event_type,
                    'source_client_id' => $event->source_client_id,
                    'topic' => $event->topic,
                    'has_matching_policy' => $matchingPolicy !== null,
                    'policy_active' => $matchingPolicy?->is_active,
                ];
            })
            ->values()
            ->all();

        $hasNullSource = $events->whereNull('source_client_id')->isNotEmpty();

        return (string) json_encode([
            'policies_count' => $policies->count(),
            'active_policies' => $policies->where('is_active', true)->count(),
            'events_last_24h' => $events->count(),
            'events_by_type' => $eventsByType,
            'events_by_client' => $eventsByClient,
            'policy_violations' => $violations,
            'notes' => $hasNullSource
                ? 'Some events have null source_client_id (paho-mqtt v2 limitation in the Phase 2 ingestor); per-client audit is partial.'
                : 'All events carry a source_client_id.',
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
