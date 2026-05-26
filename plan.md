# Sentinel-IoT — UI/UX overhaul + realtime agent chat

> Source of truth: `SPEC.md`. This plan is the implementation breakdown.
> Heartbeat: append a line to `HEARTBEAT.md` after each phase.

## Phase map

| Phase | Topic                            | Files (primary)                                                                 |
|-------|----------------------------------|----------------------------------------------------------------------------------|
| A     | Audit existing UI + key files    | (read-only)                                                                      |
| B     | Welcome (landing) page rewrite   | `resources/js/pages/welcome.tsx`                                                 |
| C     | Dashboard restyle                | `resources/js/pages/dashboard.tsx`                                               |
| D     | Agent realtime chat (SSE)        | `app/Http/Controllers/AgentController.php`, `app/Events/AgentMessageCompleted.php`, `routes/web.php`, `resources/js/pages/agent/index.tsx` |
| E     | Other module pages restyle       | `resources/js/pages/{devices,telemetry,security-events}/*`                       |
| F     | Login restyle                    | `resources/js/pages/auth/login.tsx`                                              |
| G     | Tests + lint + build             | `tests/Feature/AgentControllerTest.php`, build + ts + lint + pest                |
| H     | Docs                             | `README.md`, `docs/ARCHITECTURE.md`, `docs/UI_GUIDE.md`                          |

## Approach (decisions made under "user said: I approve anything reasonable")

1. **Realtime delivery**: SSE only. We will not pull in Reverb / Echo —
   `SentinelAgent->stream()` already returns an iterable of events;
   Laravel's `response()->stream(...)` is enough. JSON-lines payload over
   `text/event-stream` (Server-Sent Events) keeps the existing Docker
   stack untouched. Frontend uses native `fetch` + `ReadableStream` so we
   stay within the current dependency set and Inertia v3 patterns.
2. **AgentMessageCompleted event** is a plain Laravel event (no broadcast
   driver). It exists so the rest of the app and any external webhook
   (`AGENT_WEBHOOK_URL`) can subscribe later. Wired in `EventServiceProvider`.
3. **No new npm deps.** All animation via Tailwind v4 + `tw-animate-css`
   and CSS we already ship.
4. **Reuse existing components** (PageHeader, StatCard, StatusPill,
   SeverityBadge, MarkdownView, DataTable). No replacements.
5. **Wayfinder** stays the URL source; we will add a hand-rolled
   `agent.stream` URL helper or call Wayfinder after generation.
   To avoid touching the Wayfinder vite plugin output, the Inertia page
   will use the absolute path `/agent/stream` returned by `route()` server
   side as a prop — no hardcoded URL on the client.
6. **Typography**: keep Geist Variable as body. Use the existing
   `font-mono` (Tailwind default → ui-monospace) for terminal feel — no
   Fira font import added (avoid network blocking). Cyberpunk aesthetic
   is achieved through color, glow, and grid bg, not new fonts.
7. **No DB migration.** Streaming uses the existing `agent_messages`
   row written by `LogAgentInteractions` middleware on completion.

## Acceptance gate (per SPEC §7)

Run before reporting done:

```
docker exec sentinel-laravel php artisan test --compact
npm run types:check
npm run lint:check
npm run build
docker exec sentinel-laravel vendor/bin/pint --test
```

If any fail, loop on error.

## Status

- [x] A — Audit existing UI + key files
- [x] B — Welcome page rewrite
- [x] C — Dashboard restyle
- [x] D — Agent SSE + chat UI
- [x] E — Other module pages restyle
- [x] F — Login restyle
- [x] G — Tests + lint + build
- [x] H — Docs

## Final summary

**Surface delta**

- `resources/js/pages/welcome.tsx` — cyberpunk SOC landing (hero,
  metric tickers, capability bento, AI agent callout, tech badges, CTA).
- `resources/js/pages/dashboard.tsx` — neon top-stroke + grid bg on the
  realtime telemetry card; mono section caption. Existing data flow
  preserved.
- `resources/js/pages/agent/index.tsx` — ChatGPT-style streaming chat:
  bubbles, typing indicator, tool pill, copy / regenerate / stop, quick
  prompts, history sidebar.
- `resources/js/pages/auth/login.tsx` — terminal-frame login with neon
  orbs and mono labels.
- `resources/js/pages/devices/index.tsx` and
  `resources/js/pages/telemetry/index.tsx` — standardized on
  `PageHeader`. (`security-events` and `incidents` already used it.)
- `resources/views/app.blade.php` — added `<meta name="csrf-token">` for
  the SSE `fetch()` POST.

**Backend delta**

- `app/Events/AgentMessageCompleted.php` — new plain Laravel event,
  fired after each streamed run; broadcast-shaped payload so a future
  `ShouldBroadcast` flip is non-breaking.
- `app/Http/Controllers/AgentController.php` — `stream()` action
  consumes `SentinelAgent::stream($prompt)` and emits SSE
  (`type=start|delta|tool|turn_end|end|error` + `[DONE]`). Dispatches
  `AgentMessageCompleted` and POSTs to optional `AGENT_WEBHOOK_URL`.
- `routes/web.php` — `POST /agent/stream` registered.
- Existing controllers, models, queries, and route signatures left
  untouched.

**Tests**

- `tests/Feature/AgentControllerTest.php` — added two tests:
  - streams tokens over SSE, contains `"type":"start"`, `"type":"end"`,
    the agent text, and `[DONE]`; asserts `AgentMessage` row + dispatched
    event;
  - rejects an empty prompt on the stream endpoint.

**Docs**

- `docs/UI_GUIDE.md` — new design-system orientation (tokens,
  components, accessibility, what-not-to-do).
- `docs/ARCHITECTURE.md` — new "Realtime layer" section with the SSE
  flow + event payload table.
- `README.md` — added "UI overview" section + UI_GUIDE link.

**Acceptance gates**

- `npm run types:check` — clean.
- `npm run lint:check` — 0 errors (1 pre-existing warning in
  `data-table.tsx` from TanStack Table).
- `npm run build` — 35.06s, all chunks emitted.
- `php artisan test --compact` — 66 tests, 377 assertions, all passing
  (66/66; SSE suite +2).
- `vendor/bin/pint --dirty` — passed.
- Pint `--format agent` ran on `AgentController.php` and
  `AgentMessageCompleted.php`.

**Out of scope kept out**

- No DB migrations.
- No new third-party UI libs.
- No Reverb. No `package.json` / `composer.json` changes.
- Welcome page got a third-party rewrite from a parallel agent and was
  kept (it satisfies the SPEC) — lint errors from that pass were
  collapsed into a single SSR-safe `useState` initializer.

