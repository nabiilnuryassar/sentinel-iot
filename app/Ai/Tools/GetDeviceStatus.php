<?php

namespace App\Ai\Tools;

use App\Models\Device;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

/**
 * GetDeviceStatus.
 *
 * Read-only. Returns total/online/offline counts plus a stale list (devices
 * with `last_seen_at` older than 5 minutes). Online = `last_seen_at` within
 * the last 5 minutes regardless of the column-stored status, since the
 * Python ingestor updates `last_seen_at` per telemetry message but only
 * touches `status` periodically.
 */
class GetDeviceStatus implements Tool
{
    public function description(): Stringable|string
    {
        return 'Get an overview of all IoT devices: counts by online/offline state, breakdown by device type, and a list of stale devices that have not reported telemetry in the last 5 minutes.';
    }

    public function handle(Request $request): Stringable|string
    {
        $threshold = now()->subMinutes(5);

        $devices = Device::query()->get(['device_id', 'name', 'type', 'status', 'last_seen_at']);

        $online = $devices->filter(
            fn (Device $device) => $device->last_seen_at !== null
                && $device->last_seen_at->greaterThanOrEqualTo($threshold)
        );

        $byType = $devices->groupBy('type')->map->count()->toArray();

        $stale = $devices
            ->filter(fn (Device $device) => $device->last_seen_at === null
                || $device->last_seen_at->lessThan($threshold))
            ->map(fn (Device $device) => [
                'device_id' => $device->device_id,
                'name' => $device->name,
                'last_seen_at' => $device->last_seen_at?->toIso8601String(),
                'minutes_ago' => $device->last_seen_at
                    ? (int) round(now()->diffInSeconds($device->last_seen_at, true) / 60)
                    : null,
            ])
            ->values()
            ->all();

        return (string) json_encode([
            'total' => $devices->count(),
            'online' => $online->count(),
            'offline' => $devices->count() - $online->count(),
            'by_type' => $byType,
            'stale' => $stale,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
