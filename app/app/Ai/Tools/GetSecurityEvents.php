<?php

namespace App\Ai\Tools;

use App\Models\SecurityEvent;
use Carbon\CarbonInterface;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

/**
 * GetSecurityEvents.
 *
 * Read-only. Returns recent rows from `security_events`, optionally
 * filtered by `severity` (low/medium/high/critical) and a coarse `since`
 * window keyed off `detected_at`.
 */
class GetSecurityEvents implements Tool
{
    public function description(): Stringable|string
    {
        return 'List recent MQTT security events ordered newest-first. Filter by severity and time window. Use this when the user asks about attacks, threats, anomalies, or specific event types like malformed_payload or device_spoofing.';
    }

    public function handle(Request $request): Stringable|string
    {
        $limit = min(100, max(1, (int) ($request['limit'] ?? 20)));

        $query = SecurityEvent::query()->orderByDesc('detected_at');

        if (! empty($request['severity'])) {
            $query->where('severity', (string) $request['severity']);
        }

        if (! empty($request['since'])) {
            $query->where('detected_at', '>=', $this->resolveSince((string) $request['since']));
        }

        $rows = $query->limit($limit)
            ->get(['id', 'event_type', 'severity', 'source_client_id', 'topic', 'description', 'detected_at']);

        return (string) json_encode([
            'count' => $rows->count(),
            'filters' => [
                'severity' => $request['severity'] ?? null,
                'since' => $request['since'] ?? null,
                'limit' => $limit,
            ],
            'events' => $rows->map(fn (SecurityEvent $event) => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'severity' => $event->severity,
                'source_client_id' => $event->source_client_id,
                'topic' => $event->topic,
                'description' => $event->description,
                'detected_at' => $event->detected_at?->toIso8601String(),
            ])->all(),
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'severity' => $schema->string()
                ->description('Filter by severity.')
                ->enum([
                    SecurityEvent::SEVERITY_LOW,
                    SecurityEvent::SEVERITY_MEDIUM,
                    SecurityEvent::SEVERITY_HIGH,
                    SecurityEvent::SEVERITY_CRITICAL,
                ]),
            'since' => $schema->string()
                ->description('Coarse time window: today, yesterday, 24h, or 7d.')
                ->enum(['today', 'yesterday', '24h', '7d']),
            'limit' => $schema->integer()
                ->description('Number of rows to return, capped at 100. Default 20.')
                ->min(1)
                ->max(100),
        ];
    }

    protected function resolveSince(string $since): CarbonInterface
    {
        return match ($since) {
            'today' => now()->startOfDay(),
            'yesterday' => now()->subDay()->startOfDay(),
            '7d' => now()->subDays(7),
            default => now()->subHours(24),
        };
    }
}
