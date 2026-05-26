<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\TelemetryLog;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class TelemetryController extends Controller
{
    /**
     * Paginated telemetry browser with optional `device_id` and date filters.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'device_id' => ['nullable', 'string', 'max:120'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = TelemetryLog::query()->orderByDesc('received_at');

        if (! empty($validated['device_id'])) {
            $query->where('device_id', $validated['device_id']);
        }

        if (! empty($validated['from'])) {
            $query->where('received_at', '>=', Carbon::parse($validated['from']));
        }

        if (! empty($validated['to'])) {
            $query->where('received_at', '<=', Carbon::parse($validated['to']));
        }

        $logs = $query->paginate(50)->withQueryString();

        $logs->getCollection()->transform(fn (TelemetryLog $row) => [
            'id' => $row->id,
            'device_id' => $row->device_id,
            'topic' => $row->topic,
            'temperature' => $row->temperature,
            'humidity' => $row->humidity,
            'battery' => $row->battery,
            'rssi' => $row->rssi,
            'received_at' => $row->received_at?->toIso8601String(),
        ]);

        $devices = Device::query()
            ->orderBy('device_id')
            ->pluck('device_id')
            ->all();

        return Inertia::render('telemetry/index', [
            'logs' => $logs,
            'devices' => $devices,
            'filters' => [
                'device_id' => $validated['device_id'] ?? null,
                'from' => $validated['from'] ?? null,
                'to' => $validated['to'] ?? null,
            ],
        ]);
    }
}
