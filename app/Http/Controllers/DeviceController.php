<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    /**
     * Devices listing — string `device_id` natural key, paginated 15/page.
     */
    public function index(Request $request): Response
    {
        $threshold = Carbon::now()->subMinutes(5);

        $devices = Device::query()
            ->orderBy('device_id')
            ->paginate(15)
            ->withQueryString();

        $devices->getCollection()->transform(function (Device $device) use ($threshold) {
            return [
                'id' => $device->id,
                'device_id' => $device->device_id,
                'name' => $device->name,
                'type' => $device->type,
                'location' => $device->location,
                'status' => $device->status,
                'last_seen_at' => $device->last_seen_at?->toIso8601String(),
                'is_online' => $device->last_seen_at !== null
                    && $device->last_seen_at->greaterThanOrEqualTo($threshold),
            ];
        });

        return Inertia::render('devices/index', [
            'devices' => $devices,
        ]);
    }

    /**
     * Device detail page — string `device_id` route key.
     *
     * Returns last 100 telemetry rows for the chart and the most recent 20
     * security events that pinned this device as `source_client_id`.
     */
    public function show(Request $request, string $device_id): Response
    {
        $device = Device::query()
            ->where('device_id', $device_id)
            ->firstOrFail();

        $threshold = Carbon::now()->subMinutes(5);

        $telemetry = TelemetryLog::query()
            ->where('device_id', $device->device_id)
            ->orderByDesc('received_at')
            ->limit(100)
            ->get([
                'id',
                'topic',
                'temperature',
                'humidity',
                'battery',
                'rssi',
                'received_at',
            ])
            ->reverse()
            ->values()
            ->map(fn (TelemetryLog $row) => [
                'id' => $row->id,
                'topic' => $row->topic,
                'temperature' => $row->temperature,
                'humidity' => $row->humidity,
                'battery' => $row->battery,
                'rssi' => $row->rssi,
                'received_at' => $row->received_at?->toIso8601String(),
            ])
            ->all();

        $events = SecurityEvent::query()
            ->where('source_client_id', $device->device_id)
            ->orderByDesc('detected_at')
            ->limit(20)
            ->get(['id', 'severity', 'event_type', 'topic', 'detected_at'])
            ->map(fn (SecurityEvent $event) => [
                'id' => $event->id,
                'severity' => $event->severity,
                'event_type' => $event->event_type,
                'topic' => $event->topic,
                'detected_at' => $event->detected_at?->toIso8601String(),
            ])
            ->all();

        return Inertia::render('devices/show', [
            'device' => [
                'id' => $device->id,
                'device_id' => $device->device_id,
                'name' => $device->name,
                'type' => $device->type,
                'location' => $device->location,
                'status' => $device->status,
                'last_seen_at' => $device->last_seen_at?->toIso8601String(),
                'metadata_json' => $device->metadata_json,
                'is_online' => $device->last_seen_at !== null
                    && $device->last_seen_at->greaterThanOrEqualTo($threshold),
            ],
            'telemetry' => $telemetry,
            'events' => $events,
        ]);
    }

    /**
     * Toggle quarantine status for the device.
     */
    public function quarantine(Request $request, string $device_id): RedirectResponse
    {
        $device = Device::query()
            ->where('device_id', $device_id)
            ->firstOrFail();

        $device->status = $device->status === 'quarantined' ? 'offline' : 'quarantined';
        $device->save();

        return redirect()->back()->with('status', 'Device status updated.');
    }
}
