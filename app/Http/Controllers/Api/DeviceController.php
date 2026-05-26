<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DeviceResource;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

/**
 * Devices index for the Telegram `/devices` command.
 *
 * Read-only. CRUD stays browser-only via Inertia. Supports a `status` filter
 * (`online` / `offline`) computed against the 5-minute last-seen threshold so
 * the bot's view of "online" matches the dashboard's.
 */
class DeviceController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:online,offline'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $perPage = $validated['per_page'] ?? 50;
        $threshold = Carbon::now()->subMinutes(5);

        $query = Device::query()->orderBy('device_id');

        if (($validated['status'] ?? null) === 'online') {
            $query->where('last_seen_at', '>=', $threshold);
        } elseif (($validated['status'] ?? null) === 'offline') {
            $query->where(function ($q) use ($threshold): void {
                $q->whereNull('last_seen_at')->orWhere('last_seen_at', '<', $threshold);
            });
        }

        return DeviceResource::collection($query->paginate($perPage)->withQueryString());
    }
}
