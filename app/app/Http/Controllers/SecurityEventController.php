<?php

namespace App\Http\Controllers;

use App\Models\SecurityEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SecurityEventController extends Controller
{
    /**
     * Paginated security event log with severity / event_type filters.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'severity' => ['nullable', 'string', 'in:low,medium,high,critical'],
            'event_type' => ['nullable', 'string', 'max:120'],
        ]);

        $query = SecurityEvent::query()->orderByDesc('detected_at');

        if (! empty($validated['severity'])) {
            $query->where('severity', $validated['severity']);
        }

        if (! empty($validated['event_type'])) {
            $query->where('event_type', $validated['event_type']);
        }

        $events = $query->paginate(50)->withQueryString();

        $events->getCollection()->transform(fn (SecurityEvent $event) => [
            'id' => $event->id,
            'event_type' => $event->event_type,
            'severity' => $event->severity,
            'source_client_id' => $event->source_client_id,
            'topic' => $event->topic,
            'description' => $event->description,
            'detected_at' => $event->detected_at?->toIso8601String(),
        ]);

        $eventTypes = SecurityEvent::query()
            ->select('event_type')
            ->distinct()
            ->orderBy('event_type')
            ->pluck('event_type')
            ->all();

        return Inertia::render('security-events/index', [
            'events' => $events,
            'event_types' => $eventTypes,
            'filters' => [
                'severity' => $validated['severity'] ?? null,
                'event_type' => $validated['event_type'] ?? null,
            ],
        ]);
    }
}
