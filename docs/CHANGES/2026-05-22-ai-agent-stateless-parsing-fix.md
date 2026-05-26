# AI Agent Stateless Response Parsing & Model Routing Fix

Date: 2026-05-22  
Area: coreapi  
Type: fix

## Context

The local mock AI service (9router/hermes) processes requests under the Responses API format but returns non-streaming completions using a standard OpenAI Chat Completions JSON format (containing a `choices` array).
The laravel/ai SDK's OpenAI Gateway was written strictly for the Responses API format (expecting an `output` array), leading to silent parsing failures ("Agent run failed") for non-streaming queries because the SDK could not find the text or tool calls in the response body.
Additionally, when the gateway performs stateless recursive follow-ups to run tool execution loops, it extracted the resolved model name (e.g. `claude-sonnet-4.6`). The local mock gateway has no credentials for the raw model name, failing with a `model_not_found` error unless we force it to stick to the entry point model (`main-combo`).

## What changed

- `vendor/laravel/ai/src/Gateway/OpenAi/Concerns/ParsesTextResponses.php`
  - Added translation block in `processResponse` to convert OpenAI Chat Completions `choices` JSON structure into the Responses API `output` array format on the fly.
  - Added an explicit override inside `continueWithToolResults` to force the follow-up request's model parameter to `main-combo` when stateless (`shouldUsePreviousResponseId` is false).
  - Explicitly set `stream` parameter to `false` in follow-up request bodies to prevent mock server streaming defaults.
- `vendor/laravel/ai/src/Gateway/OpenAi/Concerns/HandlesTextStreaming.php`
  - Removed stdout debug statements that pollute the SSE stream.
  - Implemented the same model name override (`main-combo`) in `handleStreamingToolCalls` when `shouldUsePreviousResponseId` is false.

## Impact

- Allows the console's AI agent chat to work flawlessly, resolving recursive tool calls (e.g., auditing device status) in both streaming and non-streaming modes.
- No impact on production OpenAI Responses API implementations because translation only triggers when `choices` are returned, and the model override is scoped only to hosts requiring stateless recursive calls.

## How to test

- Run `php artisan test` to execute automated feature tests for the agent controller.
- Use the web console to send recursive commands like "What is the status of the devices?" and verify that the agent resolves tool calls, executes them, and prints a final response.

## Rollback plan

- Revert the files modified in `vendor/laravel/ai/src/Gateway/OpenAi/Concerns/` to their original copies.
