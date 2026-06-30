# Sentinel-IoT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the Sentinel-IoT codebase: commit 225 uncommitted changes, auto-seed the database in Docker, verify all tests pass on PostgreSQL, run Playwright E2E tests, and harden the production deployment.

**Architecture:** Laravel 13 + React 19 + Inertia v3 on PostgreSQL 16 in Docker. MQTT ingestor bridges Mosquitto to Postgres. Caddy handles TLS in production. Playwright tests verify end-to-end flows.

**Tech Stack:** PHP 8.5, Laravel 13.9, React 19, Inertia v3, Tailwind CSS v4, Pest 4, Playwright, PostgreSQL 16, Mosquitto MQTT, Caddy, Docker Compose

## Global Constraints

- Stack: Laravel 13.9.0 + React 19.2.6 + TypeScript + Vite (NOT "Laravel 11 + React 18" — the prompt's version references are stale)
- DB: PostgreSQL 16 (production), SQLite in-memory (unit tests via phpunit.xml)
- Deploy: Single-client on-premise VPS via Docker Compose
- TLS: Let's Encrypt via Caddy (already configured in `docker-compose.prod.yml`)
- Quality gates: 84/84 PHP tests pass, Playwright Phase-1 7/7 pass, no hardcoded secrets
- `.env.testing` uses SQLite (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`)
- `phpunit.xml` overrides to SQLite — Postgres tests require explicit `DB_CONNECTION=pgsql` override

---

### Task 1: Fix .gitignore and Clean Build Artifacts

**Files:**
- Modify: `.gitignore`

**Problem:** 32,000+ untracked files pollute `git status`. `.pnpm-store/`, `wokwi/*/build/`, `wokwi/*/.build/`, `test-results/`, `.agents/`, `.pi/`, `__pycache__/`, and `tests/e2e/playwright-report/` are not gitignored.

- [ ] **Step 1: Add missing gitignore patterns**

Append these lines to `.gitignore`:

```
# pnpm store
.pnpm-store/

# Wokwi build artifacts
wokwi/*/.build/
wokwi/*/build/

# Playwright artifacts
test-results/
tests/e2e/playwright-report/

# Python bytecode
__pycache__/

# Skill directories
.agents/
.pi/
skills-lock.json

# Dashboard frontmatter (auto-generated)
diagram.json
libraries.txt
wokwi.toml

# Mosquitto runtime logs
mosquitto/logs/
```

- [ ] **Step 2: Remove cached untracked files from git index**

```bash
git rm -r --cached .pnpm-store/ 2>/dev/null || true
git rm -r --cached test-results/ 2>/dev/null || true
git rm -r --cached .agents/ 2>/dev/null || true
git rm -r --cached .pi/ 2>/dev/null || true
git rm -r --cached wokwi/flood-attack/build/ wokwi/flood-attack/.build/ wokwi/malformed-payload/build/ wokwi/malformed-payload/.build/ wokwi/multi-sensor/build/ wokwi/multi-sensor/.build/ wokwi/spoof-device/build/ wokwi/spoof-device/.build/ wokwi/telemetry-sensor/build/ wokwi/telemetry-sensor/.build/ 2>/dev/null || true
git rm -r --cached services/mqtt-ingestor/__pycache__/ 2>/dev/null || true
git rm -r --cached tests/e2e/playwright-report/ tests/e2e/tests/ 2>/dev/null || true
```

- [ ] **Step 3: Verify `git status` is manageable**

```bash
git status --short | wc -l
```

Expected: < 200 (down from 32,000+). Remaining files should be actual source changes.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: update .gitignore to exclude build artifacts, pnpm-store, and playwright reports"
```

---

### Task 2: Commit Infrastructure & Docker Changes

**Files:**
- `docker-compose.yml`
- `docker-compose.dev.yml` (if exists)
- `docker-compose.prod.yml`
- `docker-compose.override.yml`
- `docker-compose.override.yml.example`
- `docker/` (all files)
- `mosquitto/` (all files)
- `scripts/` (all files)
- `.dockerignore`
- `.env.production.example`
- `.env.testing`
- `.github/workflows/ci.yml`

- [ ] **Step 1: Stage and commit infrastructure files**

```bash
git add docker-compose.yml docker-compose.dev.yml docker-compose.prod.yml docker-compose.override.yml docker-compose.override.yml.example docker/ mosquitto/ scripts/ .dockerignore .env.production.example .env.testing .github/
git commit -m "infra: add Docker stack, Caddy TLS, backup scripts, CI workflow, and env templates"
```

- [ ] **Step 2: Verify Docker stack is healthy**

```bash
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

Expected: sentinel-laravel, sentinel-mosquitto (healthy), sentinel-mqtt-ingestor, sentinel-postgres (healthy) all running.

---

### Task 3: Commit Backend Source Changes (Models, Controllers, Services)

**Files:**
- `app/Http/Controllers/` (all)
- `app/Models/` (all)
- `app/Services/` (all)
- `app/Providers/` (all)
- `bootstrap/app.php`
- `routes/` (all)
- `config/` (all)

- [ ] **Step 1: Stage and commit backend source**

```bash
git add app/Http/ app/Models/ app/Services/ app/Providers/ bootstrap/app.php routes/ config/
git commit -m "feat: update controllers, models, services, routes, and config"
```

---

### Task 4: Commit Frontend Source Changes

**Files:**
- `resources/js/` (all)
- `resources/css/` (if changed)
- `package.json`
- `pnpm-lock.yaml`
- `vite.config.ts`

- [ ] **Step 1: Stage and commit frontend source**

```bash
git add resources/ package.json pnpm-lock.yaml vite.config.ts
git commit -m "feat: update React/Inertia frontend, dashboard components, and dependencies"
```

---

### Task 5: Commit Database (Migrations, Factories, Seeders)

**Files:**
- `database/migrations/` (all)
- `database/factories/` (all)
- `database/seeders/` (all)

- [ ] **Step 1: Stage and commit database files**

```bash
git add database/
git commit -m "feat: update migrations, factories, and seeders"
```

---

### Task 6: Commit Test Files

**Files:**
- `tests/Feature/` (all)
- `tests/Unit/` (all)
- `tests/Pest.php`
- `tests/TestCase.php`
- `tests/Traits/`
- `tests/e2e/` (Playwright specs and fixtures only, not reports)

- [ ] **Step 1: Stage and commit tests**

```bash
git add tests/Feature/ tests/Unit/ tests/Pest.php tests/TestCase.php tests/Traits/ tests/e2e/*.spec.ts tests/e2e/fixtures/ tests/e2e/playwright.config.ts
git commit -m "feat: update PHPUnit, Pest, and Playwright test suites"
```

---

### Task 7: Commit Wokwi ESP32 Simulator Sources

**Files:**
- `wokwi/*/` (`.ino`, `diagram.json`, `wokwi.toml`, `libraries.txt`, `README.md`, `build.sh` — NOT `build/` or `.build/`)

- [ ] **Step 1: Stage Wokwi source files (exclude build artifacts)**

```bash
git add wokwi/telemetry-sensor/ wokwi/spoof-device/ wokwi/multi-sensor/ wokwi/malformed-payload/ wokwi/flood-attack/ -- ':!wokwi/*/build/' ':!wokwi/*/.build/'
git commit -m "feat: add Wokwi ESP32 simulator scenarios (telemetry, spoof, flood, malformed)"
```

---

### Task 8: Commit Documentation & Remaining Files

**Files:**
- `docs/` (all)
- `README.md`
- `.gitignore` (already committed in Task 1)

- [ ] **Step 1: Stage and commit docs**

```bash
git add docs/ README.md
git commit -m "docs: update architecture docs, PRD, UI guide, design specs, and deployment manual"
```

---

### Task 9: Commit MQTT Ingestor Service

**Files:**
- `services/mqtt-ingestor/` (`.py`, `Dockerfile`, `requirements.txt` — NOT `__pycache__/`)

- [ ] **Step 1: Stage and commit**

```bash
git add services/mqtt-ingestor/ ':!services/mqtt-ingestor/__pycache__/'
git commit -m "feat: update MQTT ingestor with validator fixes"
```

---

### Task 10: Handle Duplicate Nested Directories

**Problem:** `app/app/`, `tests/tests/`, `database/database/` contain old Laravel 11 structure files that are showing as "modified" in git. These are likely leftover from a previous restructuring.

- [ ] **Step 1: Inspect nested directories**

```bash
ls -la app/app/ tests/tests/ database/database/ 2>/dev/null
git ls-files app/app/ tests/tests/ database/database/ | head -20
```

- [ ] **Step 2: If files are tracked duplicates, remove them**

```bash
git rm -r app/app/ tests/tests/ database/database/ 2>/dev/null || echo "Not tracked, adding to gitignore"
```

If they're not tracked, add to `.gitignore`:

```
# Duplicate nested dirs from Laravel 11 migration
app/app/
tests/tests/
database/database/
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove duplicate nested Laravel 11 directories"
```

---

### Task 11: Verify All Uncommitted Changes Are Addressed

- [ ] **Step 1: Check remaining uncommitted files**

```bash
git status --short
```

Expected: Clean working tree, or only files that should genuinely stay untracked (`.env`, etc.)

- [ ] **Step 2: Verify test suite still passes**

```bash
DB_CONNECTION=sqlite DB_DATABASE=':memory:' php artisan test --compact
```

Expected: 84/84 pass.

- [ ] **Step 3: Commit any remaining legitimate changes**

If there are straggler files that were missed, commit them in a final sweep:

```bash
git add -A && git status --short
# Review the staged files, then:
git commit -m "chore: final sweep of remaining uncommitted changes"
```

---

### Task 12: Auto-Seed Database in Docker Compose

**Files:**
- Modify: `docker-compose.yml` (postgres service)

**Problem:** After `docker compose down -v && docker compose up -d`, the database is empty. The seeder must run automatically.

- [ ] **Step 1: Add seed command to laravel-app entrypoint in `docker-compose.dev.yml`**

Read `docker-compose.dev.yml` first, then add an entrypoint that runs migrations + seeder before starting PHP-FPM:

```yaml
# In docker-compose.dev.yml, under laravel-app:
entrypoint: ["sh", "-c"]
command:
  - |
    php artisan migrate --force --no-interaction
    php artisan db:seed --force --no-interaction
    php-fpm
```

- [ ] **Step 2: Verify seeder runs in Docker**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T laravel-app php artisan migrate:fresh --seed --force --no-interaction
```

Expected: Migrations run, seeder creates admin user + 5 devices + telemetry + incidents.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.dev.yml
git commit -m "feat: auto-run migrations and seeder on Docker dev startup"
```

---

### Task 13: Run PHP Tests Against PostgreSQL

**Problem:** All 84 tests pass on SQLite but PostgreSQL has different behavior (e.g., `date_trunc()`, JSON operators, constraint handling). Need to verify parity.

- [ ] **Step 1: Run tests with PostgreSQL connection**

```bash
DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT=5433 DB_DATABASE=sentinel_iot DB_USERNAME=sentinel DB_PASSWORD=sentinel_password php artisan test --compact
```

Expected: 84/84 pass. If any fail, debug and fix.

- [ ] **Step 2: If tests fail, fix them and re-run**

Common PostgreSQL-specific failures:
- `date_trunc()` syntax differences
- JSON column queries
- Case sensitivity in string comparisons
- `TRUNCATE ... RESTART IDENTITY CASCADE` vs SQLite

- [ ] **Step 3: Commit fixes**

```bash
git add -A && git commit -m "fix: PostgreSQL test compatibility fixes"
```

---

### Task 14: Run Playwright Phase-1 E2E Tests

- [ ] **Step 1: Ensure Docker stack is running**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

- [ ] **Step 2: Run Phase-1 Playwright tests**

```bash
npx playwright test --project=phase-1
```

Expected: 7/7 pass.

- [ ] **Step 3: If tests fail, debug with trace viewer**

```bash
npx playwright show-report tests/e2e/playwright-report
```

Common issues:
- Dashboard page not loading (seeder not run)
- MQTT ingestor not processing messages
- Port conflicts

- [ ] **Step 4: Commit any Playwright fixture fixes**

```bash
git add tests/e2e/ && git commit -m "fix: Playwright Phase-1 E2E test fixes"
```

---

### Task 15: Run Playwright Phase-2/3 E2E Tests

- [ ] **Step 1: Run Phase-2 tests**

```bash
npx playwright test --project=phase-2
```

- [ ] **Step 2: Run Phase-3 tests**

```bash
npx playwright test --project=phase-3
```

- [ ] **Step 3: Fix any failures and commit**

```bash
git add tests/e2e/ && git commit -m "fix: Playwright Phase-2/3 E2E test fixes"
```

---

### Task 16: Production Docker Compose Verification

- [ ] **Step 1: Create `.env.production` from template**

```bash
cp .env.production.example .env.production
```

Edit `.env.production` with real values (or test values for verification).

- [ ] **Step 2: Build and start production stack**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- [ ] **Step 3: Verify all containers are healthy**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Expected: laravel-app (healthy), laravel-queue (healthy), laravel-scheduler, caddy, postgres (healthy), mosquitto (healthy), mqtt-ingestor.

- [ ] **Step 4: Run migrations + seeder in production mode**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T laravel-app php artisan migrate --force --no-interaction
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T laravel-app php artisan db:seed --force --no-interaction
```

- [ ] **Step 5: Verify Caddy serves HTTPS**

```bash
curl -k https://localhost/api/health
```

Expected: `{"status":"ok",...}`

---

### Task 17: Database Backup Automation

**Files:**
- `scripts/backup-db.sh` (already exists)

- [ ] **Step 1: Verify backup script works**

```bash
./scripts/backup-db.sh /tmp/sentinel-backups
```

Expected: Creates `/tmp/sentinel-backups/sentinel-YYYYMMDD-HHMMSS.sql.gz`

- [ ] **Step 2: Add cron entry to production deployment documentation**

Document in `docs/manuals/deployment-manual.md`:

```cron
# Sentinel-IoT DB backup — daily at 2 AM, keep last 30
0 2 * * * cd /path/to/sentinel-iot && ./scripts/backup-db.sh
```

---

### Task 18: Rate Limiting on API Routes

**Files:**
- Modify: `routes/api.php`

- [ ] **Step 1: Read current API routes**

```bash
php artisan route:list --path=api
```

- [ ] **Step 2: Add throttle middleware to public API routes**

The health endpoint already has `throttle:60,1` on the group. Verify all sensitive endpoints are covered.

- [ ] **Step 3: Add specific rate limits for agent/AI endpoints**

```php
Route::middleware(['auth:sanctum', 'throttle:30,1'])->group(function (): void {
    Route::post('/agent/ask', [AgentController::class, 'ask']);
    Route::post('/agent/audit', [AgentController::class, 'audit']);
    Route::post('/agent/analyze-incident/{incident}', [AgentController::class, 'analyzeIncident']);
});
```

- [ ] **Step 4: Test rate limiting**

```bash
# Hit the endpoint 31 times quickly
for i in $(seq 1 31); do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/api/agent/ask -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"question":"test"}'; done
```

Expected: First 30 return 200/422, 31st returns 429.

- [ ] **Step 5: Commit**

```bash
git add routes/api.php && git commit -m "feat: add rate limiting to AI agent API endpoints"
```

---

### Task 19: Security Hardening

- [ ] **Step 1: Verify CORS configuration**

Check `config/cors.php` — ensure `allowed_origins` is not `*` in production.

- [ ] **Step 2: Verify CSP headers in Caddyfile**

The existing Caddyfile already adds `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `HSTS`. Verify these are sufficient.

- [ ] **Step 3: Verify no hardcoded secrets**

```bash
./scripts/check-secrets.sh
```

- [ ] **Step 4: Run Laravel security audit**

```bash
composer audit
```

- [ ] **Step 5: Commit any security fixes**

```bash
git add -A && git commit -m "security: harden CORS, CSP, and fix any audit findings"
```

---

### Task 20: Full Stack Verification (T18)

This is the final gate — everything must work end-to-end.

- [ ] **Step 1: Fresh Docker stack from scratch**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

- [ ] **Step 2: Wait for all services healthy**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

- [ ] **Step 3: Run migrations + seeder**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T laravel-app php artisan migrate --seed --force --no-interaction
```

- [ ] **Step 4: Run PHP tests**

```bash
DB_CONNECTION=sqlite DB_DATABASE=':memory:' php artisan test --compact
```

Expected: 84/84 pass.

- [ ] **Step 5: Run Playwright Phase-1**

```bash
npx playwright test --project=phase-1
```

Expected: 7/7 pass.

- [ ] **Step 6: Verify dashboard loads with data**

```bash
curl -s http://localhost:8000/api/health | jq .
curl -s -b cookies.txt http://localhost:8000/dashboard | head -50
```

- [ ] **Step 7: Verify MQTT ingestor processes messages**

```bash
# Publish test telemetry via mosquitto_pub
docker compose exec mosquitto mosquitto_pub -h localhost -p 1883 -u sentinel_ingestor -P sentinel_ingestor_password -t "tenants/default/devices/test-001/telemetry" -m '{"device_id":"test-001","temperature":25.5,"humidity":60,"battery":95}'
```

Wait 5 seconds, then check:

```bash
docker compose exec -T postgres psql -U sentinel -d sentinel_iot -c "SELECT * FROM telemetry_logs WHERE device_id = 'test-001' ORDER BY id DESC LIMIT 1;"
```

Expected: One row with temperature=25.5, humidity=60, battery=95.

---

## Verification Summary

| Gate | Command | Expected |
|------|---------|----------|
| Git clean | `git status --short \| wc -l` | 0 |
| PHP tests (SQLite) | `DB_CONNECTION=sqlite DB_DATABASE=':memory:' php artisan test --compact` | 84/84 pass |
| PHP tests (Postgres) | `DB_CONNECTION=pgsql ... php artisan test --compact` | 84/84 pass |
| Playwright Phase-1 | `npx playwright test --project=phase-1` | 7/7 pass |
| Playwright Phase-2 | `npx playwright test --project=phase-2` | All pass |
| Playwright Phase-3 | `npx playwright test --project=phase-3` | All pass |
| Docker healthy | `docker compose ps` | All services healthy |
| API health | `curl localhost:8000/api/health` | 200 OK |
| Auto-seed | Fresh `docker compose up -d` | Dashboard shows data |
| Backup | `./scripts/backup-db.sh` | `.sql.gz` created |
| Secrets | `./scripts/check-secrets.sh` | No leaks |
