# Sentinel-IoT Production Readiness Design

**Date:** 2026-06-29
**Author:** Hermes Agent (brainstorming session with Nabiil)
**Status:** Approved
**Target:** Single-client on-premise, VPS cloud, Docker Compose

---

## 1. Context

Sentinel-IoT is a Laravel + React Inertia IoT Security Operation Center with MQTT telemetry ingestion, AI agent incident reporting, and Telegram ChatOps. Current state: MVP with 73 passing tests, but Docker stack unstable, build/lint not clean, dev-grade deployment (`php artisan serve`), and no production hardening.

## 2. Goals

- Make Sentinel-IoT production-ready for single-client on-premise VPS deployment
- Deliver incrementally in 3 phases (minimal → standard → full hardening)
- Replace Python attack simulators with Wokwi ESP32 visual simulator
- Create two manuals: Deployment Manual (technical) + User Guide (non-technical)
- Automated E2E verification with Playwright as release gate

## 3. Phase Structure

### Phase 1 — Minimal Viable Production (2-3 days)

**Goal:** Stack runs stably on VPS, HTTPS, DB backup, Playwright smoke green.

| Workstream | Deliverable |
|---|---|
| Docker fix | Fix content store corruption, recreate containers, healthcheck endpoints |
| Build hygiene | `npm run build` + `lint` + `pint` + `php artisan test` all green |
| Git cleanup | Audit dirty tree, proper `.gitignore`, clean baseline commit |
| Production web | Replace `php artisan serve` → Caddy + PHP-FPM in Docker |
| HTTPS | Caddy auto-TLS (Let's Encrypt) |
| DB backup | `pg_dump` cron script + restore test |
| Secret hygiene | `.env.production.example`, no hardcoded creds in compose |
| Wokwi simulator | `wokwi/telemetry-sensor/` ESP32 project (normal device) |
| Playwright smoke | 7 tests: login, dashboard, telemetry, security event, API health, logout |
| Docs | Deployment Manual v1 (sections 1-5, 8) |

### Phase 2 — Standard Production (3-5 days)

**Goal:** CI/CD pipeline, monitoring, log rotation, secret management, Playwright expanded.

| Workstream | Deliverable |
|---|---|
| CI/CD | GitHub Actions: lint → test → build → e2e → push image → deploy hook |
| Monitoring | Healthcheck dashboard, Docker log rotation |
| Secret mgmt | Docker secrets or `.env` via SSH, no secrets in git |
| Queue worker | Separate container for Laravel queue + scheduler |
| Wokwi advanced | `wokwi/multi-sensor/` ESP32 + DHT22 + PIR + LDR |
| Playwright expanded | 6 tests: incidents lifecycle, AI agent, security events filter, device policy, DB backup/restore |
| Docs | Deployment Manual v2 (sections 6-7, 9, Appendix A-B) + User Guide v1 (sections 1-6) |

### Phase 3 — Full Hardening (1-2 weeks)

**Goal:** mTLS MQTT, audit logging, rate limiting, pentest checklist, Playwright full coverage.

| Workstream | Deliverable |
|---|---|
| MQTT mTLS | Generate CA + device certs, enforce `require_certificate true` |
| Audit logging | Admin actions log table + middleware |
| Rate limiting | Login throttle, API throttle, agent prompt throttle |
| Security scan | Trivy image scan, dependency audit |
| Pentest checklist | OWASP Top 10 self-assessment doc |
| Wokwi attacks | `wokwi/malformed-payload/`, `spoof-device/`, `flood-attack/` |
| Playwright full | 7 tests: attack simulators, tenant isolation, HTTPS enforcement, full regression |
| Docs | Deployment Manual v3 (Appendix C-E) + User Guide v2 (sections 7-9) + Pentest Report template |

## 4. Docker/Infra Architecture

### Production Stack

```
                    ┌─────────────┐
    :443 HTTPS ───► │   Caddy      │ (auto-TLS Let's Encrypt, reverse proxy)
                    └──────┬──────┘
                           │ :9000 (FastCGI)
                    ┌──────▼──────┐
                    │  Laravel    │ (PHP-FPM 8.4, bukan artisan serve)
                    │  + Inertia  │
                    └──┬───┬───┬──┘
                       │   │   │
              ┌────────┘   │   └────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Postgres │ │ Mosquitto│ │ Ingestor │
        │  :5432   │ │  :1883   │ │ (Python) │
        └──────────┘ └──────────┘ └──────────┘
                            │ :8883 (TLS, external devices)
```

### Key Decisions

1. **Caddy** (not Nginx): Auto-TLS, ~10 line Caddyfile, single binary, low RAM. Perfect for VPS.
2. **PHP-FPM** (not Octane): Standard production, stable, well-documented. Caddy fastcgi proxy.
3. **Multi-stage Dockerfile**: Node build stage → PHP-FPM runtime. Final image ~150MB.
4. **Queue worker + scheduler**: Separate containers (Phase 2).

### Healthcheck Endpoints

| Service | Check | Expected |
|---|---|---|
| Laravel | `GET /api/health` | 200 `{"status":"ok"}` |
| Postgres | `pg_isready` | exit 0 |
| Mosquitto | `mosquitto_sub $SYS/broker/uptime` | message received |
| Ingestor | Docker healthcheck: `pg_isready` + MQTT ping | exit 0 |
| Caddy | `GET /health` → proxy Laravel | 200 |

## 5. Playwright E2E Strategy

### Principle

Tests = Living Spec. Each phase has a gate: `npx playwright test --grep @phase-N` must be green.

### Test Structure

```
tests/e2e/
├── fixtures/
│   ├── auth.ts              # Login fixture
│   ├── telemetry.ts         # MQTT publish helper (headless)
│   └── database.ts          # Reset + seed between tests
├── phase1-smoke.spec.ts     # @phase-1 (7 tests)
├── phase2-incidents.spec.ts # @phase-2 (3 tests)
├── phase2-agent.spec.ts     # @phase-2 (1 test)
├── phase2-security.spec.ts  # @phase-2 (2 tests)
├── phase3-attack.spec.ts    # @phase-3 (3 tests)
├── phase3-tenant.spec.ts    # @phase-3 (2 tests)
├── phase3-regression.spec.ts # @phase-3 (2 tests)
└── playwright.config.ts
```

### Test Cases

**Phase 1 (7 tests):**
1. Login page loads
2. Admin login → redirect to dashboard
3. Dashboard renders (cards: devices, incidents, events)
4. Telemetry simulator → device appears online
5. Security event visible (malformed payload)
6. API health endpoint
7. Logout

**Phase 2 (6 tests):**
8. Create incident manually → open
9. Close incident → resolved
10. AI agent prompt → response renders, audit row created
11. Security events filter by severity
12. Device policy quarantine
13. DB backup + restore

**Phase 3 (7 tests):**
14. Publish flood attack → security event created
15. Device spoofing attack → security event created
16. Unauthorized publish → broker rejects
17. Rate limit login (10 failed → 429)
18. Tenant isolation (A cannot access B data)
19. HTTPS enforcement (HTTP → 301 → HTTPS)
20. Full regression run

### Config

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8000',
  use: { headless: true, screenshot: 'only-on-failure', video: 'retain-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'docker compose up -d', url: 'http://localhost:8000/api/health', reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: 'phase-1', grep: '@phase-1' },
    { name: 'phase-2', grep: '@phase-2' },
    { name: 'phase-3', grep: '@phase-3' },
    { name: 'full', grep: '@phase-[123]' },
  ],
});
```

### Run Commands

```bash
npm run test:e2e                    # all phases
npm run test:e2e -- --grep @phase-1 # phase 1 only
npm run test:e2e:report             # HTML report
```

## 6. Wokwi Device Simulator

### Overview

Replace `services/attack-simulator/` Python scripts with Wokwi ESP32 visual circuit simulator projects. Wokwi provides browser-based ESP32 simulation with real WiFi + MQTT connectivity.

### Project Structure

```
wokwi/
├── telemetry-sensor/       # Phase 1: ESP32 + DHT22 → valid telemetry
│   ├── diagram.json        # Circuit layout (ESP32 + DHT22 + LED)
│   ├── sketch.ino          # Arduino C++ (WiFi + PubSubClient + JSON)
│   └── wokwi.toml          # Project config
├── multi-sensor/           # Phase 2: ESP32 + DHT22 + PIR + LDR
├── malformed-payload/      # Phase 3: sends invalid JSON
├── spoof-device/           # Phase 3: wrong device_id in topic
└── flood-attack/           # Phase 3: 100 msgs/sec
```

### Connectivity

| Mode | Broker target | Requirement | Phase |
|---|---|---|---|
| Private Gateway | `host.wokwi.internal:1883` (local Docker) | `wokwigw` app + Wokwi Club | 1-2 |
| Public | `vps-domain:8883` (TLS) | Broker exposed + TLS certs | 3 |

### Wokwi ESP32 Code Pattern (telemetry-sensor)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHTesp.h>

const char* ssid = "Wokwi-GUEST";
const char* mqtt_host = "host.wokwi.internal"; // or VPS IP
const int mqtt_port = 1883;
const char* mqtt_user = "sentinel_device";
const char* mqtt_pass = "device_password";
const char* topic = "tenants/default/iot/sensor/esp32-001/telemetry";

// WiFi + MQTT client setup
// Loop: read DHT22, build JSON, publish every 5s
```

### Playwright Integration

- Playwright E2E uses a thin headless MQTT publisher (`tests/e2e/fixtures/telemetry.ts`) for automated tests
- Wokwi projects are for **manual demo / client showcase** (visual circuit + real-time dashboard)
- Both send identical payload formats (shared JSON schema)

## 7. Manual Book Structure

### Deployment Manual (`docs/manuals/deployment-manual.md`)

**Audience:** DevOps/SysAdmin
**Tone:** Technical, step-by-step

```
1.  Prerequisites (VPS spec, DNS, Docker, SSH)
2.  Architecture Overview (service diagram, ports, data flow)
3.  Initial Deployment (clone, env, build, migrate, verify)
4.  TLS/HTTPS Configuration (Caddy auto-TLS, Caddyfile)
5.  Database Backup & Restore (pg_dump cron, restore procedure)
6.  Configuration Reference (env vars, compose overrides, resource limits)
7.  Monitoring & Healthchecks (endpoints, log rotation, Uptime Kuma)
8.  Troubleshooting (container, MQTT, DB, build, SELinux)
9.  Upgrade Procedure (pull, build, migrate, restart, rollback)
10. Appendices: A. CI/CD, B. Secret Mgmt, C. MQTT mTLS, D. Rate Limiting, E. Pentest
```

### User Guide (`docs/manuals/user-guide.md`)

**Audience:** Operator/client (non-technical)
**Tone:** Friendly, screenshot-driven

```
1.  Welcome to Sentinel-IoT
2.  Getting Started (login, dashboard tour)
3.  Device Management (list, status, details, quarantine, policies)
4.  Telemetry Monitoring (real-time, historical, filters)
5.  Security Events (types, severity, filter, acknowledge)
6.  Incident Management (create, lifecycle, AI reports, assign)
7.  AI Agent Console (what it does, example prompts, audit trail)
8.  Telegram Bot (commands, alerts)
9.  FAQ
```

## 8. File Layout & Deliverables

```
sentinel-iot/
├── docs/
│   ├── manuals/
│   │   ├── deployment-manual.md          # Phase 1-3 (incremental)
│   │   └── user-guide.md                 # Phase 2-3 (incremental)
│   ├── pentest-checklist.md              # Phase 3
│   └── (existing docs unchanged)
├── docker/
│   ├── laravel.Dockerfile                # MODIFY (dev)
│   ├── laravel.prod.Dockerfile           # NEW (multi-stage FPM)
│   └── caddy/
│       └── Caddyfile                     # NEW
├── docker-compose.prod.yml               # MODIFY (caddy, queue, backup)
├── .env.production.example               # NEW
├── scripts/
│   ├── backup-db.sh                      # Phase 1
│   ├── restore-db.sh                     # Phase 1
│   └── gen-mqtt-certs.sh                 # Phase 3
├── tests/e2e/                            # NEW (Playwright)
│   ├── playwright.config.ts
│   ├── fixtures/ (auth, telemetry, database)
│   ├── phase1-smoke.spec.ts
│   ├── phase2-*.spec.ts
│   └── phase3-*.spec.ts
├── wokwi/                                # NEW (replaces attack-simulator)
│   ├── telemetry-sensor/
│   ├── multi-sensor/
│   ├── malformed-payload/
│   ├── spoof-device/
│   └── flood-attack/
├── .github/workflows/ci.yml              # Phase 2
├── package.json                          # MODIFY (add test:e2e)
└── .gitignore                            # MODIFY
```

### Deliverable per Phase

| Phase | Files | Verification Gate |
|---|---|---|
| 1 | laravel.prod.Dockerfile, Caddyfile, docker-compose.prod.yml, .env.production.example, backup/restore-db.sh, deployment-manual.md v1, playwright.config.ts, fixtures, phase1-smoke.spec.ts, wokwi/telemetry-sensor/ | `npx playwright test --grep @phase-1` green |
| 2 | ci.yml, docker-compose.prod.yml (queue+sched), deployment-manual.md v2, user-guide.md v1, phase2-*.spec.ts, wokwi/multi-sensor/ | `npx playwright test --grep @phase-2` green |
| 3 | gen-mqtt-certs.sh, pentest-checklist.md, deployment-manual.md v3, user-guide.md v2, phase3-*.spec.ts, wokwi/attack projects | `npx playwright test --grep @phase-3` green |
