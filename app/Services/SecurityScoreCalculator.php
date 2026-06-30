<?php

namespace App\Services;

use App\Models\Device;
use App\Models\SecurityEvent;
use Illuminate\Support\Carbon;

class SecurityScoreCalculator
{
    /**
     * @return array{overall: int, sub_scores: array<int, array{label: string, value: int}>, label: string}
     */
    public function calculate(): array
    {
        $dayAgo = Carbon::now()->subHours(24);
        $totalDevices = Device::query()->count();

        $identity = $this->identityScore($totalDevices);
        $network = $this->networkScore($dayAgo);
        $data = $this->dataScore($dayAgo);
        $device = $this->deviceScore($totalDevices);

        $subScores = [
            ['label' => 'Identity', 'value' => $identity],
            ['label' => 'Network', 'value' => $network],
            ['label' => 'Data', 'value' => $data],
            ['label' => 'Device', 'value' => $device],
        ];

        $overall = (int) round(($identity + $network + $data + $device) / 4);

        return [
            'overall' => $overall,
            'sub_scores' => $subScores,
            'label' => $this->labelFor($overall),
        ];
    }

    private function identityScore(int $totalDevices): int
    {
        if ($totalDevices === 0) {
            return 100;
        }

        $withPolicies = Device::query()
            ->whereHas('policies', fn ($query) => $query->where('is_active', true))
            ->count();

        return (int) round(($withPolicies / $totalDevices) * 100);
    }

    private function networkScore(Carbon $since): int
    {
        $events = SecurityEvent::query()
            ->where('detected_at', '>=', $since)
            ->whereIn('event_type', [
                SecurityEvent::TYPE_PUBLISH_FLOOD,
                SecurityEvent::TYPE_UNAUTHORIZED_PUBLISH,
            ])
            ->count();

        return max(0, 100 - ($events * 5));
    }

    private function dataScore(Carbon $since): int
    {
        $events = SecurityEvent::query()
            ->where('detected_at', '>=', $since)
            ->where('event_type', SecurityEvent::TYPE_MALFORMED_PAYLOAD)
            ->count();

        return max(0, 100 - ($events * 5));
    }

    private function deviceScore(int $totalDevices): int
    {
        if ($totalDevices === 0) {
            return 100;
        }

        $online = Device::query()
            ->where('last_seen_at', '>=', now()->subMinutes(5))
            ->count();

        return (int) round(($online / $totalDevices) * 100);
    }

    private function labelFor(int $score): string
    {
        return match (true) {
            $score >= 85 => 'Excellent',
            $score >= 70 => 'Good',
            $score >= 50 => 'Fair',
            default => 'Poor',
        };
    }
}
