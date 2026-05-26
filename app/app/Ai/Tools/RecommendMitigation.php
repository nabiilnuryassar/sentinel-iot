<?php

namespace App\Ai\Tools;

use App\Models\SecurityEvent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

/**
 * RecommendMitigation.
 *
 * Read-only. Loads a `SecurityEvent` and attaches canned mitigation hints
 * keyed by `event_type`. The LLM uses these hints as grounding, not as the
 * final recommendation.
 */
class RecommendMitigation implements Tool
{
    /**
     * @var array<string, list<string>>
     */
    protected const HINTS = [
        SecurityEvent::TYPE_MALFORMED_PAYLOAD => [
            'Validate device firmware version and payload schema.',
            'Check ingestor schema rules for the affected topic.',
            'Quarantine the device until payloads validate cleanly.',
        ],
        SecurityEvent::TYPE_DEVICE_SPOOFING => [
            'Rotate device credentials immediately.',
            'Enable broker ACL enforcement on the affected topic.',
            'Block the offending source_client_id at the broker.',
        ],
        SecurityEvent::TYPE_UNAUTHORIZED_PUBLISH => [
            'Verify Mosquitto ACL for the topic and client.',
            'Audit recent client connections for anomalies.',
            'Tighten the ACL to least-privilege for the device.',
        ],
        SecurityEvent::TYPE_PUBLISH_FLOOD => [
            'Rate-limit the offending client at the broker level.',
            'Block the client_id and notify the device owner.',
            'Increase ingestor flood-detection thresholds if false positive.',
        ],
    ];

    public function description(): Stringable|string
    {
        return 'Look up a specific security event and return canned mitigation hints based on its event_type. Use this when the user asks "what should we do about event #N" or wants concrete next-step ideas.';
    }

    public function handle(Request $request): Stringable|string
    {
        $eventId = (int) $request['event_id'];
        $event = SecurityEvent::query()->find($eventId);

        if ($event === null) {
            return (string) json_encode([
                'event_id' => $eventId,
                'found' => false,
                'canned_hints' => ['Investigate logs', 'Check device health'],
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        $hints = self::HINTS[$event->event_type] ?? [
            'Investigate logs for the affected topic and client.',
            'Check device health and recent telemetry.',
        ];

        return (string) json_encode([
            'event_id' => $event->id,
            'found' => true,
            'event' => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'severity' => $event->severity,
                'source_client_id' => $event->source_client_id,
                'topic' => $event->topic,
                'description' => $event->description,
                'detected_at' => $event->detected_at?->toIso8601String(),
            ],
            'canned_hints' => $hints,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'event_id' => $schema->integer()
                ->description('The numeric id of the security_events row.')
                ->required(),
        ];
    }
}
