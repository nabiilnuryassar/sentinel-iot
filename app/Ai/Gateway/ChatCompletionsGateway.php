<?php

namespace App\Ai\Gateway;

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Gateway\OpenAi\OpenAiGateway;
use Laravel\Ai\Gateway\TextGenerationOptions;
use Laravel\Ai\Providers\Provider;
use Laravel\Ai\Responses\TextResponse;

/**
 * Drop-in replacement for OpenAiGateway for proxies (localhost:20128 /
 * cx/gpt-5.5) that expose the Responses API but diverge from OpenAI in two ways:
 *
 *  1. The /responses RESPONSE body omits the `model` field. The parent
 *     processResponse() does `$model = $data['model'] ?? ''`, so the model goes
 *     empty and the follow-up tool-call request fails with 400 "Missing model".
 *     Fix: override processResponse() to re-inject the configured model.
 *
 *  2. The proxy does NOT persist response state, so `previous_response_id`
 *     continuation returns 400 ("No tool call found for function call output").
 *     Fix: override continueWithToolResults() to resend the full conversation
 *     inline (the parent's mapMessagesToInput already emits the matching
 *     function_call / function_call_output blocks).
 *
 * Everything else — initial request, parsing, tool execution, recursion — is
 * inherited unchanged from OpenAiGateway.
 */
class ChatCompletionsGateway extends OpenAiGateway
{
    /**
     * Re-inject the configured model when the proxy omits it from the
     * /responses output, then defer to the parent for all parsing/recursion.
     */
    protected function processResponse(
        array $data,
        Provider $provider,
        bool $structured,
        array $tools,
        ?array $schema,
        Collection $steps,
        Collection $messages,
        int $depth = 0,
        ?int $maxSteps = null,
        ?TextGenerationOptions $options = null,
        ?int $timeout = null,
    ): TextResponse {
        if (blank($data['model'] ?? null)) {
            $data['model'] = $this->resolveModel($provider);
        }

        return parent::processResponse(
            $data, $provider, $structured, $tools, $schema,
            $steps, $messages, $depth, $maxSteps, $options, $timeout,
        );
    }

    /**
     * Continue the tool-call loop using a stateless inline conversation
     * instead of the Responses API `previous_response_id` pointer.
     */
    protected function continueWithToolResults(
        string $responseId,
        string $model,
        Provider $provider,
        bool $structured,
        array $tools,
        ?array $schema,
        Collection $steps,
        Collection $messages,
        array $toolResults,
        int $depth,
        ?int $maxSteps,
        ?TextGenerationOptions $options = null,
        ?int $timeout = null,
    ): TextResponse {
        // Guard against an empty model leaking in from a prior parse.
        if (blank($model)) {
            $model = $this->resolveModel($provider);
        }

        // Rebuild the full conversation inline. $messages already contains the
        // user prompt, the assistant turn (with tool calls) and the tool
        // results, and mapMessagesToInput() emits the matching
        // function_call / function_call_output blocks the proxy expects.
        $body = [
            'model' => $model,
            'input' => $this->mapMessagesToInput($messages->all()),
        ];

        if (filled($tools)) {
            $body['tools'] = $this->mapTools($tools, $provider);
        }

        if (filled($schema)) {
            $body['text'] = $this->buildSchemaFormat($schema);
        }

        $body = array_merge($body, Arr::whereNotNull([
            'temperature' => $options?->temperature,
            'top_p' => $options?->topP,
            'max_output_tokens' => $options?->maxTokens,
        ]));

        $providerOptions = $options?->providerOptions(
            Lab::tryFrom($provider->driver()) ?? $provider->driver()
        );

        if (filled($providerOptions)) {
            $body = array_merge($body, $providerOptions);
        }

        $response = $this->withErrorHandling(
            $provider->name(),
            fn () => $this->client($provider, $timeout)->post('responses', $body),
        );

        $data = $response->json();

        $this->validateTextResponse($data);

        return $this->processResponse(
            $data, $provider, $structured, $tools, $schema,
            $steps, $messages, $depth, $maxSteps, $options, $timeout,
        );
    }

    /**
     * Resolve the configured text model for this provider.
     */
    protected function resolveModel(Provider $provider): string
    {
        return config("ai.providers.{$provider->name()}.models.text.default")
            ?? config('ai.providers.openai.models.text.default')
            ?? 'cx/gpt-5.5';
    }
}
