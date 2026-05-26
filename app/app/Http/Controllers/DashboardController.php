<?php

namespace App\Http\Controllers;

use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use App\Services\DashboardSummary;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardSummary $summary) {}

    /**
     * Render the operations dashboard summary (PRD §14.1, Design S5).
     *
     * Headline counters come from {@see DashboardSummary} so the web view and
     * the JSON API stay in lockstep. Telemetry buckets and the recent-events
     * tail are dashboard-only and stay in this controller.
     */
    public function index(Request $request): Response
    {
        $now = Carbon::now();
        $hourAgo = $now->copy()->subMinutes(60);

        $recentTelemetry = $this->aggregateTelemetryPerMinute($hourAgo, $now);

        $recentEvents = SecurityEvent::query()
            ->orderByDesc('detected_at')
            ->limit(5)
            ->get(['id', 'severity', 'event_type', 'topic', 'detected_at'])
            ->map(fn (SecurityEvent $event) => [
                'id' => $event->id,
                'severity' => $event->severity,
                'event_type' => $event->event_type,
                'topic' => $event->topic,
                'detected_at' => $event->detected_at?->toIso8601String(),
            ])
            ->all();

        $botToken = $request->user()?->tokens()->where('name', 'bot')->first();
        $botTokenData = $botToken ? [
            'id' => $botToken->id,
            'name' => $botToken->name,
            'last_used_at' => $botToken->last_used_at?->toIso8601String(),
            'created_at' => $botToken->created_at?->toIso8601String(),
            'expires_at' => $botToken->expires_at?->toIso8601String(),
        ] : null;

        return Inertia::render('dashboard', [
            ...$this->summary->summary(),
            'recent_telemetry' => $recentTelemetry,
            'recent_events' => $recentEvents,
            'bot_token' => $botTokenData,
        ]);
    }

    /**
     * Build a 60-bucket count-per-minute series, padding zero buckets so the
     * chart x-axis is dense regardless of ingest cadence.
     *
     * @return array<int, array{minute: string, count: int}>
     */
    private function aggregateTelemetryPerMinute(Carbon $from, Carbon $to): array
    {
        $rows = TelemetryLog::query()
            ->where('received_at', '>=', $from)
            ->where('received_at', '<=', $to)
            ->orderBy('received_at')
            ->pluck('received_at');

        $counts = [];
        foreach ($rows as $receivedAt) {
            /** @var Carbon $receivedAt */
            $bucket = $receivedAt->copy()->seconds(0)->microseconds(0);
            $key = $bucket->toIso8601String();
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }

        $series = [];
        $cursor = $from->copy()->seconds(0)->microseconds(0);

        for ($i = 0; $i < 60; $i++) {
            $key = $cursor->toIso8601String();
            $series[] = [
                'minute' => $key,
                'count' => $counts[$key] ?? 0,
            ];
            $cursor->addMinute();
        }

        return $series;
    }
}
