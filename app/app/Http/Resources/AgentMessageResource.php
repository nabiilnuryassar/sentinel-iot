<?php

namespace App\Http\Resources;

use App\Models\AgentMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AgentMessage
 *
 * Resource shell — Phase 4 wires the agent and starts persisting messages.
 * Phase 3d does not return this from any route.
 */
class AgentMessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'source' => $this->source,
            'prompt' => $this->prompt,
            'response' => $this->response,
            'metadata' => $this->metadata_json,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
