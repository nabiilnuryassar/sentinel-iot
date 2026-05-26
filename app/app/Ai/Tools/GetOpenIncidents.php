<?php

namespace App\Ai\Tools;

use App\Models\Incident;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

/**
 * GetOpenIncidents.
 *
 * Read-only. Lists incidents in the open or investigating state,
 * sorted by severity (critical first) then `created_at` desc.
 */
class GetOpenIncidents implements Tool
{
    public function description(): Stringable|string
    {
        return 'List incidents that still need attention (status open or investigating), ordered by severity then newest. Use this for triage queries like "what is open right now" or "what is the highest priority incident".';
    }

    public function handle(Request $request): Stringable|string
    {
        $severityOrder = [
            Incident::SEVERITY_CRITICAL => 1,
            Incident::SEVERITY_HIGH => 2,
            Incident::SEVERITY_MEDIUM => 3,
            Incident::SEVERITY_LOW => 4,
        ];

        $rows = Incident::query()
            ->whereIn('status', [Incident::STATUS_OPEN, Incident::STATUS_INVESTIGATING])
            ->orderByRaw(
                'CASE severity '
                .'WHEN ? THEN 1 '
                .'WHEN ? THEN 2 '
                .'WHEN ? THEN 3 '
                .'WHEN ? THEN 4 '
                .'ELSE 5 END',
                array_keys($severityOrder)
            )
            ->orderByDesc('created_at')
            ->get(['id', 'title', 'severity', 'status', 'affected_device_id', 'summary', 'created_at']);

        return (string) json_encode([
            'count' => $rows->count(),
            'incidents' => $rows->map(fn (Incident $incident) => [
                'id' => $incident->id,
                'title' => $incident->title,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'affected_device_id' => $incident->affected_device_id,
                'summary' => $incident->summary,
                'created_at' => $incident->created_at?->toIso8601String(),
            ])->all(),
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
