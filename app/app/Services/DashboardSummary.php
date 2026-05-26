<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Incident;
use App\Models\SecurityEvent;
use Illuminate\Support\Carbon;

/**
 * Dashboard summary aggregator.
 *
 * Single source of truth for the PRD §14.1 dashboard payload — both the web
 * Inertia controller and the JSON API call into here so the bot and UI never
 * disagree.
 */
class DashboardSummary
{
    /**
     * Compute the headline counters for the operations dashboard.
     *
     * @return array{
     *   total_devices: int,
     *   online_devices: int,
     *   offline_devices: int,
     *   security_events_today: int,
     *   open_incidents: int,
     *   risk_level: string,
     * }
     */
    public function summary(): array
    {
        $now = Carbon::now();
        $onlineThreshold = $now->copy()->subMinutes(5);
        $startOfDay = $now->copy()->startOfDay();

        $totalDevices = Device::query()->count();
        $onlineDevices = Device::query()
            ->where('last_seen_at', '>=', $onlineThreshold)
            ->count();
        $offlineDevices = max(0, $totalDevices - $onlineDevices);

        $securityEventsToday = SecurityEvent::query()
            ->where('detected_at', '>=', $startOfDay)
            ->count();

        $openIncidents = Incident::query()
            ->whereIn('status', [Incident::STATUS_OPEN, Incident::STATUS_INVESTIGATING])
            ->count();

        $hasCriticalOpenIncident = Incident::query()
            ->whereIn('status', [Incident::STATUS_OPEN, Incident::STATUS_INVESTIGATING])
            ->where('severity', Incident::SEVERITY_CRITICAL)
            ->exists();

        $eventsLast24h = SecurityEvent::query()
            ->where('detected_at', '>=', $now->copy()->subHours(24))
            ->count();

        $riskLevel = match (true) {
            $hasCriticalOpenIncident => 'critical',
            $eventsLast24h >= 10 => 'high',
            $eventsLast24h >= 3 => 'medium',
            default => 'low',
        };

        return [
            'total_devices' => $totalDevices,
            'online_devices' => $onlineDevices,
            'offline_devices' => $offlineDevices,
            'security_events_today' => $securityEventsToday,
            'open_incidents' => $openIncidents,
            'risk_level' => $riskLevel,
        ];
    }
}
