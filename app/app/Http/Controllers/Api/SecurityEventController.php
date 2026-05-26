<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SecurityEventResource;
use App\Models\SecurityEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

/**
 * Security events read API for the Telegram `/security` command.
 *
 * Supports a coarse `?since=` window keyed to bot ergonomics
 * (today / yesterday / 24h / 7d) and a `?severity=` filter.
 */
class SecurityEventController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'since' => ['nullable', 'string', 'in:today,yesterday,24h,7d'],
            'severity' => ['nullable', 'string', 'in:low,medium,high,critical'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $perPage = $validated['per_page'] ?? 50;

        $query = SecurityEvent::query()->orderByDesc('detected_at');

        if (! empty($validated['since'])) {
            $now = Carbon::now();
            $from = match ($validated['since']) {
                'today' => $now->copy()->startOfDay(),
                'yesterday' => $now->copy()->subDay()->startOfDay(),
                '24h' => $now->copy()->subDay(),
                '7d' => $now->copy()->subDays(7),
            };
            $query->where('detected_at', '>=', $from);

            if ($validated['since'] === 'yesterday') {
                $query->where('detected_at', '<', $now->copy()->startOfDay());
            }
        }

        if (! empty($validated['severity'])) {
            $query->where('severity', $validated['severity']);
        }

        return SecurityEventResource::collection($query->paginate($perPage)->withQueryString());
    }
}
