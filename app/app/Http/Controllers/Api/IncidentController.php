<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\IncidentResource;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Incidents read API for the Telegram `/incidents` command.
 *
 * Read-only on purpose — incidents are filed and edited via the web Inertia
 * UI. Supports `?status=open` (open + investigating) and `?severity=` filters.
 */
class IncidentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:open,investigating,mitigated,closed'],
            'severity' => ['nullable', 'string', 'in:low,medium,high,critical'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $perPage = $validated['per_page'] ?? 50;

        $query = Incident::query()->orderByDesc('created_at');

        if (($validated['status'] ?? null) === 'open') {
            $query->whereIn('status', [Incident::STATUS_OPEN, Incident::STATUS_INVESTIGATING]);
        } elseif (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['severity'])) {
            $query->where('severity', $validated['severity']);
        }

        return IncidentResource::collection($query->paginate($perPage)->withQueryString());
    }
}
