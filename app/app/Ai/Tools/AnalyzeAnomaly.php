<?php

namespace App\Ai\Tools;

use App\Models\TelemetryLog;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

/**
 * AnalyzeAnomaly.
 *
 * Read-only. Pure-statistics anomaly detector. Loads the last 50 telemetry
 * rows for a device, computes mean/stddev for each numeric column with
 * non-null values, and flags `is_anomaly` when the latest reading is more
 * than 3 stddev from the mean. No LLM call. Used by the agent as grounding.
 */
class AnalyzeAnomaly implements Tool
{
    /**
     * Numeric telemetry columns we surface anomalies for.
     */
    protected const NUMERIC_COLUMNS = ['temperature', 'humidity', 'battery', 'rssi'];

    public function description(): Stringable|string
    {
        return 'Run a pure-statistics anomaly check on the most recent 50 telemetry samples for a device. For each numeric column (temperature, humidity, battery, rssi) it returns mean, stddev, latest reading, and whether the latest reading is >3 stddev from the mean.';
    }

    public function handle(Request $request): Stringable|string
    {
        $deviceId = (string) $request['device_id'];

        $rows = TelemetryLog::query()
            ->where('device_id', $deviceId)
            ->orderByDesc('received_at')
            ->limit(50)
            ->get(['temperature', 'humidity', 'battery', 'rssi', 'received_at']);

        if ($rows->isEmpty()) {
            return (string) json_encode([
                'device_id' => $deviceId,
                'sample_size' => 0,
                'stats' => new \stdClass,
                'any_anomaly' => false,
                'note' => 'No telemetry rows found for this device.',
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        $latest = $rows->first();
        $stats = [];
        $anyAnomaly = false;

        foreach (self::NUMERIC_COLUMNS as $column) {
            $values = $rows
                ->pluck($column)
                ->filter(fn ($value) => $value !== null)
                ->map(fn ($value) => (float) $value)
                ->values();

            if ($values->isEmpty() || $latest->{$column} === null) {
                continue;
            }

            $mean = $values->avg();
            $stddev = $this->stddev($values->all(), $mean);
            $latestValue = (float) $latest->{$column};
            $isAnomaly = $stddev > 0 && abs($latestValue - $mean) > 3 * $stddev;

            $stats[$column] = [
                'mean' => round($mean, 4),
                'stddev' => round($stddev, 4),
                'latest' => round($latestValue, 4),
                'is_anomaly' => $isAnomaly,
            ];

            $anyAnomaly = $anyAnomaly || $isAnomaly;
        }

        return (string) json_encode([
            'device_id' => $deviceId,
            'sample_size' => $rows->count(),
            'stats' => empty($stats) ? new \stdClass : $stats,
            'any_anomaly' => $anyAnomaly,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'device_id' => $schema->string()
                ->description('The natural device_id (e.g. "temp-sensor-001").')
                ->required(),
        ];
    }

    /**
     * Population stddev (matches numpy.std default).
     *
     * @param  array<int, float>  $values
     */
    protected function stddev(array $values, float $mean): float
    {
        $count = count($values);

        if ($count === 0) {
            return 0.0;
        }

        $sumSquares = 0.0;
        foreach ($values as $value) {
            $sumSquares += ($value - $mean) ** 2;
        }

        return sqrt($sumSquares / $count);
    }
}
