<?php

namespace App\Ai\Tools;

use App\Models\TelemetryLog;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

/**
 * GetRecentTelemetry.
 *
 * Read-only. Returns the latest N telemetry rows for a given `device_id`
 * (the natural string key, not the bigint surrogate — matches Phase 2 D7).
 */
class GetRecentTelemetry implements Tool
{
    public function description(): Stringable|string
    {
        return 'Fetch the most recent telemetry rows for a specific IoT device. Use after GetDeviceStatus when you need to inspect actual readings (temperature, humidity, battery, rssi, payload).';
    }

    public function handle(Request $request): Stringable|string
    {
        $deviceId = (string) $request['device_id'];
        $limit = min(100, max(1, (int) ($request['limit'] ?? 20)));

        $rows = TelemetryLog::query()
            ->where('device_id', $deviceId)
            ->orderByDesc('received_at')
            ->limit($limit)
            ->get(['id', 'device_id', 'topic', 'temperature', 'humidity', 'battery', 'rssi', 'payload_json', 'received_at']);

        return (string) json_encode([
            'device_id' => $deviceId,
            'count' => $rows->count(),
            'rows' => $rows->map(fn (TelemetryLog $row) => [
                'id' => $row->id,
                'topic' => $row->topic,
                'temperature' => $row->temperature,
                'humidity' => $row->humidity,
                'battery' => $row->battery,
                'rssi' => $row->rssi,
                'payload' => $row->payload_json,
                'received_at' => $row->received_at?->toIso8601String(),
            ])->all(),
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'device_id' => $schema->string()
                ->description('The natural device_id (e.g. "temp-sensor-001"), not the surrogate primary key.')
                ->required(),
            'limit' => $schema->integer()
                ->description('Number of rows to return, capped at 100. Default 20.')
                ->min(1)
                ->max(100),
        ];
    }
}
