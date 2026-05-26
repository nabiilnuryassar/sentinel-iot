<?php

namespace App\Events;

use App\Models\AgentMessage;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * AgentMessageCompleted.
 *
 * Fired after the SentinelAgent finishes a streamed run and the audit row
 * has been persisted to `agent_messages`. Internal subscribers (and an
 * optional outbound webhook configured via `AGENT_WEBHOOK_URL`) can react
 * without touching the controller.
 *
 * Plain Laravel event - we deliberately do not implement
 * `ShouldBroadcast` so the existing Docker stack works without Reverb.
 * If/when broadcasting is enabled, swap the contract on this class.
 */
class AgentMessageCompleted
{
    use Dispatchable;
    use SerializesModels;

    /**
     * @param  array{
     *     conversation_id: ?string,
     *     usage: array<string, mixed>|null,
     *     duration_ms: int,
     *     source: string,
     * }  $context
     */
    public function __construct(
        public AgentMessage $message,
        public array $context,
    ) {}
}
