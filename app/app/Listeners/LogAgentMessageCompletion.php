<?php

namespace App\Listeners;

use App\Events\AgentMessageCompleted;
use Illuminate\Support\Facades\Log;

class LogAgentMessageCompletion
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(AgentMessageCompleted $event): void
    {
        Log::info('Agent message completed: '.$event->message->id, [
            'prompt' => $event->message->prompt,
            'duration_ms' => $event->context['duration_ms'] ?? 0,
        ]);
    }
}
