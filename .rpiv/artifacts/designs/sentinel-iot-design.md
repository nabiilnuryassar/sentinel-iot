---
title: Sentinel-IoT — Design
source_prd: docs/PRD.md
status: draft
created: 2026-05-15
owner: sentinel-iot team
---

# Sentinel-IoT — Design Document

This document translates `docs/PRD.md` into an implementation-ready architecture for the existing Laravel 13 + Inertia React starter kit. It locks the high-level decisions, names the vertical slices that will become phases in the plan, and maps every slice to concrete files in this repo.

For requirements, problem framing, user stories, and demo scenarios, see the PRD. This file owns "how we build it"; the PRD owns "what we build and why".

---

## 1. Scope of this design

In scope:
- Single-server (Docker Compose) deployment of MQTT broker, Laravel app, Postgres, and Python workers (ingestor, AI agent, Telegram bot).
- Laravel as the only system-of-record: telemetry, devices, security events, incidents, agent messages, device policies.
- Laravel UI built with the existing Inertia React stack (no Filament install — see §3.1).
- Python services kept thin: I/O adapters around the broker, the LLM, and Telegram. Business logic stays in Laravel.

Out of scope (matches PRD §6.2):
- Real hardware, LoRaWAN, K8s, HA, hardened TLS, full SIEM, ML anomaly detection, multi-tenant.

---

## 2. Architectural decisions

Each decision is numbered so the plan and future ADRs can reference them.

### D1. System-of-record is PostgreSQL via Laravel
PRD §10.2 leaves InfluxDB optional. We pick Postgres only for the MVP. Time-series queries on `telemetry_logs` are bounded by demo volume (5 devices × 12 msg/min ≈ 86k rows/day). A single composite index covers the access pattern.

Rejected: InfluxDB. Adds another container, another driver, and a second source of truth the AI agent has to read.

### D2. MQTT ingestion lives in a Python sidecar, not Laravel
Reason: `paho-mqtt` is the de-facto client and ingestion is a long-lived subscriber loop, which fits a dedicated worker better than a queued Laravel job. The ingestor writes directly to Postgres using the same schema Laravel migrates.

Rejected: `php-mqtt/laravel-client` inside a queue worker. Workable but doubles the Laravel runtime footprint and complicates restart semantics.

### D3. AI agent runs in-process via the Laravel AI SDK
Laravel hosts the agent natively using the [`laravel/ai`](https://laravel.com/docs/13.x/ai-sdk) package. Each agent is a PHP class in `app/Ai/Agents/` (`SentinelAgent`, `IncidentAnalyst`, `AuditAgent`); each tool is a PHP class in `app/Ai/Tools/`. The SDK manages provider auth (OpenAI / Anthropic / Gemini), tool-call loops, conversation memory (`agent_conversations` + `agent_conversation_messages` tables shipped by the package), and structured output.

Laravel controllers call agents directly: `(new SentinelAgent)->forUser($user)->prompt($input)`. The Telegram bot reaches the same agents via the Laravel REST API. Conversation memory lives in SDK tables; the existing `agent_messages` table from Phase 3a stays as the dashboard feed / audit log keyed by `source` (`web`, `telegram`, `system`). One row per user-visible interaction, regardless of how many tool calls the SDK ran underneath.

Rejected: a separate Python FastAPI service. Adds another container, another deploy artefact, another auth boundary, and a synchronous HTTP hop on the critical path. The SDK already covers everything the FastAPI service was going to do — including streaming, tool calls, structured output, queue dispatch, and middleware. Keeping the agent in-process also lets tools reach Eloquent models without an HTTP round-trip.

### D4. Telegram bot is a thin Python relay
The bot turns `/status`, `/devices`, `/incidents`, `/audit` into HTTP calls against the Laravel REST API. Free-form questions hit `POST /api/agent/ask`, which forwards to `SentinelAgent` (D3). Admin allowlist is a single chat ID from env (PRD §25.1).

### D5. UI built on Inertia React + shadcn/ui
The starter kit is already wired with Inertia v3, React 19, Tailwind v4, Wayfinder, and ESLint/Prettier. PRD §10.1, §10.2, §12.4 align with this stack. We build the dashboard as Inertia pages, compose UI with shadcn/ui primitives, and reuse Wayfinder-generated route helpers from `@/actions` and `@/routes`.

Library choices (locked, not exhaustive):
- **shadcn/ui** — Radix-based primitives, copy-paste into `resources/js/components/ui/`. Avoids runtime dependency lock-in.
- **lucide-react** — icon set used by shadcn examples.
- **@tanstack/react-table** + shadcn `data-table` — paginated tables for telemetry, devices, events, incidents.
- **Recharts** — telemetry trend charts on the dashboard and device show pages.
- **sonner** — toast notifications (`<Toaster />` mounted once in the root layout).
- **react-markdown** + **remark-gfm** — render incident report markdown returned by the AI agent.
- **date-fns** — formatting `received_at`, `detected_at`, `last_seen_at`. No moment, no dayjs.
- **Forms** — Inertia v3 `useForm` + `<Form>` for server-driven flows (incidents, devices). Reach for `react-hook-form` + `zod` only if a form is purely client-side or has dynamic field arrays.

Explicitly skipped for MVP:
- **framer-motion** — no motion budget required.
- **cmdk / command palette** — six pages, sidebar nav is enough.
- **TanStack Query / SWR** — Inertia owns data fetching; adding a parallel layer creates two sources of truth.
- **Storybook** — components are thin enough that Pest browser smoke tests cover them.

### D6. Telemetry write path is append-only; reads use a covering index
Schema (per PRD §13.2) plus index `(device_id, received_at desc)` for the "latest N for a device" query that powers both the dashboard and `get_recent_telemetry()`.

### D7. Security event creation is centralized in the ingestor
Malformed payload, schema violation, ACL mismatch detected client-side — all become rows in `security_events` written by the ingestor. The AI agent reads them, the Laravel UI lists them, the attack simulator triggers them. One writer, many readers.

### D8. Incident lifecycle: open → investigating → resolved
Severity is a string enum (`low|medium|high|critical`). `affected_device_id` is a soft FK (string) to match PRD §13.2 — devices can be referenced before the row exists, and demos can run without seeding every device.

### D9. Auth model: single admin role for MVP
PRD §6.2 explicitly excludes complex roles. `users.role` defaults to `admin`. API auth via Laravel Sanctum bearer tokens for the Python services (ingestor, telegram bot); session/Inertia auth for the browser. The AI agent does not need its own token because it lives inside the Laravel app process.

### D10. Configuration via `.env`; no secrets in compose
Every service reads its own env block. Mosquitto password file and ACL file are mounted volumes, not env. LLM provider keys (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`), Telegram, and DB creds stay in `.env` and are passed through `docker-compose.yml`'s `environment:` map.

---

## 3. Component map

```
Laptop (developer)
├── simulator/                  Python device simulator (PRD §12.1)
└── services/attack-simulator/  Python attack scripts (PRD §12.7)

Server (Docker Compose)
├── mosquitto                   Eclipse Mosquitto, port 1883
├── postgres                    Postgres 16, port 5432
├── laravel-app                 Laravel 13 + Inertia React + Laravel AI SDK (this repo)
├── services/mqtt-ingestor      Python paho-mqtt subscriber
└── services/telegram-bot       Python python-telegram-bot
```

The AI agent is **not** a separate service. It lives inside `laravel-app` as `App\Ai\Agents\*` and `App\Ai\Tools\*`, powered by the `laravel/ai` package.

Existing repo structure is preserved. New top-level folders (`mosquitto/`, `services/`, `simulator/`, `docker-compose.yml`) are added at Phase 0.

### 3.1 Frontend stack alignment
The repo already ships:
- `resources/js/pages/` — Inertia pages directory
- `vite.config.ts` with `@laravel/vite-plugin-wayfinder`
- Tailwind v4 + ESLint v9 + Prettier v3
- `tests/` set up for Pest 4 with browser testing available

The MVP UI is six Inertia pages (dashboard, devices, telemetry, security events, incidents, agent console). All six are built from shadcn/ui primitives plus a small set of domain components in `resources/js/components/`:

```
resources/js/components/
├── ui/                   # shadcn primitives (button, card, table, dialog, ...)
├── severity-badge.tsx    # maps low/medium/high/critical -> shadcn Badge variant
├── status-pill.tsx       # online/offline/unknown device status
├── stat-card.tsx         # dashboard summary tile
├── telemetry-chart.tsx   # Recharts line chart for a device
├── data-table.tsx        # generic shadcn data-table wrapper
└── markdown-view.tsx     # react-markdown wrapper with shadcn typography
```

Wayfinder regenerates `@/actions` and `@/routes` on every `npm run build` / `npm run dev`. All `<Link>` and form `action` props consume those helpers, never hardcoded URLs.

---

## 4. Vertical slices

Each slice is one user-visible capability that can be demoed independently. Slices map 1:1 to plan phases, but a slice is "what works after this", not "what tasks we did".

### S1. Compose environment boots
After this slice, `docker compose up -d` brings up Mosquitto, Postgres, and the Laravel app. The Laravel home page renders, Postgres accepts connections, Mosquitto accepts authenticated MQTT publishes from MQTTX.

Files:
- `docker-compose.yml` (new)
- `.env.example` updated with MQTT/Telegram/OpenAI placeholders
- `mosquitto/config/mosquitto.conf`, `passwordfile`, `aclfile` (new)
- `Dockerfile` for laravel-app (new) — PHP 8.4-FPM + nginx or `php artisan serve` for dev

### S2. Virtual device → broker
A Python script on the laptop publishes JSON telemetry every 5 s for 5 device profiles. MQTTX confirms delivery on `iot/{building}/{room}/{device_id}/telemetry`.

Files:
- `simulator/virtual_devices.py`
- `simulator/device_profiles.json` (5 profiles per PRD §12.1)
- `simulator/requirements.txt`
- `simulator/README.md`

### S3. Ingestor persists telemetry and creates security events
Subscriber on `iot/+/+/+/telemetry` and `iot/+/+/+/event` parses topic, validates JSON, writes `telemetry_logs`, updates `devices.last_seen_at`, emits a `malformed_payload` row in `security_events` on failure.

Files:
- `services/mqtt-ingestor/app.py`
- `services/mqtt-ingestor/db.py` (psycopg connection + insert helpers)
- `services/mqtt-ingestor/validators.py`
- `services/mqtt-ingestor/Dockerfile`
- `services/mqtt-ingestor/requirements.txt`

Schema for ingestor writes is owned by Laravel migrations (see S4).

### S4. Laravel data model + migrations + seeders
All tables from PRD §13.2: `users` (already present), `devices`, `telemetry_logs`, `security_events`, `incidents`, `incident_reports`, `agent_messages`, `device_policies`. Models with relationships and factories.

Files:
- `database/migrations/2026_05_15_*` (one per table)
- `app/Models/Device.php`, `TelemetryLog.php`, `SecurityEvent.php`, `Incident.php`, `IncidentReport.php`, `AgentMessage.php`, `DevicePolicy.php`
- `database/factories/*Factory.php`
- `database/seeders/DatabaseSeeder.php` updated with 5 demo devices

### S5. Inertia dashboard + resource pages
Six pages: Dashboard summary, Devices index/show, Telemetry index, Security Events index, Incidents index/show, Agent Console.

Files:
- `app/Http/Controllers/DashboardController.php`
- `app/Http/Controllers/DeviceController.php`
- `app/Http/Controllers/TelemetryController.php`
- `app/Http/Controllers/SecurityEventController.php`
- `app/Http/Controllers/IncidentController.php`
- `app/Http/Controllers/AgentController.php`
- `routes/web.php` updated with named routes (Wayfinder picks them up)
- `resources/js/pages/dashboard.tsx`, `devices/index.tsx`, `devices/show.tsx`, `telemetry/index.tsx`, `security-events/index.tsx`, `incidents/index.tsx`, `incidents/show.tsx`, `agent/index.tsx`
- `resources/js/components/` — small set of cards, tables, severity badges (Tailwind only, no UI library)
- Pest feature tests under `tests/Feature/` for each controller

### S6. Laravel REST API for the AI agent and Telegram bot
Endpoints from PRD §14.1, scoped under `/api/`. Sanctum-token auth. Resources under `app/Http/Resources/`.

Files:
- `routes/api.php`
- `app/Http/Controllers/Api/*` mirroring web controllers
- `app/Http/Resources/{Device,TelemetryLog,SecurityEvent,Incident}Resource.php`
- `app/Http/Requests/*` for create/update validation
- Pest feature tests under `tests/Feature/Api/`

### S7. AI Agent (Laravel AI SDK, in-process)
Laravel hosts the agent natively via `laravel/ai`. Three agent classes plus a tool surface. The Telegram bot, the dashboard agent console, and any incident workflow all reach the same agents — either by direct method call (web routes) or through the existing Laravel REST API (Telegram bot).

**Phase 4 file map:**

Composer / config / migrations:
- `composer.json` — `laravel/ai` added
- `config/ai.php` — published from the SDK; provider list + default models
- `database/migrations/*_create_agent_conversations_table.php` — published from the SDK
- `database/migrations/*_create_agent_conversation_messages_table.php` — published from the SDK

Agent surface (`app/Ai/Agents/`):
- `SentinelAgent.php` — implements `Agent`, `Conversational`, `HasTools`. Uses `Promptable` and `RemembersConversations`. Default agent for the dashboard console and `/api/agent/ask`.
- `IncidentAnalyst.php` — implements `Agent`, `HasStructuredOutput`. Returns `{ summary, root_cause, impact, recommendation, severity, report_markdown }` per PRD §22.2. Powers `POST /api/agent/analyze-incident/{id}`.
- `AuditAgent.php` — implements `Agent`, `HasTools`. Powers `POST /api/agent/audit`.

Tool surface (`app/Ai/Tools/`):
- `GetDeviceStatus.php`, `GetRecentTelemetry.php`, `GetSecurityEvents.php`, `GetOpenIncidents.php`, `AnalyzeAnomaly.php`, `AuditMqttBroker.php`, `GenerateIncidentReport.php`, `RecommendMitigation.php`
- Each implements `Laravel\Ai\Contracts\Tool` with `description()`, `handle(Request $request)`, `schema(JsonSchema $schema)`. Tools query Eloquent directly — no HTTP hop, no separate service.

Prompts (`resources/ai/prompts/`):
- `sentinel-system.md` — PRD §22.1, loaded by `SentinelAgent::instructions()`
- `incident-analyst.md` — PRD §22.2 framing, loaded by `IncidentAnalyst::instructions()`
- `audit.md` — audit-specific framing, loaded by `AuditAgent::instructions()`

Controller glue:
- `app/Http/Controllers/AgentController.php` (web) — calls `(new SentinelAgent)->forUser($user)->prompt($input)`, persists one row into `agent_messages` with `source='web'` for the dashboard feed/audit log.
- `app/Http/Controllers/Api/AgentController.php` (api/sanctum) — same surface for the Telegram bot, persists with `source='telegram'`.

Tests:
- `tests/Feature/AgentControllerTest.php` — Pest feature test using the SDK's testing fakes (the PRD's referenced `Laravel\Ai\Testing` helpers) so no real LLM call is made.
- `tests/Unit/Ai/Tools/*Test.php` — fast unit tests per tool, calling `handle()` directly with seeded data.

**Removed from this design:**
- `services/ai-agent/*` (FastAPI service, llm.py, MockLLMClient, pytest tests) — the SDK replaces all of it.
- `app/Services/AgentClient.php` — no HTTP client needed; controllers call agents directly.

### S8. Telegram bot
Bot polls Telegram, restricts to `TELEGRAM_ADMIN_CHAT_ID`, dispatches `/status`, `/devices`, `/incidents`, `/audit`, `/help`, `/start` to the agent or Laravel API.

Files:
- `services/telegram-bot/bot.py`
- `services/telegram-bot/handlers/`
- `services/telegram-bot/Dockerfile`
- `services/telegram-bot/requirements.txt`

### S9. Attack simulator
Four scripts that generate the security events the demo relies on.

Files:
- `services/attack-simulator/unauthorized_publish.py`
- `services/attack-simulator/malformed_payload.py`
- `services/attack-simulator/spoof_device.py`
- `services/attack-simulator/publish_flood.py`
- `services/attack-simulator/README.md`

### S10. Incident report generator + demo polish
End-to-end: open an incident from a security event, the Laravel UI calls `POST /api/agent/analyze-incident/{id}`, the agent returns markdown, Laravel persists it as an `incident_report` and renders it on the incident page. Adds the demo seed data, READMEs, and the Mermaid diagrams from PRD §29 reproduced in `docs/ARCHITECTURE.md`.

Files:
- `app/Http/Controllers/IncidentController@generateReport`
- `resources/js/pages/incidents/show.tsx` updated with report panel
- `docs/ARCHITECTURE.md`, `docs/DEMO_SCENARIO.md`, `docs/API.md`, `docs/DATABASE.md` (extracted from PRD)
- `README.md` rewritten with run instructions

---

## 5. Slice → phase mapping

| Slice | Phase  | PRD §          |
| ----- | ------ | -------------- |
| S1    | Phase 0 | §18 Phase 0   |
| S2    | Phase 1 | §18 Phase 1   |
| S3    | Phase 2 | §18 Phase 2   |
| S4-S5 | Phase 3 | §18 Phase 3   |
| S6    | Phase 3 | §18 Phase 3   |
| S7    | Phase 4 | §18 Phase 4   |
| S8    | Phase 5 | §18 Phase 5   |
| S9    | Phase 6 | §18 Phase 6   |
| S10   | Phase 7 | §18 Phase 7   |

The plan in `thoughts/shared/plans/sentinel-iot-plan.md` expands each phase into atomic tasks.

---

## 6. Data contracts

Two boundaries matter most: the MQTT payload and the Laravel REST API. Everything else is internal.

### 6.1 MQTT telemetry payload (PRD §12.1)
Required fields: `device_id`, `type`, `timestamp`, `location`. Anything else is type-specific (temperature, humidity, voltage, …) and goes into `telemetry_logs.payload_json` plus the typed columns when present.

Topic format: `iot/{building}/{room}/{device_id}/telemetry`. The ingestor extracts `building`, `room`, `device_id` from the topic and cross-checks `device_id` against the payload — mismatch → `device_spoofing` security event.

### 6.2 REST API
PRD §14.1 is authoritative. Resource shape examples:

```json
// GET /api/dashboard/summary
{
  "total_devices": 5,
  "online_devices": 4,
  "offline_devices": 1,
  "security_events_today": 3,
  "open_incidents": 1,
  "risk_level": "medium"
}
```

`risk_level` is computed: `critical` if any open critical incident, else `high`/`medium`/`low` from rolling 24 h event counts (thresholds in `config/sentinel.php`).

### 6.3 Agent → Laravel
Laravel controllers call agents directly via the SDK; no transport contract. The persisted shape in `agent_messages` is:
```json
{
  "prompt": "string",
  "response": "string",
  "source": "web | telegram | system",
  "metadata_json": {
    "recommendations": ["string", ...],
    "tool_calls": [{ "tool": "GetDeviceStatus", "args": {}, "result_summary": "..." }],
    "conversation_id": "string | null",
    "usage": { "input_tokens": 0, "output_tokens": 0 }
  }
}
```
The `conversation_id` cross-references the SDK's `agent_conversations` row. SDK manages context window; `agent_messages` manages audit trail.

---

## 7. Cross-cutting concerns

### 7.1 Config
- `config/sentinel.php` — risk thresholds, retention windows, agent timeouts.
- `.env` keys per PRD §21, plus `SANCTUM_AGENT_TOKEN`, `SANCTUM_BOT_TOKEN`.

### 7.2 Auth
- Browser: existing Laravel session/Inertia auth.
- Python services (ingestor, telegram bot) → Laravel: Sanctum personal access tokens, one per service. Created by a console command `php artisan sentinel:issue-tokens` and emitted into `.env`.
- Telegram → bot: hardcoded admin chat ID.
- AI agent has no separate auth boundary — it runs inside the Laravel app process. LLM provider keys (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`) live in `.env` and are read by the SDK via `config/ai.php`.

### 7.3 Logging and observability
- Laravel logs to `storage/logs/laravel.log` and stdout. AI agent calls log via the SDK's `LogPrompts`-style middleware (we add one).
- Mosquitto logs to `mosquitto/logs/`.
- Python services (ingestor, telegram bot) log JSON lines to stdout, scraped by `docker compose logs`.
- A single `php artisan sentinel:health` command pings broker, DB, default LLM provider (cheap echo prompt) and returns exit 0/1.

### 7.4 Testing strategy
- Pest feature tests for every Laravel controller and API endpoint (PRD §17 acceptance criteria).
- Pest browser test for the dashboard smoke check (one visit, no JS errors).
- Pest unit tests for AI tools — each `App\Ai\Tools\*` is exercised with seeded data via its `handle()` method, no LLM call.
- Pest feature tests for `AgentController` use the SDK's testing fakes (`Laravel\Ai\Testing` helpers per the docs) so no real LLM call hits the network.
- Pytest unit tests for ingestor validators (no broker, no DB).
- One integration test in `tests/Feature/EndToEndIngestionTest.php` that publishes a fake message via paho into a local broker, asserts a row appears.

### 7.5 Performance budget (matches PRD §25.2)
- Ingestor sustains 5 devices × 1 msg/5 s = 1 Hz. Aim for <50 ms per insert.
- Dashboard summary query: <100 ms with the covering index from D6.
- Agent prompt round-trip: <8 s end-to-end with a real LLM (`SentinelAgent` with 2–3 tool calls), <500 ms in tests using the SDK fake.

### 7.6 Security
- MQTT auth + ACL mandatory. Anonymous disabled.
- Sanctum tokens scoped (`ingestor:write`, `bot:read`). Agent has no token; it lives in-process.
- Telegram admin allowlist enforced before any tool call.
- AI tools that read are unrestricted (Eloquent reads on the same connection as the controller). Tools that *would* write — `GenerateIncidentReport`, future `BlockClient` — must be approval-gated: tool returns the proposed action plus a token; admin clicks Approve in the UI to commit. PRD §12.5 calls this out.
- LLM provider keys never logged. The SDK's middleware pipeline lets us redact prompts in audit logs if needed.

---

## 8. Open questions

1. LLM provider for the demo. The PRD lists OpenAI/Gemini/Claude; the SDK supports all three through `config/ai.php`. Default the demo to OpenAI; flip via `.env` with no code change. A 1-line ADR will pin the demo choice once the key is provisioned.
2. Postgres vs MySQL. PRD says either. The repo's `.env` already targets sqlite by default. Plan Phase 0 already switched `.env.example` to Postgres.
3. Whether to add Redis for the bot's command queue. Skipped for MVP — the bot is single-process and stateless.
4. Approval workflow for write-capable tools. Phase 7 problem, not Phase 4. We ship `IncidentAnalyst` as read-and-summarize first; `GenerateIncidentReport` writes via a Laravel controller call (not from inside the tool) so the audit boundary stays in the HTTP layer.

These do not block design approval; they're flagged for the plan to resolve before the affected phase starts.

---

## 9. Risk register (delta from PRD §26)

PRD §26 covers the strategic risks. Implementation-specific ones:

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Tailwind v4 + custom components churn | Medium | Use only utility classes; no design-system commitment for MVP |
| Wayfinder regenerate breaks frontend imports after route renames | Medium | Run `npm run dev` before every PR, verify TS build clean |
| Mosquitto ACL misconfiguration silently allows publishes | Medium | Phase 1 includes an MQTTX-based negative test in the demo script |
| Sanctum token leak via docker logs | Low | Pass tokens via env, never log them; `php artisan sentinel:issue-tokens` writes to `.env` only |
| Pest browser tests flake under headless Chrome on CI | Low | Keep them off CI for MVP; run locally before demo |

---

## 10. Acceptance criteria for "design done"

The plan can start when:
- All ten slices are listed with file maps (above).
- Decisions D1–D10 are recorded.
- The data contracts in §6 match PRD §13 and §14.
- D3 (Laravel AI SDK in-process) supersedes the previous FastAPI-sidecar design; Phase 4 of the plan reflects this.

Status: ready for plan.
