<?php

namespace App\Http\Resources;

use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * @mixin Device
 */
class DeviceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $threshold = Carbon::now()->subMinutes(5);

        return [
            'id' => $this->id,
            'device_id' => $this->device_id,
            'name' => $this->name,
            'type' => $this->type,
            'location' => $this->location,
            'status' => $this->status,
            'last_seen_at' => $this->last_seen_at?->toIso8601String(),
            'is_online' => $this->last_seen_at !== null
                && $this->last_seen_at->greaterThanOrEqualTo($threshold),
        ];
    }
}
