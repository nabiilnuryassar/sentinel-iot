<?php

namespace App\Http\Resources;

use App\Models\SecurityEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SecurityEvent
 */
class SecurityEventResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_type' => $this->event_type,
            'severity' => $this->severity,
            'source_client_id' => $this->source_client_id,
            'topic' => $this->topic,
            'description' => $this->description,
            'detected_at' => $this->detected_at?->toIso8601String(),
        ];
    }
}
