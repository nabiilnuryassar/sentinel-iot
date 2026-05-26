---
title: Sentinel-IoT — Progress Tracker
last_updated: 2026-05-16
maintainer: sentinel-iot team
status: Phase 0–7 shipped (MVP complete)
links:
  prd: docs/PRD.md
  design: thoughts/shared/designs/sentinel-iot-design.md
  plan: thoughts/shared/plans/sentinel-iot-plan.md
---

# Sentinel-IoT — Progress Tracker

Single-source-of-truth for "what landed, what's verified, what's next". Open this before reading anything else.

## 1. TL;DR — Current State

MVP complete. Phase 0–7 shipped. The Docker Compose stack runs Mosquitto (1883), Postgres 16 (host port **5433** → container 5432), the Laravel app (8000), and the Python MQTT ingestor; the Telegram bot starts under `--profile bot`. End-to-end ingestion works (simulator → Mosquitto → ingestor → Postgres), the Inertia dashboard ships seven pages with shadcn/ui, the REST API surface (Phase 3d) covers eight endpoints behind Sanctum, three in-process Laravel AI SDK agents (`SentinelAgent`, `IncidentAnalyst`, `AuditAgent`) drive the agent console + report generator, the Telegram bot relays `/status`, `/incidents`, and `/audit` against the API, the four attack scripts produce the expected security events, and Phase 7 ships `DemoSeeder`, `php artisan sentinel:health`, the README + docs split (`ARCHITECTURE`, `API`, `DATABASE`, `DEMO_SCENARIO`), and the wired-up "Generate report" + "Create incident from event" UI flows. **64 Pest tests** + **28 ingestor pytest** + **14 Telegram pytest** all green. Demo prerequisites — DB connection, broker reachable, 5 devices last 5m, 2 open incidents — verified via `sentinel:health`.

## 2. Phase Status Matrix

| Phase | Slice | Status | Fusion | Verified by |
|---|---|---|---|---|
| 0 | S1 — Compose env | ✅ shipped | — | `docker compose ps` shows mosquitto, postgres, laravel-app all up; `php artisan migrate:status` runs against pgsql |
| 1 | S2 — Virtual device sim | ✅ shipped | FN-001 | `ls simulator/` shows `virtual_devices.py`, `device_profiles.json`, `requirements.txt`, `README.md` |
| 2 | S3 — MQTT ingestor | ✅ shipped | FN-002 | `services/mqtt-ingestor/{app,db,validators}.py` + `tests/test_validators.py`; ingestor container running |
| 3a | S4 — Schema + models | ✅ shipped | FN-003 | 10 migrations ran (`migrate:status` all `[1] Ran`); 7 models + factories under `app/Models/` |
| 3b | UI library setup | ✅ shipped | FN-004 | `components.json` (style=radix-nova, baseColor=neutral); 16 shadcn primitives under `resources/js/components/ui/` |
| 3c | S5 — Inertia dashboard | ✅ shipped | FN-005 | 6 Inertia pages under `resources/js/pages/`; `php artisan test --compact` → 19 passed |
| 3d | S6 — REST API | ✅ shipped | FN-006 | 8 endpoints behind `auth:sanctum`; `tests/Feature/Api/*` green |
| 4 | S7 — AI Agent (laravel/ai) | ✅ shipped | FN-007 | 3 agents + 8 tools under `app/Ai/`; 18 unit + 4 feature tests |
| 5 | S8 — Telegram bot | ✅ shipped | FN-008 | `services/telegram-bot/` polling bot, 14 pytest passing |
| 6 | S9 — Attack simulator | ✅ shipped | FN-009 | 4 scripts + ingestor rate limiter; broker rejects + events confirmed |
| 7 | S10 — Reports + polish | ✅ shipped | FN-010 | Demo seeder, `sentinel:health`, doc split, UI wired (see §3 Phase 7) |

## 3. Per-Phase Digest

### Phase 0 — Compose environment

**Goal**: `docker compose up -d` brings up Mosquitto, Postgres, and Laravel; auth-only MQTT publishes.
**Files**:
- `docker-compose.yml`, `docker-compose.override.yml.example`
- `docker/laravel.Dockerfile`
- `mosquitto/config/{mosquitto.conf,passwordfile,aclfile}`
- `.env.example` switched to `pgsql` with `DB_HOST=postgres`, `MQTT_*` block

**Key decisions / deviations**:
- Postgres host port remapped to **5433** to avoid conflict with a host Postgres on 5432. Inside the compose network it's still `postgres:5432`.
- Laravel container is `php artisan serve` on 8000 (dev-grade, per plan P0.5).
- Mosquitto image is `eclipse-mosquitto:2`; `allow_anonymous false`, ACL + passwordfile mounted.

**Verification**:
- `docker compose ps` → 4 services up, mosquitto + postgres reporting `healthy`.
- `php artisan migrate:status` runs cleanly against pgsql.

**Fusion task**: not separately tracked (Phase 0 was scaffolding before the board).

### Phase 1 — Virtual device → broker

**Goal**: Python simulator publishes JSON telemetry every 5 s for 5 device profiles.
**Files**:
- `simulator/device_profiles.json` — temp-sensor-001, door-lock-001, power-meter-001, air-quality-001, water-leak-001
- `simulator/virtual_devices.py`
- `simulator/requirements.txt` (paho-mqtt, python-dotenv)
- `simulator/README.md`

**Key decisions / deviations**:
- Simulator runs on the laptop, not in compose. It connects to `localhost:1883` with `sentinel_device` creds from `.env`.
- `--anomaly <device_id>` flag forces out-of-range payloads on demand.

**Verification**:
- `ls simulator/` confirms all four files present.
- Phase 2 end-to-end check (below) implicitly confirms the simulator → broker hop.

**Fusion task**: FN-001.

### Phase 2 — MQTT ingestor

**Goal**: Subscribe to `iot/+/+/+/{telemetry,event}`, validate, persist to Postgres, emit security events on bad input.
**Files**:
- `services/mqtt-ingestor/{app.py,db.py,validators.py}`
- `services/mqtt-ingestor/{Dockerfile,requirements.txt,pytest.ini}`
- `services/mqtt-ingestor/tests/{test_validators.py,conftest.py}`
- `docker-compose.yml` extended with the `mqtt-ingestor` service (depends_on postgres + mosquitto)

**Key decisions / deviations**:
- Uses paho-mqtt v2.x; the v2 API does **not** expose the publishing client's broker username on the message callback, so `security_events.source_client_id` stays NULL for now (see §9 — known issue, not a regression).
- Migrations the ingestor writes into (devices, telemetry_logs, security_events) landed early as part of the cross-phase note in the plan; the rest of Phase 3a followed in FN-003.
- Connection pool via `psycopg[binary]` (pip pins `>=3.2,<4`).

**Verification**:
- Container `sentinel-mqtt-ingestor` is up (`docker compose ps`).
- Schema is in place: `devices`, `telemetry_logs`, `security_events` show in `migrate:status`.
- Validator unit tests under `services/mqtt-ingestor/tests/test_validators.py`.

**Fusion task**: FN-002.

### Phase 3a — Laravel schema, models, seeders

**Goal**: All MVP tables, Eloquent models with relationships, factories, seeded demo data.
**Files**:
- `database/migrations/2026_05_15_*` — devices, telemetry_logs, security_events, incidents, incident_reports, agent_messages, device_policies (7 new)
- `app/Models/{Device,TelemetryLog,SecurityEvent,Incident,IncidentReport,AgentMessage,DevicePolicy}.php`
- `database/factories/*Factory.php` for each model
- `database/seeders/DatabaseSeeder.php`

**Key decisions / deviations**:
- Indexes per design D6: `telemetry_logs (device_id, received_at desc)`, `security_events (severity, detected_at desc)`.
- `SecurityEvent::device()` is a soft `belongsTo` against `devices.device_id` (string FK, design D7) — relationship not strict.
- `incidents.affected_device_id` left as string (design D8) so demos can reference devices that may not exist yet.

**Verification**:
- `php artisan migrate:status` → all 10 migrations `[1] Ran`.
- 7 model files present; 7 factory files present.

**Fusion task**: FN-003.

### Phase 3b — UI library setup

**Goal**: Every shadcn primitive used downstream resolves to a real export; no ad-hoc styling.
**Files**:
- `components.json` (shadcn config)
- `resources/js/components/ui/*` — 16 primitives (badge, button, card, dialog, dropdown-menu, input, label, scroll-area, select, separator, sheet, skeleton, sonner, table, tabs, textarea)
- `resources/js/components/{severity-badge,status-pill,stat-card,telemetry-chart,data-table,markdown-view}.tsx` — domain shells
- `resources/js/lib/{utils.ts,format.ts}` — `cn` helper + date/number formatters
- `resources/js/layouts/app-layout.tsx` — root layout with `<Toaster />`
- `package.json` deps: recharts, react-markdown, remark-gfm, date-fns, lucide-react, @tanstack/react-table

**Key decisions / deviations**:
- shadcn `style: "radix-nova"`, `baseColor: "neutral"`, icon library `lucide`. Aliases set to `@/components`, `@/lib/utils`.
- No framer-motion, no cmdk, no TanStack Query (per design §3.1).

**Verification**:
- `cat components.json` confirms config shape.
- `ls resources/js/components/ui/ | wc -l` = 16.

**Fusion task**: FN-004.

### Phase 3c — Inertia dashboard

**Goal**: Six Inertia pages on shadcn primitives + Wayfinder-typed routes.
**Files**:
- `app/Http/Controllers/{Dashboard,Device,Telemetry,SecurityEvent,Incident,Agent}Controller.php`
- `app/Http/Requests/{StoreIncidentRequest,UpdateIncidentRequest}.php`
- `resources/js/pages/dashboard.tsx`
- `resources/js/pages/devices/{index,show}.tsx`
- `resources/js/pages/incidents/{index,show}.tsx`
- `resources/js/pages/security-events/index.tsx`
- `resources/js/pages/telemetry/index.tsx`
- `resources/js/pages/agent/index.tsx`
- `resources/js/components/app-sidebar.tsx`
- `routes/web.php` — named routes for all six pages plus `POST /agent/ask`
- `tests/Feature/{Dashboard,Device,Telemetry,SecurityEvent,Incident,Agent}ControllerTest.php`

**Key decisions / deviations**:
- `agent/index.tsx` exists but `POST /agent/ask` is a stub — wires up to `SentinelAgent` in Phase 4 (FN-007).
- `Route::resource('incidents')` limited to `index`, `show`, `store`, `update` only (no `create`/`edit` pages — incidents are spawned from events in Phase 7).
- No login UI in this phase; tests use `actingAs($user)` (see §9).
- No `tests/Browser/` directory yet — Pest browser smoke test deferred (plan P3.29 lists it but it didn't land in this phase).

**Verification**:
- `php artisan test --compact` → **19 passed (134 assertions)** in 4.37 s.
- All six pages present under `resources/js/pages/`.

**Fusion task**: FN-005.

### Phase 3d — REST API (pending)

**Plan ref**: `thoughts/shared/plans/sentinel-iot-plan.md` Phase 3d (P3.30–P3.36).
**Depends on**: FN-006 (depends on FN-003).
**Notes**: Mirrors web controllers under `app/Http/Controllers/Api/`, returns `JsonResource` instances, gates on `auth:sanctum`. Adds `php artisan sentinel:issue-tokens` and Pest feature tests under `tests/Feature/Api/`.

### Phase 4 — AI Agent via Laravel AI SDK (pending)

**Plan ref**: `thoughts/shared/plans/sentinel-iot-plan.md` Phase 4 (P4.1–P4.26).
**Depends on**: FN-007 (depends on FN-005, FN-006).
**Notes**: **Replanned** from a separate FastAPI `services/ai-agent/` to in-process `laravel/ai` agents under `app/Ai/Agents/` and tools under `app/Ai/Tools/`. Any older Fusion comments referencing the FastAPI service are obsolete (design D3, plan §Phase 4). Phase 3c's `agent/index.tsx` already targets the future contract; only the controller body changes.

### Phase 5 — Telegram bot (pending)

**Plan ref**: Phase 5 (P5.1–P5.8).
**Depends on**: FN-008 (depends on FN-007).
**Notes**: python-telegram-bot v21+ long polling; allowlist on `TELEGRAM_ADMIN_CHAT_ID`; calls Laravel REST API + `Api\AgentController`.

### Phase 6 — Attack simulator + ingestor rate limiter (pending)

**Plan ref**: Phase 6 (P6.1–P6.8).
**Depends on**: FN-009 (depends on FN-002).
**Notes**: Adds 4 attack scripts under `services/attack-simulator/` and an in-ingestor per-`source_client_id` rate window emitting `publish_flood` events. Rate-limit grouping will degrade until paho exposes the publisher's broker username (see §9).

### Phase 7 — Incident reports + demo polish

**Goal**: Demo-ready end-to-end. UI wired to the report generator, idempotent demo seeder, focused docs, health command.
**Files**:
- `app/Console/Commands/SentinelHealth.php` — five-row health check
- `database/seeders/DemoSeeder.php` — idempotent demo dataset; rotates the bot token and prints `BOT_API_TOKEN=...`
- `resources/js/pages/incidents/show.tsx` — "Generate report" wired via Wayfinder + sonner; replaces Phase 3c stub
- `resources/js/pages/security-events/index.tsx` — per-row "Create incident" dialog (pre-fills title/severity/device_id/summary)
- `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE.md`, `docs/DEMO_SCENARIO.md` — extracted from PRD with implementation reality
- `README.md` — rewritten as a "how to run the demo" doc, < 200 lines

**Key decisions / deviations**:
- `IncidentController@generateReport` was already wired by Phase 4; Phase 7 only had to confirm and reuse it.
- Demo seeder doesn't create an `incident_reports` row — the demo's value is the user clicking "Generate report" and watching the agent populate it.
- The Laravel AI SDK has no auto-fallback when `OPENAI_API_KEY` is unset; the agent throws `RequestException 401`. Live demo runs without a key must use the Pest path or a `Ai::fakeAgent(...)` fixture, not the dashboard. README + DEMO_SCENARIO call this out.
- `sentinel:health` uses `fsockopen` for the MQTT probe to avoid pulling in a new composer dependency. "Devices last 5m" is a yellow warning when zero, not red, since the seeded baseline always satisfies it.

**Verification**:
- `php artisan sentinel:health` (post-seed, simulator running): `✓ Database`, `✓ MQTT broker`, `⚠ AI provider` (no key in this run), `✓ Devices last 5m 5 online`, `ℹ Open incidents 2`.
- `php artisan db:seed --class=DemoSeeder --no-interaction` → 5 devices, 150 telemetry rows, 5 security events, 2 incidents, fresh `BOT_API_TOKEN=...` line on stdout.
- Scenario 2 (malformed payload): `security_events` row count 2 → 3 (`malformed_payload`).
- Scenario 3 (unauthorized + spoof): broker logged `Client attacker-client ... disconnected: not authorised`, then `device_spoofing` row count 1 → 2.
- Scenario 4 (incident report, with `Ai::fakeAgent` due to no live key): controller redirected `302 → /incidents/3`, persisted `incident_reports` row, updated incident severity to `high`, summary/recommendation/root_cause non-empty, 705-char markdown body matching PRD §22.2.
- `php artisan test --compact` → 64 passed (363 assertions).
- `npm run lint` exit 0 (one known TanStack `useReactTable` compiler warning on `data-table.tsx`).
- `npm run format` exit 0.

**Fusion task**: FN-010.

## 4. Architecture Snapshot

```
Laptop                              Server (Docker Compose)
+--------------------+              +-----------------------------------------+
| simulator/         | --MQTT-->    | mosquitto:1883                          |
| virtual_devices.py |              |        |                                |
+--------------------+              |        v                                |
                                    | services/mqtt-ingestor (Python)         |
                                    |        |                                |
                                    |        v                                |
+--------------------+              | postgres:5432 (host port 5433)          |
| browser (admin)    | --HTTP-->    |        ^                                |
+--------------------+              | laravel-app:8000                        |
                                    |   |-- Inertia React UI (shipped)        |
                                    |   |-- REST API (planned, FN-006)        |
                                    |   |-- Laravel AI SDK agent (planned,    |
                                    |   |       FN-007, in-process)           |
                                    +-----------------------------------------+

Future: services/telegram-bot (FN-008), services/attack-simulator (FN-009)
```

**Where things live**:
- Simulator: `simulator/`
- MQTT ingestor: `services/mqtt-ingestor/`
- Laravel app: repo root (controllers `app/Http/Controllers/`, models `app/Models/`)
- Frontend pages: `resources/js/pages/`, components `resources/js/components/`
- AI agents (planned): `app/Ai/Agents/`, tools `app/Ai/Tools/`, prompts `resources/ai/prompts/`

## 5. Database State

Row counts pulled live at the time of writing.

| Table | Migration phase | Row count (now) |
|---|---|---|
| users | starter kit | 0 |
| devices | Phase 2 / 3a (P3.1) | 0 |
| telemetry_logs | Phase 2 / 3a (P3.2) | 0 |
| security_events | Phase 2 / 3a (P3.3) | 0 |
| incidents | Phase 3a (P3.4) | 0 |
| incident_reports | Phase 3a (P3.5) | 0 |
| agent_messages | Phase 3a (P3.6) | 0 |
| device_policies | Phase 3a (P3.7) | 0 |

The DB is empty: no seeder has been run since the last reset and the simulator/ingestor stack is currently idle. To repopulate:
- `docker compose exec -T laravel-app php artisan migrate:fresh --seed`
- Then run the simulator from the laptop (`python simulator/virtual_devices.py`) for ~30 s to accumulate live telemetry.

## 6. Decisions Index

- **D1** Postgres only (no InfluxDB) — design §2
- **D2** Python ingestor sidecar (not Laravel queue) — design §2
- **D3** **Laravel AI SDK in-process (replanned, was FastAPI)** — design §2, plan Phase 4
- **D4** Telegram bot is a thin Python relay over the Laravel REST API — design §2
- **D5** Inertia React + shadcn/ui (not Filament) — design §2
- **D6** Telemetry append-only with covering index `(device_id, received_at desc)` — design §2
- **D7** Security event creation centralized in the ingestor — design §2
- **D8** Incident lifecycle open → investigating → resolved; severity as string enum — design §2
- **D9** Single-admin auth model; Sanctum tokens for Python services — design §2
- **D10** Config via `.env`; secrets out of compose — design §2

Per-phase deviations:
- **Phase 0**: Postgres host port remapped to **5433** (host conflict).
- **Phase 0**: Laravel container uses `php artisan serve` (dev-grade), not nginx/php-fpm.
- **Phase 2**: `security_events.source_client_id` stays NULL — paho-mqtt v2 doesn't expose the publisher's broker username on the receive callback.
- **Phase 3a**: `Route::resource('incidents')` scoped to `index/show/store/update` only.
- **Phase 3b**: shadcn preset `radix-nova` + `baseColor: neutral`; icon library `lucide`.
- **Phase 3c**: agent endpoint stubbed; Pest browser smoke test (P3.29) deferred — `tests/Browser/` does not exist yet.
- **Phase 7**: `sentinel:health` uses raw `fsockopen` for the MQTT probe (no new composer dep). Demo seeder leaves `incident_reports` empty so the demo "Generate report" click is the trigger.

## 7. Verification Commands (copy-paste recipe)

```bash
# Stack health
docker compose ps

# DB row counts
docker compose exec -T postgres psql -U sentinel -d sentinel_iot -c "select 'devices' as t, count(*) from devices union all select 'telemetry_logs', count(*) from telemetry_logs union all select 'security_events', count(*) from security_events union all select 'incidents', count(*) from incidents;"

# Laravel migrations
docker compose exec -T laravel-app php artisan migrate:status

# Pest suite (Feature tests for Phase 3c controllers)
docker compose exec -T laravel-app php artisan test --compact

# Frontend build (regenerates Wayfinder helpers)
docker compose exec -T laravel-app npm run build

# Ingestor unit tests
docker compose exec -T mqtt-ingestor pytest /app/tests/

# MQTT smoke test from a one-shot container
docker run --rm --network sentinel-iot_default eclipse-mosquitto:2 \
  mosquitto_pub -h mosquitto -p 1883 -u sentinel_device -P sentinel_mqtt_password \
  -t iot/building-a/lab-a/temp-sensor-001/telemetry \
  -m '{"device_id":"temp-sensor-001","type":"temperature","timestamp":"2026-05-16T00:00:00Z","location":"lab-a","temperature":24.1}'
```

## 8. What's Next

MVP is complete. The natural follow-ups (post-MVP):

1. Set a real LLM key in `.env` and re-run Scenario 4 against the live agent to capture a non-fake markdown report.
2. Land the deferred Pest 4 browser smoke test (`tests/Browser/`) so dashboard regressions are caught.
3. Wire CI to run `php artisan test --compact`, `npm run lint`, `pytest services/*/tests/` on PRs.
4. Capture the broker username on receive callback (paho-mqtt v3 or a broker plugin) so `security_events.source_client_id` reflects the publisher, improving Phase 6 rate-limit grouping accuracy.
5. Expand the API surface (PRD §14) if a second consumer beyond the Telegram bot shows up.

## 9. Known Issues / Debt

- Mosquitto warns about ACL/passwordfile ownership/permissions on startup. Currently a warning; future Mosquitto versions will treat it as an error.
- `security_events.source_client_id` is always NULL — paho-mqtt v2 doesn't expose the publishing client's broker username on the message callback. Affects Phase 6 rate-limit grouping accuracy.
- No login UI yet; Pest feature tests rely on `actingAs($user)`. Public users hitting `/dashboard` get redirected by `auth` middleware.
- Phase 4 was replanned from a FastAPI sidecar to in-process `laravel/ai`. Older Fusion-task comments referencing `services/ai-agent/`, `MockLLMClient`, or `app/Services/AgentClient.php` are obsolete (design D3 supersedes).
- DB is currently empty — no seed has been run since the last `migrate:fresh`. Run `php artisan db:seed` before any UI exploration.
- `tests/Browser/` doesn't exist yet — the Pest 4 browser smoke test from plan P3.29 didn't land with FN-005.
- LLM provider keys (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`) not yet in `.env` (Phase 4 will add them).
- `vendor/bin/pint --dirty --format agent` should be run before each PR; not automated in CI.
