# WORKLOG — fresh-reviewer pass

> Pipeline step 4 per `SPEC.md` §6. Reviewer = same agent, fresh
> review-only pass against the diff produced by the worker round.
> Convention: blocker / concern / suggestion.

## Summary

- 8 phases shipped; all acceptance gates were green when the worker
  declared `PIPELINE COMPLETE`.
- Re-running gates from scratch in this pass — see below.
- 1 **blocker** found around session locking during SSE.
- 2 concerns and a handful of suggestions.

## Findings

### B1 — blocker — Laravel session middleware blocks the SSE stream

`POST /agent/stream` is in the `web` middleware group with `auth`. The
default session driver writes a session lock for the duration of the
request. On a long-running SSE response the lock is held for the entire
stream, which means:

- The same user cannot make any other authenticated request (Inertia
  reload, navigation) until the agent finishes — the UI deadlocks the
  moment the chat fires `router.reload({ only: ['messages'] })` while
  another stream is still open.
- Long streams (multi-tool agent runs) starve the user's session for the
  whole window.

Fix: release the session lock as soon as the user is resolved, before
emitting the stream. Two cheap options inside the controller:

```php
$request->session()->save();
```

…called once after we capture the user. We also drop CSRF middleware
isn't an option (we want CSRF for the POST), and skipping `web` removes
auth too.

### B2 — concern — `afterStream()` matches the audit row by raw prompt text

`AgentController::afterStream()` resolves the row written by
`LogAgentInteractions` middleware via `where('prompt', $prompt)
->latest('id')`. That's racy: a user firing two streams with the same
prompt back-to-back can resolve the wrong row, and the resolution falls
back to "the row that was inserted last", not "the row this stream just
wrote".

Mitigation: ask `LogAgentInteractions` to attach the row id to a
short-lived in-process map keyed by `invocationId` (already on
`StreamableAgentResponse`). For now the stream still works — the
controller dispatches the right event most of the time — but it's
fragile.

Deferred: not done in this pass to avoid touching the audit middleware
on overnight time. Tracked here.

### B3 — concern — webhook POST runs synchronously inside the request

`afterStream()` calls `Http::timeout(3)->asJson()->post($webhook, …)`
synchronously after the stream ends. It's wrapped in try/catch and
capped at 3s, but it still adds up to 3s to the apparent stream duration
the client observes (the `[DONE]` line is sent _after_ the webhook
returns or times out). Acceptable for MVP; revisit by dispatching to a
queue when broadcasting is enabled.

### S1 — suggestion — missing `connection_id` / per-request `invocationId`

The `start` SSE payload doesn't include `invocationId`. Including it
would let the client correlate logs, retry deduplication, and future
webhook deliveries.

### S2 — suggestion — agent page polls `messages` after every stream

`router.reload({ only: ['messages'] })` runs unconditionally on stream
end. With `<Inertia partial reloads>` it's cheap, but if a user runs
many short prompts, the page round-trips on every one. A two-second
debounce (or just dropping the reload and appending the local row) is
nicer. Nice-to-have.

### S3 — suggestion — welcome.tsx has 471 lines and 3 inner components

Workable, but `MetricTicker` and `FeatureCard` are good candidates for
`resources/js/components/landing/`. Not blocking the build. Defer.

## Acceptance gates re-run

- `npm run types:check` ✓
- `npm run lint:check` ✓ (0 errors, 1 pre-existing warning in
  `data-table.tsx`)
- `npm run build` ✓ (35.06s on the worker round; not re-run here unless
  source changes)
- `php artisan test --compact` ✓ — 66 tests / 377 assertions on the
  worker round.

## Round 2 plan

Worker round 2 will:

1. **B1**: add `$request->session()->save();` early in
   `AgentController::stream()` so the SSE response no longer pins the
   session lock.
2. **B2 / B3 / S1–S3**: documented as concerns/suggestions; deferred
   with explicit notes.
3. Re-run all acceptance gates.

## Round 2 result

- **B1 fixed** — `app/Http/Controllers/AgentController.php::stream()`
  now calls `$request->session()->save()` immediately after capturing
  the user. Concurrent authenticated requests from the same user are
  no longer blocked while a stream is open.
- **B2, B3, S1–S3**: deferred per the plan; documented above.
- Acceptance gates re-run after the fix:
  - `npm run types:check` ✓
  - `npm run lint:check` ✓ (0 errors)
  - `npm run build` ✓ (21.14s)
  - `php artisan test --compact` ✓ (66 tests / 377 assertions)
  - `vendor/bin/pint --dirty --format agent` ✓

## Round 3 result

- **B2 fixed** — `AgentController::stream()` now snapshots
  `AgentMessage::max('id')` before invoking the agent and passes the
  baseline (plus the user id) into `afterStream()`. Resolution becomes
  "row with id strictly greater than the baseline, scoped to the user
  and the prompt" — race-safe even when two prompts share the same
  text.
- **S1 fixed** — the `start` SSE payload carries
  `invocation_id: $stream->invocationId` so clients can correlate.
  `SsePayload` in `resources/js/pages/agent/index.tsx` widened to
  match.
- **B3 / S2 / S3**: still deferred (queue dispatch for the webhook,
  reload debounce, welcome.tsx component split). Documented; not
  blocking.
- Acceptance gates re-run after the fix:
  - `npm run types:check` ✓
  - `npm run lint:check` ✓ (0 errors)
  - `npm run build` ✓ (4.91s, partial cached)
  - `php artisan test --compact` ✓ (66 tests / 377 assertions)
  - `vendor/bin/pint --dirty --format agent` ✓

## Round 4 result

- **B3 fixed** — new `App\Jobs\SendAgentWebhook` queues the outbound
  POST so the SSE response fires `[DONE]` immediately. The job has
  `tries=1`, `timeout=5`, swallows exceptions, and runs on the default
  queue (sync in tests via `phpunit.xml`).
- **S2 fixed** — dropped `router.reload({ only: ['messages'] })` from
  `resources/js/pages/agent/index.tsx`. The history pane already
  reflects the live chat state, so a per-prompt round trip is
  unnecessary. Removed the unused `router` import.
- **S3** still deferred — cosmetic, not blocking the build.
- Acceptance gates re-run after the fix:
  - `npm run types:check` ✓
  - `npm run lint:check` ✓ (0 errors)
  - `npm run build` ✓ (6.33s, partial cached)
  - `php artisan test --compact` ✓ (66 tests / 377 assertions)
  - `vendor/bin/pint --dirty --format agent` ✓

## Round 5 result

- **S3 fixed** — extracted `MetricTicker` and `FeatureCard` (with their
  accent maps and types) into
  `resources/js/components/landing/{metric-ticker,feature-card}.tsx`.
  `welcome.tsx` shrunk from 471 to 356 lines and now imports both.
  Behavior unchanged.
- All WORKLOG findings now closed (B1–B3, S1–S3).
- Acceptance gates re-run after the fix:
  - `npm run types:check` ✓
  - `npm run lint:check` ✓ (0 errors)
  - `npm run build` ✓ (6.25s)
  - `php artisan test --compact` ✓ (66 tests / 377 assertions)
  - `vendor/bin/pint --dirty --format agent` ✓

Pipeline officially complete.
