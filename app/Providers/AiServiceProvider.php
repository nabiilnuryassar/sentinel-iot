<?php

namespace App\Providers;

use App\Ai\Gateway\ChatCompletionsGateway;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\ServiceProvider;
use Laravel\Ai\AiManager;
use Laravel\Ai\Providers\OpenAiProvider;

/**
 * Override the default OpenAI driver to use /chat/completions instead of /responses.
 *
 * This is needed because the local proxy (localhost:20128) supports the Chat
 * Completions API with full tool-call continuation, but does NOT support the
 * Responses API's `previous_response_id` pattern.
 */
class AiServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->resolving(AiManager::class, function (AiManager $manager): void {
            // Extend the 'openai' driver to use our ChatCompletionsGateway.
            $manager->extend('openai', function ($app, array $config) {
                return new OpenAiProvider(
                    new ChatCompletionsGateway($app['events']),
                    $config,
                    $app->make(Dispatcher::class),
                );
            });
        });
    }
}
