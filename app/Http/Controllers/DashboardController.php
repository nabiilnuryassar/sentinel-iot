<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Incident;
use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use App\Models\User;
use App\Services\DashboardSummary;
use App\Services\SecurityScoreCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardSummary $summary,
        private readonly SecurityScoreCalculator $scoreCalculator,
    ) {}

    /**
     * Render the operations dashboard summary (PRD §14.1, Design S5).
     *
     * Headline counters come from {@see DashboardSummary} so the web view and
     * the JSON API stay in lockstep. Telemetry buckets, the recent-events tail,
     * incidents, the device fleet, the security score, and operator context are
     * dashboard-only and assembled here.
     */
    public function index(Request $request): Response
    {
        $now = Carbon::now();
        $hourAgo = $now->copy()->subMinutes(60);

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
            'recent_telemetry' => $this->aggregateTelemetryPerMinute($hourAgo, $now),
            'recent_events' => $this->recentEvents(),
            'bot_token' => $botTokenData,
            'incidents' => $this->recentIncidents(),
            'devices' => $this->allDevices(),
            'security_score' => $this->scoreCalculator->calculate(),
            'operator' => $this->operatorData($request->user()),
        ]);
    }

    /**
     * @return array<int, array{id: int, severity: string, event_type: string, topic: ?string, detected_at: ?string}>
     */
    private function recentEvents(): array
    {
        return SecurityEvent::query()
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
    }

    /**
     * Build a 60-bucket series of real sensor averages per minute, padding
     * empty buckets with zeroes so the chart x-axis is dense regardless of
     * ingest cadence.
     *
     * @return array<int, array{minute: string, temperature: float, humidity: float, battery: float}>
     */
    private function aggregateTelemetryPerMinute(Carbon $from, Carbon $to): array
    {
        $rows = TelemetryLog::query()
            ->where('received_at', '>=', $from)
            ->where('received_at', '<=', $to)
            ->orderBy('received_at')
            ->get(['received_at', 'temperature', 'humidity', 'battery']);

        // Aggregate readings into minute buckets keyed by truncated timestamp.
        $buckets = [];
        foreach ($rows as $row) {
            /** @var Carbon $receivedAt */
            $receivedAt = $row->received_at;
            $key = $receivedAt->copy()->seconds(0)->microseconds(0)->toIso8601String();
            $buckets[$key] ??= ['temperature' => 0.0, 'humidity' => 0.0, 'battery' => 0.0, 'count' => 0];
            $buckets[$key]['temperature'] += (float) $row->temperature;
            $buckets[$key]['humidity'] += (float) $row->humidity;
            $buckets[$key]['battery'] += (float) $row->battery;
            $buckets[$key]['count']++;
        }

        $series = [];
        $cursor = $from->copy()->seconds(0)->microseconds(0);

        for ($i = 0; $i < 60; $i++) {
            $bucket = $buckets[$cursor->toIso8601String()] ?? null;
            $count = $bucket['count'] ?? 0;

            $series[] = [
                'minute' => $cursor->format('H:i'),
                'temperature' => $count > 0 ? round($bucket['temperature'] / $count, 1) : 0.0,
                'humidity' => $count > 0 ? round($bucket['humidity'] / $count, 1) : 0.0,
                'battery' => $count > 0 ? round($bucket['battery'] / $count, 1) : 0.0,
            ];
            $cursor->addMinute();
        }

        return $series;
    }

    /**
     * @return array<int, array{id: int, title: string, severity: string, status: string, device_id: ?string, created_at: ?string}>
     */
    private function recentIncidents(): array
    {
        return Incident::query()
            ->whereIn('status', [Incident::STATUS_OPEN, Incident::STATUS_INVESTIGATING])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (Incident $incident) => [
                'id' => $incident->id,
                'title' => $incident->title,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'device_id' => $incident->affected_device_id,
                'created_at' => $incident->created_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @return array<int, array{device_id: string, name: string, type: string, status: string, last_seen_at: ?string, metadata_json: ?array<string, mixed>}>
     */
    private function allDevices(): array
    {
        return Device::query()
            ->orderBy('device_id')
            ->get()
            ->map(fn (Device $device) => [
                'device_id' => $device->device_id,
                'name' => $device->name,
                'type' => $device->type,
                'status' => $device->status,
                'last_seen_at' => $device->last_seen_at?->toIso8601String(),
                'metadata_json' => $device->metadata_json,
            ])
            ->all();
    }

    /**
     * @return array{name: string, email: string, resolved_this_week: int}
     */
    private function operatorData(User $user): array
    {
        return [
            'name' => $user->name,
            'email' => $user->email,
            'resolved_this_week' => Incident::query()
                ->where('created_by', $user->id)
                ->where('status', Incident::STATUS_CLOSED)
                ->where('updated_at', '>=', Carbon::now()->startOfWeek())
                ->count(),
        ];
    }
}
