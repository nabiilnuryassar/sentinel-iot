# Sentinel-IoT Phase 2: Standard Production — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.
> **Prerequisite:** Phase 1 must be complete (`v0.1.0-phase1` tag).

**Goal:** CI/CD pipeline, monitoring, log rotation, secret management, queue workers, expanded Playwright E2E, Wokwi multi-sensor, User Guide v1.

**Verification Gate:** `npx playwright test --grep @phase-2` must pass.

---

## Task Dependency Graph

```
T01 (CI/CD workflow) ──► T02 (log rotation) ──► T03 (health dashboard)
         │
         ▼
T04 (Docker secrets) ──► T05 (queue worker) ──► T06 (scheduler)
                                                        │
                                                        ▼
T07 (Wokwi multi-sensor) ──► T08 (fixture: incidents) ──► T09 (fixture: agent)
          │                                                  │
          ▼                                                  ▼
T10 (test: create incident) ──► T11 (test: close incident) ──► T12 (test: AI agent)
          │
          ▼
T13 (test: security filter) ──► T14 (test: device policy) ──► T15 (test: backup/restore)
          │
          ▼
T16 (Deployment Manual v2) ──► T17 (User Guide v1) ──► T18 (commit + tag)
```

---

## Task 01: Create GitHub Actions CI/CD Workflow

**Objective:** Automated pipeline: lint → test → build → e2e → push image.

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Write CI workflow**
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PHP_VERSION: '8.4'
  NODE_VERSION: '22'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint:check
      - run: pnpm run types:check

  php-test:
    name: PHP Tests (Pest)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ env.PHP_VERSION }}
          extensions: pdo_pgsql, intl, opcache, pcntl
          coverage: xdebug
      - run: composer install --no-interaction --prefer-dist
      - run: vendor/bin/pint --test
      - run: php artisan test --compact

  build:
    name: Build Frontend
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: public/build/

  docker-build:
    name: Docker Image Build
    runs-on: ubuntu-latest
    needs: [php-test, build]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: docker/laravel.prod.Dockerfile
          push: false
          tags: sentinel-iot:ci-${{ github.sha }}

  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    needs: [docker-build]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/sentinel-iot
            git pull origin main
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
            docker compose exec -T laravel-app php artisan migrate --force
            docker compose exec -T laravel-app php artisan config:cache
            docker compose exec -T laravel-app php artisan route:cache
```

**Step 2: Commit**
```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow (lint → test → build → deploy)"
```

---

## Task 02: Add Docker Log Rotation

**Objective:** Prevent Docker logs from filling disk.

**Files:**
- Modify: `docker-compose.prod.yml`
- Create: `docker/daemon-logging.json`

**Step 1: Add logging config to all services in docker-compose.prod.yml**
```yaml
# Add to every service in docker-compose.prod.yml:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

**Step 2: Create daemon logging config (optional, for Docker daemon level)**
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

**Step 3: Commit**
```bash
git add docker-compose.prod.yml docker/daemon-logging.json
git commit -m "ops: add Docker log rotation (10m x 3 files per container)"
```

---

## Task 03: Add Health Dashboard Endpoint

**Objective:** Simple health status page for monitoring.

**Files:**
- Modify: `routes/api.php`
- Create: `app/Http/Controllers/HealthController.php`

**Step 1: Create HealthController**
```php
// app/Http/Controllers/HealthController.php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [];

        // Database
        try {
            DB::select('SELECT 1');
            $checks['database'] = 'ok';
        } catch (\Exception $e) {
            $checks['database'] = 'fail: ' . $e->getMessage();
        }

        // MQTT (check if mosquitto port is open)
        $mqttHost = config('mqtt.host', 'mosquitto');
        $mqttPort = (int) config('mqtt.port', 1883);
        $mqttConn = @fsockopen($mqttHost, $mqttPort, $errno, $errstr, 2);
        $checks['mqtt'] = $mqttConn ? 'ok' : "fail: $errstr";
        if ($mqttConn) fclose($mqttConn);

        $allOk = collect($checks)->every(fn ($v) => str_starts_with($v, 'ok'));

        return response()->json([
            'status' => $allOk ? 'ok' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ], $allOk ? 200 : 503);
    }
}
```

**Step 2: Register route**
```php
// routes/api.php — add:
Route::get('/health', HealthController::class)->name('api.health.detailed');
```

**Step 3: Test**
```bash
curl http://localhost:8000/api/health
```
**Expected:** `{"status":"ok","checks":{"database":"ok","mqtt":"ok"}}`

**Step 4: Commit**
```bash
git add app/Http/Controllers/HealthController.php routes/api.php
git commit -m "feat: add detailed health endpoint with DB + MQTT checks"
```

---

## Task 04: Implement Docker Secret Management

**Objective:** Remove all hardcoded secrets from docker-compose files.

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docker-compose.prod.yml`
- Create: `.env.production.example` (update)

**Step 1: Replace hardcoded secrets with env interpolation**

In `docker-compose.yml`, change:
```yaml
POSTGRES_PASSWORD: sentinel_password
```
to:
```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}
```

**Step 2: Document in .env.production.example**
```bash
# Add all required secrets with CHANGE_ME placeholders
POSTGRES_PASSWORD=CHANGE_ME
MQTT_PASSWORD=CHANGE_ME
MQTT_INGESTOR_PASSWORD=CHANGE_ME
APP_KEY=CHANGE_ME_base64_key
```

**Step 3: Add a validation script**
```bash
# scripts/check-secrets.sh
#!/usr/bin/env bash
set -euo pipefail
source .env.production 2>/dev/null || source .env
for var in POSTGRES_PASSWORD MQTT_PASSWORD APP_KEY; do
  val="${!var:-}"
  if [ -z "$val" ] || [ "$val" = "CHANGE_ME" ]; then
    echo "ERROR: $var is not set or still CHANGE_ME"
    exit 1
  fi
done
echo "All secrets configured."
```

**Step 4: Commit**
```bash
git add docker-compose.yml docker-compose.prod.yml .env.production.example scripts/check-secrets.sh
git commit -m "security: remove hardcoded secrets, add env interpolation + validation"
```

---

## Task 05: Add Queue Worker Container

**Objective:** Separate container for processing Laravel queue jobs.

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Add queue worker service**
```yaml
# Add to docker-compose.prod.yml services:
  laravel-queue:
    build:
      context: .
      dockerfile: docker/laravel.prod.Dockerfile
    container_name: sentinel-queue
    restart: unless-stopped
    env_file:
      - .env.production
    command: php artisan queue:work --tries=3 --backoff=10
    healthcheck:
      test: ["CMD-SHELL", "php artisan queue:status > /dev/null 2>&1 || exit 0"]
      interval: 60s
      timeout: 10s
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - sentinel-net
```

**Step 2: Verify**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet
```

**Step 3: Commit**
```bash
git add docker-compose.prod.yml
git commit -m "feat: add Laravel queue worker container"
```

---

## Task 06: Add Scheduler Container

**Objective:** Run Laravel scheduler in a separate container.

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Add scheduler service**
```yaml
# Add to docker-compose.prod.yml services:
  laravel-scheduler:
    build:
      context: .
      dockerfile: docker/laravel.prod.Dockerfile
    container_name: sentinel-scheduler
    restart: unless-stopped
    env_file:
      - .env.production
    command: >
      sh -c "while true; do
        php artisan schedule:run --no-interaction --quiet;
        sleep 60;
      done"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - sentinel-net
```

**Step 2: Commit**
```bash
git add docker-compose.prod.yml
git commit -m "feat: add Laravel scheduler container"
```

---

## Task 07: Create Wokwi Multi-Sensor Project

**Objective:** ESP32 + DHT22 + PIR motion + LDR light sensor for richer demo.

**Files:**
- Create: `wokwi/multi-sensor/diagram.json`
- Create: `wokwi/multi-sensor/sketch.ino`
- Create: `wokwi/multi-sensor/wokwi.toml`
- Create: `wokwi/multi-sensor/README.md`

**Step 1: Create diagram.json with ESP32 + DHT22 + PIR + LDR**

Add parts for wokwi-pir-motion-sensor and wokwi-photoresistor.

**Step 2: Create sketch.ino**

Publish different telemetry types based on sensor:
- DHT22 → temperature + humidity
- PIR → motion event (security event)
- LDR → light level

Use separate topics per sensor type.

**Step 3: Commit**
```bash
git add wokwi/multi-sensor/
git commit -m "feat: add Wokwi multi-sensor project (DHT22 + PIR + LDR)"
```

---

## Task 08-15: Phase 2 Playwright E2E Tests

### Task 08: Create Incidents Fixture
**Files:** `tests/e2e/fixtures/incidents.ts`
Create incident via API call, return incident ID.

### Task 09: Create Agent Fixture
**Files:** `tests/e2e/fixtures/agent.ts`
Submit agent prompt via API, return response.

### Task 10: Test — Create Incident `@phase-2`
**Files:** `tests/e2e/phase2-incidents.spec.ts`
Login → dashboard → incidents → new → fill → save → verify in list.

### Task 11: Test — Close Incident `@phase-2`
Open incident → close → verify status "resolved".

### Task 12: Test — AI Agent Prompt `@phase-2`
**Files:** `tests/e2e/phase2-agent.spec.ts`
Agent console → type "summarize open incidents" → verify response renders + audit row created.

### Task 13: Test — Security Events Filter `@phase-2`
**Files:** `tests/e2e/phase2-security.spec.ts`
Events page → filter by severity "high" → verify only high shown.

### Task 14: Test — Device Policy Quarantine `@phase-2`
Device list → quarantine device → verify status change + policy enforced.

### Task 15: Test — DB Backup + Restore `@phase-2`
Run backup script → drop DB → restore → verify data intact.

**Each task: write test → run → verify pass → commit.**

---

## Task 16: Update Deployment Manual v2

**Objective:** Add sections 6-7, 9, Appendix A-B.

**Files:**
- Modify: `docs/manuals/deployment-manual.md`

Add:
- Section 6: Configuration Reference (full env table)
- Section 7: Monitoring & Healthchecks (endpoints, log rotation, Uptime Kuma)
- Section 9: Upgrade Procedure (pull, build, migrate, restart, rollback)
- Appendix A: CI/CD Pipeline setup
- Appendix B: Secret Management

**Commit:**
```bash
git add docs/manuals/deployment-manual.md
git commit -m "docs: deployment manual v2 (config, monitoring, CI/CD, secrets)"
```

---

## Task 17: Write User Guide v1

**Objective:** Create the first version of the User Guide (sections 1-6).

**Files:**
- Create: `docs/manuals/user-guide.md`

Cover:
1. Welcome to Sentinel-IoT
2. Getting Started (login, dashboard tour)
3. Device Management (list, status, details, quarantine, policies)
4. Telemetry Monitoring (real-time, historical, filters)
5. Security Events (types, severity, filter, acknowledge)
6. Incident Management (create, lifecycle, AI reports)

Include `[SCREENSHOT: ...]` placeholders for screenshots.

**Commit:**
```bash
git add docs/manuals/user-guide.md
git commit -m "docs: user guide v1 (welcome, devices, telemetry, events, incidents)"
```

---

## Task 18: Final Commit + Tag Phase 2

**Step 1: Run all quality gates**
```bash
npm run build
npm run lint:check
vendor/bin/pint --test
php artisan test --compact
npm run test:e2e -- --grep @phase-1
npm run test:e2e -- --grep @phase-2
```

**Step 2: Tag**
```bash
git add -A
git commit -m "chore: phase 2 complete — standard production"
git tag -a v0.2.0-phase2 -m "Phase 2: Standard Production"
```

---

## Summary

| Task | Description | Est. Time |
|------|-------------|-----------|
| T01 | GitHub Actions CI/CD | 10 min |
| T02 | Docker log rotation | 3 min |
| T03 | Health dashboard endpoint | 5 min |
| T04 | Docker secret management | 5 min |
| T05 | Queue worker container | 3 min |
| T06 | Scheduler container | 3 min |
| T07 | Wokwi multi-sensor | 10 min |
| T08 | Incidents fixture | 3 min |
| T09 | Agent fixture | 3 min |
| T10 | Test: create incident | 5 min |
| T11 | Test: close incident | 5 min |
| T12 | Test: AI agent prompt | 5 min |
| T13 | Test: security events filter | 5 min |
| T14 | Test: device policy | 5 min |
| T15 | Test: DB backup/restore | 5 min |
| T16 | Deployment Manual v2 | 15 min |
| T17 | User Guide v1 | 20 min |
| T18 | Commit + tag | 3 min |
| **Total** | | **~115 min** |
