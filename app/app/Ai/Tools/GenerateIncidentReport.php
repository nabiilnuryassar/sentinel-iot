<?php

namespace App\Ai\Tools;

use App\Models\Incident;
use App\Models\IncidentReport;
use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

/**
 * GenerateIncidentReport.
 *
 * Read-only. Loads an incident plus its related security events, recent
 * telemetry for the affected device, and any existing incident_reports.
 * Returns a single JSON dict the LLM uses to compose the markdown report.
 * Persistence happens in the controller after the agent returns — never
 * here. This tool is registered on IncidentAnalyst, not SentinelAgent.
 */
class GenerateIncidentReport implements Tool
{
    public function description(): Stringable|string
    {
        return 'Load an incident plus all related context (security events, recent telemetry for the affected device, existing reports) so you can write a full incident report. Read-only. Use this once per incident analysis call before writing the structured output.';
    }

    public function handle(Request $request): Stringable|string
    {
        $incidentId = (int) $request['incident_id'];
        $incident = Incident::query()->find($incidentId);

        if ($incident === null) {
            return (string) json_encode([
                'incident_id' => $incidentId,
                'found' => false,
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        $events = collect();
        $telemetry = collect();

        if ($incident->affected_device_id !== null) {
            $events = SecurityEvent::query()
                ->where('source_client_id', $incident->affected_device_id)
                ->orderByDesc('detected_at')
                ->limit(50)
                ->get(['id', 'event_type', 'severity', 'topic', 'description', 'detected_at']);

            $telemetry = TelemetryLog::query()
                ->where('device_id', $incident->affected_device_id)
                ->orderByDesc('received_at')
                ->limit(100)
                ->get(['id', 'topic', 'temperature', 'humidity', 'battery', 'rssi', 'received_at']);
        }

        $existingReports = IncidentReport::query()
            ->where('incident_id', $incident->id)
            ->orderByDesc('generated_at')
            ->get(['id', 'generated_by', 'generated_at']);

        return (string) json_encode([
            'incident_id' => $incident->id,
            'found' => true,
            'incident' => [
                'id' => $incident->id,
                'title' => $incident->title,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'affected_device_id' => $incident->affected_device_id,
                'summary' => $incident->summary,
                'root_cause' => $incident->root_cause,
                'recommendation' => $incident->recommendation,
                'created_at' => $incident->created_at?->toIso8601String(),
            ],
            'related_events' => $events->map(fn (SecurityEvent $event) => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'severity' => $event->severity,
                'topic' => $event->topic,
                'description' => $event->description,
                'detected_at' => $event->detected_at?->toIso8601String(),
            ])->all(),
            'recent_telemetry' => $telemetry->map(fn (TelemetryLog $row) => [
                'id' => $row->id,
                'topic' => $row->topic,
                'temperature' => $row->temperature,
                'humidity' => $row->humidity,
                'battery' => $row->battery,
                'rssi' => $row->rssi,
                'received_at' => $row->received_at?->toIso8601String(),
            ])->all(),
            'existing_reports' => $existingReports->map(fn (IncidentReport $report) => [
                'id' => $report->id,
                'generated_by' => $report->generated_by,
                'generated_at' => $report->generated_at?->toIso8601String(),
            ])->all(),
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'incident_id' => $schema->integer()
                ->description('The numeric id of the incidents row to analyze.')
                ->required(),
        ];
    }
}
