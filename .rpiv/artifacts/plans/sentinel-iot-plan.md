---
title: Sentinel-IoT — Phased Execution Plan
source_prd: docs/PRD.md
source_design: thoughts/shared/designs/sentinel-iot-design.md
status: draft
created: 2026-05-15
---

# Sentinel-IoT — Execution Plan

This plan turns `thoughts/shared/designs/sentinel-iot-design.md` into ordered, atomic tasks. Each phase ends in a demoable state; success criteria are verifiable, not subjective.

Conventions:
- Tasks are imperative one-liners. The "command" line is what an agent runs to verify, not what it runs to implement.
- Phases run sequentially. Tasks inside a phase that don't share files can run in parallel.
- "Done" for a phase means every success criterion passes and `php artisan test --compact` is green for whatever Laravel surface that phase touched.

---

## Phase 0 — Compose environment boots

Goal (slice S1): `docker compose up -d` starts Mosquitto, Postgres, and the Laravel app. The Laravel home page renders, Postgres accepts connections, MQTTX can publish to Mosquitto with credentials.

Reference: PRD §18 Phase 0, §20, §21. Design D5, D10.

### Tasks

P0.1 Create `docker-compose.yml` at repo root with services: `mosquitto`, `postgres`, `laravel-app`. Network: default bridge. Volumes for Mosquitto config/logs and Postgres data.

P0.2 Create `mosquitto/config/mosquitto.conf` with listener 1883, `allow_anonymous false`, `password_file /mosquitto/config/passwordfile`, `acl_file /mosquitto/config/aclfile`, log to `/mosquitto/log/mosquitto.log`.

P0.3 Create `mosquitto/config/passwordfile` with two users: `sentinel_device` and `sentinel_ingestor`. Generate with `mosquitto_passwd` and commit the hashed file.

P0.4 Create `mosquitto/config/aclfile` granting `sentinel_device` publish on `iot/#`, `sentinel_ingestor` subscribe on `iot/#` and `security/#`.

P0.5 Add a `Dockerfile` for `laravel-app` (PHP 8.4-cli, install composer deps, expose 8000, default cmd `php artisan serve --host=0.0.0.0`). Keep it dev-grade.

P0.6 Update `.env.example` with the env block from PRD §21. Switch `DB_CONNECTION` to `pgsql` and rename DB host to `postgres`.

P0.7 Update `.env` (local) the same way and verify Laravel boots against Postgres (`php artisan migrate:status`).

P0.8 Add `docker-compose.override.yml.example` documenting how to mount `./` for hot reload.

P0.9 Sanity-test:
- `docker compose up -d`
- `curl -fsS http://localhost:8000/` returns 200
- `mosquitto_pub -h localhost -p 1883 -u sentinel_device -P <pw> -t test -m hello` exits 0
- `psql -h localhost -U sentinel -d sentinel_iot -c '\l'` succeeds

### Success criteria

- `docker compose ps` shows `mosquitto`, `postgres`, `laravel-app` all healthy.
- The Laravel welcome page returns HTTP 200.
- An anonymous MQTT publish is rejected; an authenticated one succeeds.
- `php artisan migrate:status` runs without error against Postgres.

---

## Phase 1 — Virtual device → broker

Goal (slice S2): A Python script on the laptop publishes JSON telemetry every 5 s for 5 device profiles. MQTTX confirms delivery on the right topic.

Reference: PRD §12.1, §18 Phase 1.

### Tasks

P1.1 Create `simulator/device_profiles.json` listing the five devices from PRD §12.1: `temp-sensor-001`, `door-lock-001`, `power-meter-001`, `air-quality-001`, `water-leak-001`. Each entry: `device_id`, `type`, `building`, `room`, `topic`, `payload_template`.

P1.2 Create `simulator/virtual_devices.py` using `paho-mqtt`:
- Loads `device_profiles.json`.
- For each device, spawns a thread that publishes telemetry every `interval` seconds (default 5).
- Supports `--anomaly device_id` flag to force out-of-range values for that device.
- Reads broker host/port/user/pass from env (`MQTT_HOST`, `MQTT_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`).

P1.3 Create `simulator/requirements.txt` (`paho-mqtt`, `python-dotenv`).

P1.4 Create `simulator/README.md` with `pip install -r requirements.txt` and `python virtual_devices.py` usage.

P1.5 Verify with MQTTX: subscribe to `iot/#`, run the simulator, confirm 5 streams of messages with valid JSON shape.

### Success criteria

- `python simulator/virtual_devices.py` publishes at least one message per device within 10 seconds of start.
- MQTTX shows messages on `iot/{building}/{room}/{device_id}/telemetry` for all five devices.
- `--anomaly temp-sensor-001` produces a payload with `temperature` outside 0–60 °C.

---

## Phase 2 — Ingestor persists telemetry and creates security events

Goal (slice S3): Subscriber on `iot/+/+/+/telemetry` and `iot/+/+/+/event` parses topic, validates JSON, writes `telemetry_logs`, updates `devices.last_seen_at`, emits `malformed_payload` rows in `security_events` on failure.

Reference: PRD §12.3, §18 Phase 2. Design D2, D6, D7.

Depends on Phase 3's migrations being defined. To unblock parallel work, the migrations land before P2.1 — see "Cross-phase note" below.

### Cross-phase note

The migrations from Phase 3 need to exist before the ingestor can write rows. Run P3.1–P3.7 (migrations only, no models or seeders) before starting Phase 2. The plan keeps these in Phase 3 because they're owned by the Laravel app, but the dependency is one-way.

### Tasks

P2.1 Create `services/mqtt-ingestor/db.py` with a psycopg connection pool, plus `insert_telemetry`, `update_device_last_seen`, `insert_security_event` functions matching the migration columns.

P2.2 Create `services/mqtt-ingestor/validators.py`:
- `validate_telemetry(payload, topic) -> Tuple[bool, Optional[str]]`
- Required fields per PRD §12.3: `device_id`, `type`, `timestamp`, `location`.
- Topic device_id must equal payload device_id; mismatch returns reason `device_spoofing`.

P2.3 Create `services/mqtt-ingestor/app.py`:
- Connects to broker with `sentinel_ingestor` creds.
- Subscribes to `iot/+/+/+/telemetry` and `iot/+/+/+/event`.
- For each message: parse → validate → write telemetry or security event.
- Handles connection loss with exponential backoff (paho `reconnect_delay_set`).

P2.4 Create `services/mqtt-ingestor/Dockerfile` (python:3.12-slim, install requirements, run `app.py`).

P2.5 Create `services/mqtt-ingestor/requirements.txt` (`paho-mqtt`, `psycopg[binary]`, `python-dotenv`).

P2.6 Add `services/mqtt-ingestor/tests/test_validators.py` with pytest cases:
- valid payload returns `(True, None)`
- missing `device_id` returns `(False, 'missing_device_id')`
- topic/payload mismatch returns `(False, 'device_spoofing')`
- non-JSON string raises and is caught upstream

P2.7 Wire the ingestor into `docker-compose.yml` with `depends_on: [postgres, mosquitto]`.

P2.8 End-to-end check:
- Start compose stack and the laptop simulator.
- After 30 s, `select count(*) from telemetry_logs;` is > 0 and matches device count × ~6 messages.
- Run `services/attack-simulator/malformed_payload.py` (stub for now: a 5-line script publishing `{"foo":"bar"}` to a telemetry topic). Expect a new row in `security_events` with `event_type='malformed_payload'`.

### Success criteria

- `pytest services/mqtt-ingestor/tests/` passes.
- After running the simulator for 30 seconds, `telemetry_logs` has rows for all 5 devices and each device's `last_seen_at` is within the last minute.
- A malformed publish creates one row in `security_events` with `severity='medium'` and `event_type='malformed_payload'`.

---

## Phase 3 — Laravel data model + dashboard + REST API

Goal (slices S4 + S5 + S6): All schema, models, factories, Inertia pages, and `/api/*` endpoints from PRD §13–§14.

Reference: PRD §13, §14, §18 Phase 3. Design D1, D5, D6, D8, D9.

This phase is large. It splits cleanly into three sub-phases that can be reviewed independently.

### 3a — Schema and models

P3.1 `php artisan make:migration create_devices_table` — columns per PRD §13.2 plus `metadata_json` jsonb. Index on `device_id` unique, plus `(status, last_seen_at)`.

P3.2 `create_telemetry_logs_table` — columns per PRD §13.2 plus index `(device_id, received_at desc)` (Design D6).

P3.3 `create_security_events_table` — columns per PRD §13.2 plus index `(severity, detected_at desc)`.

P3.4 `create_incidents_table` — columns per PRD §13.2. `severity` and `status` as string columns with constants in the model.

P3.5 `create_incident_reports_table` — FK `incident_id` → `incidents.id`, `report_markdown` text.

P3.6 `create_agent_messages_table` — columns per PRD §13.2.

P3.7 `create_device_policies_table` — columns per PRD §13.2.

P3.8 Run migrations against the Postgres container. Verify `php artisan migrate:status` shows all green.

P3.9 Create models: `Device`, `TelemetryLog`, `SecurityEvent`, `Incident`, `IncidentReport`, `AgentMessage`, `DevicePolicy`. Wire relationships:
- `Device hasMany TelemetryLog` (FK `device_id` → `device_id`, both string columns).
- `Device hasMany SecurityEvent` via `source_client_id` left as soft string FK; relationship not strict — see Design D7.
- `Incident hasMany IncidentReport`.
- `User hasMany AgentMessage`.
- `User hasMany Incident` via `created_by` (add this column in P3.4 if missing — see PRD §13.1 ERD).

P3.10 Create factories for every model. Use Faker datasets for device types (`['temperature_sensor','door_lock','power_meter','air_quality','water_leak']`).

P3.11 Update `database/seeders/DatabaseSeeder.php` to seed:
- 1 admin user (`admin@sentinel.local`).
- 5 devices matching simulator profiles (Phase 1).
- 10 sample telemetry rows per device.
- 3 sample security events of varying severity.
- 1 open incident linked to one of those events.

P3.12 `php artisan db:seed` runs without errors and `php artisan tinker --execute 'App\Models\Device::count();'` returns 5.

### 3b — UI library setup

Goal: every visual component used in 3c–3d resolves to a real export. No ad-hoc styling.

P3.13 Initialize shadcn/ui:
```bash
npx shadcn@latest init
```
Accept the defaults that match the existing stack (TypeScript, Tailwind v4, `resources/js/components/ui` for the components dir, `@/components` and `@/lib/utils` aliases). Confirm `components.json` lands at the repo root and `resources/js/lib/utils.ts` exports `cn`.

P3.14 Add the primitives the dashboard needs:
```bash
npx shadcn@latest add button card table dialog sheet tabs badge input select dropdown-menu sonner skeleton separator scroll-area textarea label
```
Verify each file exists under `resources/js/components/ui/`.

P3.15 Install supporting libraries:
```bash
npm install recharts react-markdown remark-gfm date-fns lucide-react @tanstack/react-table
```
Lock versions in `package.json`. No `^` is fine — npm pins ranges by default; do not loosen them.

P3.16 Mount `<Toaster />` (sonner) once in the root Inertia layout (`resources/js/layouts/app-layout.tsx` if present, otherwise create it). Add `position="top-right"` and `richColors`.

P3.17 Create the domain component shells with prop types and a no-op render. They get filled in 3c:
- `resources/js/components/severity-badge.tsx` — input: `severity: 'low'|'medium'|'high'|'critical'`. Uses shadcn `Badge` with variant map.
- `resources/js/components/status-pill.tsx` — input: `status: 'online'|'offline'|'unknown'`. Uses shadcn `Badge` + a colored dot.
- `resources/js/components/stat-card.tsx` — input: `{ label, value, hint?, icon? }`. Uses shadcn `Card`.
- `resources/js/components/telemetry-chart.tsx` — input: `{ data, dataKey, xKey }`. Wraps Recharts `LineChart` + `ResponsiveContainer`.
- `resources/js/components/data-table.tsx` — generic wrapper around `@tanstack/react-table` and shadcn `Table` with pagination.
- `resources/js/components/markdown-view.tsx` — wraps `react-markdown` with `remark-gfm` and shadcn typography classes.

P3.18 Add `resources/js/lib/format.ts` with `formatDateTime(iso)`, `formatRelative(iso)` (uses `date-fns`), `formatNumber(n)`. Used everywhere instead of inline `Date` calls.

P3.19 Run `npm run build` to ensure TypeScript and the Wayfinder vite plugin compile cleanly.

### 3c — Inertia dashboard

P3.20 Create `app/Http/Controllers/DashboardController.php` with `index()` returning summary metrics via `Inertia::render('dashboard', [...])`.

P3.21 Create `resources/js/pages/dashboard.tsx` displaying total/online/offline devices, today's security events, open incidents, risk level. Uses `<StatCard>` x5 plus a `<TelemetryChart>` for an aggregate signal (e.g. message count per minute over the last hour).

P3.22 Add `app/Http/Controllers/DeviceController.php` with `index`, `show`. Inertia pages `devices/index.tsx` (uses `<DataTable>`), `devices/show.tsx` (header card + `<TelemetryChart>` for the last 100 rows + recent events table).

P3.23 `TelemetryController@index` paginates `telemetry_logs` with filters (`device_id`, `from`, `to`). Page `telemetry/index.tsx` renders `<DataTable>` with date pickers feeding the filters.

P3.24 `SecurityEventController@index` paginates `security_events` with filters. Page `security-events/index.tsx`. Severity column uses `<SeverityBadge>`.

P3.25 `IncidentController@index`, `show`, `store`, `update`. Pages `incidents/index.tsx`, `incidents/show.tsx`. Show page renders summary, root cause, recommendation in a `<Card>` grid; the report panel uses `<MarkdownView>` and is a placeholder until Phase 7.

P3.26 `AgentController@index` renders an Inertia page `agent/index.tsx` with a shadcn `<Textarea>` + `<Button>` and a history list (history reads from `agent_messages`). Submit calls Laravel `POST /agent/ask`, which in this phase is stubbed to return `{ response: 'agent not wired yet', recommendations: [] }` — wired up to `SentinelAgent` in Phase 4. Use sonner `toast.success` / `toast.error` for feedback.

P3.27 Update `routes/web.php` with named routes for all the above. Run `npm run build` to regenerate Wayfinder helpers.

P3.28 Add a sidebar component `resources/js/components/app-sidebar.tsx` linking the six pages. Icons from `lucide-react` (`LayoutDashboard`, `Cpu`, `Activity`, `ShieldAlert`, `AlertTriangle`, `Bot`). Add it to the existing layout.

P3.29 Pest feature tests under `tests/Feature/` for each controller. Smoke browser test in `tests/Browser/DashboardSmokeTest.php` using Pest 4 browser API.

### 3d — REST API (Telegram bot surface)

**Scope note**: Phase 4 hosts the AI agent in-process via `laravel/ai`. The only external consumer of this API is the Telegram bot (Phase 5). Therefore Phase 3d ships a focused **read-only + agent** surface, not the full PRD §14.1 catalogue. PRD §14.1 stays as reference; if a future external integration needs more endpoints, they get added then.

**Endpoints (7 total)**:

```
GET  /api/health                      # public, no auth
GET  /api/dashboard/summary           # for `/status`
GET  /api/devices                     # for `/devices`
GET  /api/incidents                   # for `/incidents`, supports ?status=open
GET  /api/security-events             # for `/security`, supports ?since=today
POST /api/agent/ask                   # for free-text Telegram messages
POST /api/agent/audit                 # for `/audit`
POST /api/agent/analyze-incident/{id} # for `/report` command (Phase 7 wires the UI)
```

P3.30 Add `routes/api.php`. Public: `/api/health`. Sanctum-protected: everything else. No CRUD on devices/telemetry. No incident store/update over API — those stay browser-only.

P3.31 Create API controllers under `app/Http/Controllers/Api/` for the 4 read endpoints + `AgentController`. Each returns a JSON resource, not the raw model.

P3.32 Create resources: `DeviceResource`, `SecurityEventResource`, `IncidentResource`, `AgentMessageResource`. Skip `TelemetryLogResource` and `IncidentReportResource` for now — no consumer needs them. Add later if Phase 7 demos require them.

P3.33 Create form requests: `AskAgentRequest` (validates `prompt` required string max 2000). Reuse the web `Store/UpdateIncidentRequest` from 3c if needed.

P3.34 Add `php artisan sentinel:issue-tokens` console command that creates one Sanctum token (`bot`) and prints it. Output is a single line `BOT_API_TOKEN=...` ready to paste into the Telegram bot's `.env`. The Phase 2 ingestor stays Postgres-direct; only the Telegram bot needs an API token.

P3.35 The agent endpoints (`POST /api/agent/*`) are **stubs** in this phase — they return `{ response: 'agent not wired — Phase 4', conversation_id: null }` with HTTP 200. Phase 4 wires `(new SentinelAgent)->prompt(...)` into them. Persistence to `agent_messages` (with `source='telegram'`) also lands in Phase 4.

P3.36 Pest feature tests under `tests/Feature/Api/` for each endpoint:
- 200 with valid token
- 401 with no token
- 422 with invalid payload (`AskAgentRequest`)
- 404 for `analyze-incident/{id}` with unknown id

P3.37 Run `vendor/bin/pint --dirty --format agent` after PHP changes.

### Success criteria

- `php artisan test --compact` is green for everything under `tests/Feature` and `tests/Unit`.
- `npm run build` succeeds, ESLint and TS pass.
- shadcn primitives resolve from `@/components/ui/*` with no missing imports.
- Browsing to `http://localhost:8000/dashboard` after seeding shows real numbers in shadcn `Card`s, a Recharts line chart, and a sonner toast on any agent submit.
- `curl -H "Authorization: Bearer <bot_token>" http://localhost:8000/api/dashboard/summary` returns the JSON shape from PRD §14.1.
- `curl -X POST -H "Authorization: Bearer <bot_token>" -H "Content-Type: application/json" -d '{"prompt":"hi"}' http://localhost:8000/api/agent/ask` returns the Phase 3d stub response.
- `curl http://localhost:8000/api/health` returns 200 without a token.

### Success criteria

- `php artisan test --compact` is green for everything under `tests/Feature` and `tests/Unit`.
- `npm run build` succeeds, ESLint and TS pass.
- shadcn primitives resolve from `@/components/ui/*` with no missing imports.
- Browsing to `http://localhost:8000/dashboard` after seeding shows real numbers in shadcn `Card`s, a Recharts line chart, and a sonner toast on any agent submit.
- `curl -H "Authorization: Bearer <agent_token>" http://localhost:8000/api/dashboard/summary` returns the JSON shape from PRD §14.1.

---

## Phase 4 — AI Agent (Laravel AI SDK, in-process)

Goal (slice S7): the dashboard agent console and the Telegram bot both reach a working `SentinelAgent` powered by `laravel/ai`. No FastAPI service, no separate container, no HTTP hop. Conversation memory is automatic; `agent_messages` keeps a one-row-per-interaction audit feed.

Reference: PRD §12.5, §22, §28.7, §18 Phase 4. Design D3, S7. Laravel AI SDK docs: https://laravel.com/docs/13.x/ai-sdk.

### 4a — SDK install and configuration

All commands run inside the `laravel-app` container.

P4.1 Install the SDK and publish its config + migrations:
```bash
docker compose exec -T laravel-app composer require laravel/ai
docker compose exec -T laravel-app php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
docker compose exec -T laravel-app php artisan migrate --no-interaction
```
Verify: `config/ai.php` exists; new migrations `*_create_agent_conversations_table.php` and `*_create_agent_conversation_messages_table.php` are present and ran. `agent_messages` from Phase 3a stays as the audit feed and is **not** dropped or renamed.

P4.2 `.env` and `.env.example` updates: add `OPENAI_API_KEY=`, `ANTHROPIC_API_KEY=`, `GEMINI_API_KEY=`. Set the demo provider's key in local `.env`. Default provider in `config/ai.php` left as the SDK default (typically OpenAI); flip via `default` key if needed.

P4.3 Add a `Sentinel` middleware-equivalent at the agent layer for prompt/response logging — implement `Laravel\Ai\Contracts\HasMiddleware` on `SentinelAgent` with one middleware `App\Ai\Middleware\LogAgentInteractions` that writes the audit row into `agent_messages` after the response (per Design §7.6).

### 4b — Tool surface

Each tool is a PHP class implementing `Laravel\Ai\Contracts\Tool` with `description()`, `handle(Tools\Request $request)`, `schema(JsonSchema $schema)`. Generate scaffolding with `php artisan make:tool {Name}` then fill in the body. Tools query Eloquent directly — no HTTP, no separate connection.

P4.4 `app/Ai/Tools/GetDeviceStatus.php` — returns count by `status` plus a list of devices with `last_seen_at` older than 5 minutes. No args.

P4.5 `app/Ai/Tools/GetRecentTelemetry.php` — args `{ device_id: string, limit: int default 20 }`. Returns last N telemetry rows for the device.

P4.6 `app/Ai/Tools/GetSecurityEvents.php` — args `{ severity?: string, since?: ISO datetime, limit: int default 20 }`. Returns events ordered by `detected_at desc`.

P4.7 `app/Ai/Tools/GetOpenIncidents.php` — returns incidents where `status in (open, investigating)`, ordered by severity then `created_at`.

P4.8 `app/Ai/Tools/AnalyzeAnomaly.php` — args `{ device_id: string }`. Returns mean / stddev / latest 5 telemetry rows for that device, with a flag if latest reading is >3 stddev from rolling mean.

P4.9 `app/Ai/Tools/AuditMqttBroker.php` — returns a structured audit dict comparing rows in `device_policies` against the last 24 h of `security_events` per `source_client_id`.

P4.10 `app/Ai/Tools/RecommendMitigation.php` — args `{ event_id: int }`. Returns the event row plus a small set of canned mitigation hints based on `event_type` (used by the LLM as grounding, not the final recommendation).

P4.11 `app/Ai/Tools/GenerateIncidentReport.php` — args `{ incident_id: int }`. **Read-only.** Loads the incident, related events, related telemetry, returns a structured dict for the LLM to synthesize. Persistence happens in the controller after the agent returns.

P4.12 Pest unit tests `tests/Unit/Ai/Tools/*Test.php` — one test per tool, calling `handle()` with seeded data. No LLM call.

### 4c — Agent classes

P4.13 `app/Ai/Agents/SentinelAgent.php` — implements `Agent`, `Conversational`, `HasTools`. Uses `Promptable` and `RemembersConversations`. Tool list: GetDeviceStatus, GetRecentTelemetry, GetSecurityEvents, GetOpenIncidents, AnalyzeAnomaly, AuditMqttBroker. `instructions()` returns `file_get_contents(resource_path('ai/prompts/sentinel-system.md'))`. Annotated with `#[MaxSteps(6)]` and `#[Provider(Lab::OpenAI)]`.

P4.14 `app/Ai/Agents/IncidentAnalyst.php` — implements `Agent`, `HasStructuredOutput`. Schema returns `{ severity: enum, summary: string, root_cause: string, impact: string, recommendation: string, recommendations: array<string>, report_markdown: string }`. Tool list: GetRecentTelemetry, GetSecurityEvents, GenerateIncidentReport.

P4.15 `app/Ai/Agents/AuditAgent.php` — implements `Agent`, `HasTools`. Tool list: AuditMqttBroker, GetSecurityEvents.

P4.16 Prompts:
- `resources/ai/prompts/sentinel-system.md` — PRD §22.1 verbatim.
- `resources/ai/prompts/incident-analyst.md` — derived from PRD §22.2 (incident report format).
- `resources/ai/prompts/audit.md` — short framing for MQTT audit narration.

### 4d — Controllers and wiring

P4.17 Replace the Phase 3 stub in `app/Http/Controllers/AgentController.php`. `ask(AskAgentRequest $request)` now does:
```php
$response = (new SentinelAgent)
    ->forUser($request->user())
    ->prompt($request->validated('prompt'));

// LogAgentInteractions middleware (P4.3) already wrote the audit row.
return back()->with('agent_response', [
    'response' => (string) $response,
    'conversation_id' => $response->conversationId,
]);
```

P4.18 Add `app/Http/Controllers/IncidentController@generateReport`:
- Calls `(new IncidentAnalyst)->prompt("Analyze incident #{id}", attachments: [...])`.
- Persists `report_markdown` to `incident_reports`, `recommendations` into `incidents.recommendation`.
- Returns the updated incident page.

P4.19 Add `app/Http/Controllers/Api/AgentController@ask` mirroring web, but accepting Sanctum-authenticated requests (Telegram bot path). Persists `agent_messages` row with `source='telegram'`.

P4.20 Update `routes/web.php` and `routes/api.php` so Wayfinder regenerates `@/actions/AgentController.ts`. Run `npm run build`.

P4.21 Update `resources/js/pages/agent/index.tsx` to render the response via the existing `<MarkdownView>` component (from Phase 3b) and surface tool-call summaries in a small collapsible. Use sonner toasts for success/error. Existing structure stays; only the response renderer changes.

### 4e — Tests and verification

P4.22 `tests/Feature/AgentControllerTest.php` — uses `Laravel\Ai\Testing` fakes (per the SDK docs) to fake the LLM provider with a canned response. Asserts:
- 200 response.
- One row added to `agent_messages` with `source='web'`, populated `prompt` and `response`.
- One row added to `agent_conversations` (SDK table).

P4.23 `tests/Feature/Api/AgentApiTest.php` — same flow over Sanctum, asserts `source='telegram'` audit row.

P4.24 Run the full Pest suite: `docker compose exec -T laravel-app php artisan test --compact`.

P4.25 Smoke-check with a real key (skip if `OPENAI_API_KEY` is empty):
- Visit `http://localhost:8000/agent`.
- Prompt: "Cek status seluruh device dan ringkas event keamanan hari ini."
- Expect a non-empty markdown response that mentions device counts and at least one recommendation. Tool calls visible in collapsible.

P4.26 `vendor/bin/pint --dirty --format agent` after PHP changes.

### Success criteria

- `composer require laravel/ai` succeeds; SDK migrations applied.
- All 8 tools have unit tests passing.
- `tests/Feature/AgentControllerTest.php` and `Api/AgentApiTest.php` pass with the SDK fake (no real LLM call).
- Dashboard agent console returns real LLM responses when a provider key is set, and the response renders via shadcn + react-markdown.
- Each prompt creates one row in `agent_messages` (audit) and updates `agent_conversations` (memory).
- No `services/ai-agent/` folder is created. No FastAPI process exists in `docker-compose.yml`.

---

## Phase 5 — Telegram bot

Goal (slice S8): Bot handles `/start`, `/status`, `/devices`, `/incidents`, `/audit`, `/help`, restricted to the admin chat ID.

Reference: PRD §12.6, §18 Phase 5. Design D4.

### Tasks

P5.1 Create `services/telegram-bot/bot.py` using `python-telegram-bot` v21+. Long polling (no webhooks for MVP).

P5.2 Allowlist middleware: every handler checks `update.effective_chat.id == TELEGRAM_ADMIN_CHAT_ID`; reject otherwise.

P5.3 Handlers:
- `/start` — welcome message.
- `/status` — `GET /api/dashboard/summary`, format the response.
- `/devices` — `GET /api/devices`, list device IDs and statuses.
- `/incidents` — `GET /api/incidents?status=open`, list ids + titles + severities.
- `/audit` — `POST /api/agent/audit`, return the agent's text.
- `/help` — list commands.
- Free text — forward to `/api/agent/ask`.

P5.4 `services/telegram-bot/Dockerfile`, `requirements.txt` (`python-telegram-bot`, `httpx`, `python-dotenv`).

P5.5 Wire into `docker-compose.yml`. Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `LARAVEL_API_URL`, `LARAVEL_API_TOKEN`, `AI_AGENT_URL`, `AI_AGENT_TOKEN`.

P5.6 Add a logger that persists every command to `agent_messages` with `source='telegram'` via `POST /api/agent/messages` (add this Laravel endpoint as P5.7).

P5.7 Add `AgentController@logMessage` and route. Pest test for it.

P5.8 Manual verification: send `/status` from an allowed chat → reply within 5 s. Send from a non-allowed chat → no reply, log line shows the rejected chat id.

### Success criteria

- A non-admin chat receives no response and the bot logs a `rejected_chat` line.
- `/status`, `/devices`, `/incidents`, `/audit` produce non-empty replies in <5 s.
- Every command creates a row in `agent_messages` with `source='telegram'`.

---

## Phase 6 — Attack simulator

Goal (slice S9): Four scripts that reliably trigger the security events the demo needs.

Reference: PRD §12.7, §18 Phase 6.

### Tasks

P6.1 `services/attack-simulator/unauthorized_publish.py` — connects with a `attacker-client` user (not in passwordfile) and tries to publish to `iot/building-a/lab-a/temp-sensor-001/telemetry`. Expected: rejected by ACL → broker log entry.

P6.2 `services/attack-simulator/malformed_payload.py` — connects as `sentinel_device`, publishes `{"foo": "bar"}` to a valid telemetry topic. Expected: `security_events.event_type='malformed_payload'`.

P6.3 `services/attack-simulator/spoof_device.py` — publishes a payload with `device_id="other-device"` to `iot/.../temp-sensor-001/telemetry`. Expected: `security_events.event_type='device_spoofing'`.

P6.4 `services/attack-simulator/publish_flood.py` — publishes 200 messages in 5 seconds. Expected: a rate-limit detector in the ingestor (added in P6.5) creates one `flood` event.

P6.5 Update `services/mqtt-ingestor/app.py` with a per-`source_client_id` rate window: if >50 messages in 10 s → one `security_events` row with `event_type='publish_flood'`, `severity='high'`. Cap to one event per minute per client.

P6.6 Update `services/mqtt-ingestor/tests/` with a unit test for the rate-limiter logic (no broker required).

P6.7 `services/attack-simulator/README.md` documenting how each script maps to a PRD demo scenario.

P6.8 Replace the P2.8 stub script with `services/attack-simulator/malformed_payload.py`.

### Success criteria

- Each attack script produces the expected security event row within 10 s of execution.
- The ingestor's rate-limiter unit test passes.
- Running all four scripts in sequence produces 4 distinct `event_type` values in `security_events`.

---

## Phase 7 — Incident report generator + demo polish

Goal (slice S10): End-to-end incident workflow + demo-ready docs and seed data.

Reference: PRD §22.2, §23, §29, §18 Phase 7.

### Tasks

P7.1 Add `IncidentController@generateReport` that calls `POST /api/agent/analyze-incident/{id}` and stores the markdown in `incident_reports`.

P7.2 Update `resources/js/pages/incidents/show.tsx` to render the latest report's markdown via the `<MarkdownView>` component (already created in P3.17) and add a "Generate report" `<Button>` when none exists. Surface success/failure with sonner toasts.

P7.3 Add a "Create incident from event" action on the security events page that pre-fills the new incident form with the event's metadata.

P7.4 Create `database/seeders/DemoSeeder.php` (separate from `DatabaseSeeder`) that produces a clean demo dataset on demand: `php artisan db:seed --class=DemoSeeder`.

P7.5 Extract from PRD into `docs/`:
- `docs/ARCHITECTURE.md` — sections §8, §9, §29 with the Mermaid diagrams.
- `docs/API.md` — section §14 plus the Sanctum auth section from the design.
- `docs/DATABASE.md` — section §13.
- `docs/DEMO_SCENARIO.md` — section §23 with step-by-step commands.

P7.6 Rewrite `README.md` with: prerequisites, `docker compose up -d`, `php artisan migrate --seed`, `php artisan sentinel:issue-tokens`, simulator usage, demo run script.

P7.7 Add `php artisan sentinel:health` console command verifying broker, DB, agent, and bot reachability. Used in the demo opening.

P7.8 Run the full demo from PRD §23 four scenarios end-to-end and capture screenshots into `docs/screenshots/` (folder created, file paths referenced from README).

P7.9 Final formatting pass: `vendor/bin/pint --dirty --format agent`, `npm run lint`, `npm run format`.

### Success criteria

- Running the four demo scenarios from PRD §23 in order produces the expected outcomes without manual SQL.
- `php artisan sentinel:health` prints all-green.
- `README.md` contains a single command sequence that, run on a fresh clone, brings the app to demo-ready state.
- `php artisan test --compact` and `pytest services/*/tests/` are both green.

---

## Cross-cutting checklist (run before declaring MVP done)

Maps to PRD §24 Acceptance Criteria.

- [ ] Virtual IoT device publishes from laptop. (P1.5)
- [ ] Mosquitto receives data. (P0.9, P1.5)
- [ ] Ingestor subscribes and persists. (P2.8)
- [ ] Laravel dashboard shows devices and telemetry. (P3.14, P3.15)
- [ ] Security event created from invalid payload. (P2.8, P6.2)
- [ ] Incident lifecycle works. (P3.18, P7.1)
- [ ] AI Agent answers status queries. (P4 success criteria)
- [ ] AI Agent gives security recommendations. (`SentinelAgent` + `RecommendMitigation` tool)
- [ ] Telegram `/status` works. (P5 success criteria)
- [ ] Unauthorized publish or malformed payload demo runs. (P6.1, P6.2)
- [ ] Architecture and workflow docs are present. (P7.5)

---

## Resolution log for design open questions

The design listed three open questions. They get resolved during the plan as follows:
- **LLM provider** — resolved at start of Phase 4 (P4.2). Default to whichever provider key is set in `.env` (SDK reads `config/ai.php`). Swap by setting a different env var — no code change.
- **Postgres vs MySQL** — resolved in P0.6 by switching `.env.example` to `pgsql`.
- **Redis for Telegram** — not introduced. The MVP bot is stateless polling. Revisit post-MVP only if we move to webhooks.

---

## Risk → mitigation in the plan

| PRD/Design risk | Where the plan addresses it |
|---|---|
| Scope creep | Phases are sized so each ends in a demoable state; no phase introduces a fifth service |
| AI agent hard | Mock LLM lands in P4.2 first, real LLM adapter is a swap |
| MQTT auth/ACL | Phase 0 forces auth-on; Phase 6 verifies with the unauthorized script |
| Telegram optional | If Phase 5 slips, the demo still works via the dashboard agent console |
| InfluxDB complexity | Excluded; D1 in design |
| LLM cost | SDK testing fakes keep Pest free; demo runs against whichever provider key is in `.env` |
| Wayfinder regen breaks frontend | P3.20 schedules a build after route work; CI step optional |

---

## How to use this plan

1. Pick the lowest-numbered phase with all success criteria still red.
2. Pick the lowest-numbered task in that phase whose dependencies are green.
3. Implement, verify against the task's check, then move on.
4. After every Laravel task: `vendor/bin/pint --dirty --format agent` then `php artisan test --compact`.
5. After every Python task: `pytest <service>/tests/`.
6. At end of phase: run the success criteria block; only then mark the phase done.
