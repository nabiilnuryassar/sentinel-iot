<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * SendAgentWebhook.
 *
 * Fire-and-forget HTTP POST to the operator-supplied AGENT_WEBHOOK_URL
 * for each completed agent run. Lives behind a queue so the SSE response
 * can return [DONE] immediately without waiting on a third-party endpoint.
 *
 * Failures are swallowed - this job must never affect user-facing flows.
 */
class SendAgentWebhook implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;

    public int $timeout = 5;

    public function __construct(
        public string $url,
        /** @var array<string, mixed> */
        public array $payload,
    ) {}

    public function handle(): void
    {
        try {
            Http::timeout(3)->asJson()->post($this->url, $this->payload);
        } catch (Throwable $e) {
            // Webhooks are best-effort; surface for telemetry but never throw.
            report($e);
        }
    }
}
