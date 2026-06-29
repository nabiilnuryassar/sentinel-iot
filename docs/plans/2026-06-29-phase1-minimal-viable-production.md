# Sentinel-IoT Phase 1: Minimal Viable Production — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.
> Each task is self-contained — a fresh subagent can pick up any task with full context.

**Goal:** Make Sentinel-IoT run stably on VPS with HTTPS, DB backup, Playwright smoke green, and Wokwi device simulator.

**Architecture:** Caddy (reverse proxy + auto-TLS) → PHP-FPM 8.4 (Laravel) → Postgres 16 + Mosquitto 2 + Python ingestor. Multi-stage Dockerfile. Playwright E2E as verification gate.

**Tech Stack:** Laravel 12, React 19 + Inertia 3, Vite 8, PHP 8.4-FPM, Caddy 2, Postgres 16, Mosquitto 2, Playwright 1.61, Wokwi ESP32

**Spec:** `docs/superpowers/specs/2026-06-29-production-readiness-design.md`

**Verification Gate:** `npx playwright test --grep @phase-1` must pass before Phase 1 is complete.

---

## Task Dependency Graph

```
T01 (Docker fix) ──► T02 (chown build) ──► T03 (lint fix) ──► T04 (pint fix)
                                              │
                                              ▼
T05 (git cleanup) ◄─────────────────────────┘
         │
         ▼
T06 (.env.production.example) ──► T07 (prod Dockerfile) ──► T08 (Caddyfile)
                                          │                       │
                                          ▼                       ▼
                                   T09 (compose.prod) ◄───────────┘
                                          │
                                   ┌──────┤
                                   ▼      ▼
                              T10 (backup) T11 (restore)
                                   │
                                   ▼
T12 (Playwright config) ──► T13 (auth fixture) ──► T14 (telemetry fixture)
                                                          │
                                   ┌──────────────────────┘
                                   ▼
T15 (smoke: login) ──► T16 (smoke: dashboard) ──► T17 (smoke: telemetry)
                                                          │
                                                          ▼
                                    T18 (smoke: security event) ──► T19 (smoke: API+logout)
                                                          │
                                                          ▼
                                    T20 (npm script) ──► T21 (Wokwi telemetry-sensor)
                                                          │
                                                          ▼
                                                    T22 (Deployment Manual v1)
                                                          │
                                                          ▼
                                                    T23 (commit + tag)
```

---

## Task 01: Fix Docker Content Store Corruption

**Objective:** Reset Docker storage so `docker compose up --build` works again.

**Files:** None (system-level fix)

**Step 1: Stop Docker**
```bash
sudo systemctl stop docker docker.socket
```

**Step 2: Prune all Docker data (nuclear option — existing images will be re-pulled)**
```bash
sudo rm -rf /forge/docker/*
```

**Step 3: Start Docker**
```bash
sudo systemctl start docker
```

**Step 4: Verify Docker is clean**
```bash
docker info --format 'DockerRoot={{.DockerRootDir}} Driver={{.Driver}}'
docker images   # should be empty
docker ps -a    # should be empty
```

**Expected:** DockerRoot=/forge/docker, no images, no containers.

**Step 5: Rebuild sentinel-iot from scratch**
```bash
cd /forge/projects/sentinel-iot
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

**Step 6: Verify all containers running**
```bash
docker compose ps
```
**Expected:** 4 containers running (laravel-app, postgres, mosquitto, mqtt-ingestor).

**Step 7: Commit**
```bash
# No file changes — this is a system fix.
# Document in worklog.
echo "Docker content store reset on $(date)" >> WORKLOG.md
git add WORKLOG.md
git commit -m "fix: reset docker content store, rebuild from scratch"
```

---

## Task 02: Fix Vite Build Permission

**Objective:** Make `npm run build` work from host by fixing `public/build/` ownership.

**Files:**
- Modify: `public/build/` (ownership)

**Step 1: Fix ownership**
```bash
sudo chown -R nabiil:nabiil /forge/projects/sentinel-iot/public/build
```

**Step 2: Verify build works**
```bash
cd /forge/projects/sentinel-iot
npm run build
```
**Expected:** `✓ built` with no EACCES errors. `public/build/manifest.json` exists.

**Step 3: Add public/build to .gitignore (already there — verify)**
```bash
grep 'public/build' .gitignore
```
**Expected:** `/public/build` is in .gitignore.

---

## Task 03: Fix ESLint Errors

**Objective:** Make `npm run lint:check` pass with zero errors.

**Files:**
- Modify: `resources/js/pages/globe-hero-demo.tsx`
- Modify: `resources/js/pages/welcome.tsx`

**Step 1: Run auto-fix**
```bash
cd /forge/projects/sentinel-iot
npm run lint
```

**Step 2: Verify lint passes**
```bash
npm run lint:check
```
**Expected:** `✓ 0 errors` (1 warning about TanStack Table is OK — it's a known React Compiler limitation).

**Step 3: Commit**
```bash
git add resources/js/pages/globe-hero-demo.tsx resources/js/pages/welcome.tsx
git commit -m "fix: eslint import order and padding errors"
```

---

## Task 04: Fix Pint Style Issue

**Objective:** Make `vendor/bin/pint --test` pass with zero issues.

**Files:**
- Modify: `routes/web.php` (remove extra blank line)

**Step 1: Run auto-fix**
```bash
cd /forge/projects/sentinel-iot
vendor/bin/pint
```

**Step 2: Verify pint passes**
```bash
vendor/bin/pint --test
```
**Expected:** `PASS` with 0 style issues.

**Step 3: Commit**
```bash
git add routes/web.php
git commit -m "fix: pint no_extra_blank_lines in routes/web.php"
```

---

## Task 05: Clean Git Working Tree

**Objective:** Audit `git status`, remove junk, ensure clean baseline.

**Files:**
- Modify: `.gitignore` (add missing entries)
- Delete: accidental duplicate paths (`app/app/`, `database/database/`, `tests/tests/`)

**Step 1: Audit current status**
```bash
cd /forge/projects/sentinel-iot
git status --short | head -80
```

**Step 2: Add missing .gitignore entries**
```bash
# Add agent artifacts and local files to .gitignore
cat >> .gitignore << 'EOF'

# Agent/tool artifacts
/.agents/
/.pi/
/.hermes/
/scripts/local/

# OS files
.DS_Store
Thumbs.db
EOF
```

**Step 3: Remove accidental duplicate directories (if confirmed as duplicates)**
```bash
# Check if these are actual duplicates
ls -la app/app/ 2>/dev/null && echo "DUPLICATE: app/app/ exists"
ls -la database/database/ 2>/dev/null && echo "DUPLICATE: database/database/ exists"
ls -la tests/tests/ 2>/dev/null && echo "DUPLICATE: tests/tests/ exists"

# If confirmed duplicates, remove from git tracking:
git rm -r --cached app/app database/database tests/tests 2>/dev/null || true
```

**Step 4: Stage all changes and review**
```bash
git add -A
git status --short | head -40
```

**Step 5: Commit clean baseline**
```bash
git commit -m "chore: clean git tree, update .gitignore, remove duplicate paths"
```

**Step 6: Verify clean**
```bash
git status
```
**Expected:** `nothing to commit, working tree clean`.

---

## Task 06: Create .env.production.example

**Objective:** Create a production env template with no real secrets.

**Files:**
- Create: `.env.production.example`

**Step 1: Copy .env.example as base**
```bash
cd /forge/projects/sentinel-iot
cp .env.example .env.production.example
```

**Step 2: Edit for production defaults**
```bash
# Key changes in .env.production.example:
# APP_ENV=production
# APP_DEBUG=false
# APP_URL=https://your-domain.com
# LOG_STACK=stderr
# QUEUE_CONNECTION=database
# SESSION_DRIVER=database
# CACHE_STORE=database
# All password fields = "CHANGE_ME"
# All API key fields = "YOUR_API_KEY_HERE"
```

**Step 3: Ensure .gitignore tracks it correctly**
```bash
# .env.production should be ignored, but .env.production.example should be tracked
grep '.env.production' .gitignore
# If only .env.production is ignored (not .env.production.example), we're good.
```

**Step 4: Commit**
```bash
git add .env.production.example
git commit -m "chore: add .env.production.example template"
```

---

## Task 07: Create Production Dockerfile (Multi-Stage FPM)

**Objective:** Replace `php artisan serve` with PHP-FPM for production.

**Files:**
- Create: `docker/laravel.prod.Dockerfile`

**Step 1: Write multi-stage Dockerfile**
```dockerfile
# docker/laravel.prod.Dockerfile
# Production image: multi-stage build with Node frontend + PHP-FPM runtime.
# Final image ~150MB (vs ~800MB dev image).

# ── Stage 1: Build frontend assets ──────────────────────────────
FROM node:22-slim AS frontend

WORKDIR /var/www/html

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ── Stage 2: PHP-FPM runtime ────────────────────────────────────
FROM php:8.4-fpm-alpine AS runtime

WORKDIR /var/www/html

# System deps + PHP extensions
RUN apk add --no-cache \
    libpq-dev \
    icu-libs \
    && docker-php-ext-install -j$(nproc) \
    pdo_pgsql \
    intl \
    opcache \
    pcntl

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy app code
COPY . .

# Install PHP deps (no dev, optimized autoloader)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy built frontend assets from Stage 1
COPY --from=frontend /var/www/html/public/build /var/www/html/public/build

# Permissions
RUN chown -R www-data:www-data storage bootstrap/cache
RUN chmod -R 775 storage bootstrap/cache

# OPCache config
RUN echo "[opcache]\nopcache.enable=1\nopcache.memory_consumption=128\nopcache.max_accelerated_files=10000\nopcache.validate_timestamps=0" > /usr/local/etc/php/conf.d/opcache-recommended.ini

USER www-data

CMD ["php-fpm"]
```

**Step 2: Verify Dockerfile syntax**
```bash
docker build --check -f docker/laravel.prod.Dockerfile .
```

**Step 3: Commit**
```bash
git add docker/laravel.prod.Dockerfile
git commit -m "feat: add production multi-stage Dockerfile (PHP-FPM + Node build)"
```

---

## Task 08: Create Caddyfile

**Objective:** Configure Caddy as reverse proxy + auto-TLS.

**Files:**
- Create: `docker/caddy/Caddyfile`

**Step 1: Write Caddyfile**
```caddyfile
# docker/caddy/Caddyfile
# Caddy reverse proxy with automatic HTTPS (Let's Encrypt).
# Replace {$DOMAIN} with your domain in .env.production.

{
	# Global options
	email {$ACME_EMAIL:-admin@example.com}
}

# HTTPS auto-provisioning for the app domain
{$DOMAIN} {
	# Serve static files directly (assets, images)
	root * /var/www/html/public
	file_server

	# PHP-FPM FastCGI proxy
	php_fastcgi laravel-app:9000

	# Laravel's index.php fallback (handled by php_fastcgi)
	# No additional rewrite needed — Caddy's php_fastcgi does this.

	# Security headers
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "strict-origin-when-cross-origin"
	}

	# Gzip compression
	encode gzip zstd

	# Access log
	log {
		output stdout
		format json
	}
}

# Health check endpoint (no TLS, internal only)
:8080 {
	respond /health "ok" 200
	respond 404
}
```

**Step 2: Commit**
```bash
git add docker/caddy/Caddyfile
git commit -m "feat: add Caddy reverse proxy config with auto-TLS"
```

---

## Task 09: Update docker-compose.prod.yml

**Objective:** Add Caddy service, use production Dockerfile, add healthchecks.

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Rewrite docker-compose.prod.yml**
```yaml
# docker-compose.prod.yml
# Production overlay — Caddy + PHP-FPM, no bind mounts, no HMR.
#
# Usage:
#   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
#
# Requires: .env.production with real secrets, DOMAIN set.

services:
  laravel-app:
    build:
      context: .
      dockerfile: docker/laravel.prod.Dockerfile
    container_name: sentinel-laravel
    restart: unless-stopped
    env_file:
      - .env.production
    environment:
      APP_ENV: production
      APP_DEBUG: "false"
    healthcheck:
      test: ["CMD-SHELL", "php artisan sentinel:health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    depends_on:
      postgres:
        condition: service_healthy
      mosquitto:
        condition: service_started
    networks:
      - sentinel-net

  caddy:
    image: caddy:2-alpine
    container_name: sentinel-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/caddy/Caddyfile:/etc/caddy/Caddyfile:ro,z
      - ./public:/var/www/html/public:ro,z
      - caddy_data:/data
      - caddy_config:/config
    environment:
      DOMAIN: ${DOMAIN:-localhost}
      ACME_EMAIL: ${ACME_EMAIL:-admin@example.com}
    depends_on:
      laravel-app:
        condition: service_started
    networks:
      - sentinel-net

volumes:
  caddy_data:
  caddy_config:

networks:
  sentinel-net:
    driver: bridge
```

**Step 2: Verify compose syntax**
```bash
cd /forge/projects/sentinel-iot
docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet
```
**Expected:** No errors.

**Step 3: Commit**
```bash
git add docker-compose.prod.yml
git commit -m "feat: update prod compose with Caddy + FPM + healthchecks"
```

---

## Task 10: Create DB Backup Script

**Objective:** Automated `pg_dump` cron script for database backups.

**Files:**
- Create: `scripts/backup-db.sh`

**Step 1: Write backup script**
```bash
#!/usr/bin/env bash
# scripts/backup-db.sh
# Backs up the Sentinel-IoT Postgres database.
# Usage: ./scripts/backup-db.sh [backup_dir]
# Cron: 0 2 * * * /path/to/sentinel-iot/scripts/backup-db.sh

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sentinel-${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

# Source env
if [ -f .env.production ]; then
  source .env.production
elif [ -f .env ]; then
  source .env
fi

# Run pg_dump inside the postgres container
docker compose exec -T postgres pg_dump \
  -U "${DB_USERNAME:-sentinel}" \
  -d "${DB_DATABASE:-sentinel_iot}" \
  --no-owner --no-privileges \
  | gzip > "$BACKUP_FILE"

# Verify backup
if [ -s "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date)] Backup complete: $BACKUP_FILE ($SIZE)"
else
  echo "[$(date)] ERROR: Backup file is empty!"
  exit 1
fi

# Retention: keep last 30 backups
ls -t "$BACKUP_DIR"/sentinel-*.sql.gz | tail -n +31 | xargs -r rm --
echo "[$(date)] Retention: kept last 30 backups"
```

**Step 2: Make executable**
```bash
chmod +x scripts/backup-db.sh
```

**Step 3: Test backup**
```bash
./scripts/backup-db.sh
ls -la backups/
```
**Expected:** A `.sql.gz` file exists, non-empty.

**Step 4: Commit**
```bash
git add scripts/backup-db.sh
git commit -m "feat: add database backup script with 30-day retention"
```

---

## Task 11: Create DB Restore Script

**Objective:** Restore database from a backup file.

**Files:**
- Create: `scripts/restore-db.sh`

**Step 1: Write restore script**
```bash
#!/usr/bin/env bash
# scripts/restore-db.sh
# Restores the Sentinel-IoT database from a backup file.
# Usage: ./scripts/restore-db.sh <backup_file.sql.gz>

set -euo pipefail

BACKUP_FILE="${1:?Usage: $0 <backup_file.sql.gz>}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: File not found: $BACKUP_FILE"
  exit 1
fi

# Source env
if [ -f .env.production ]; then
  source .env.production
elif [ -f .env ]; then
  source .env
fi

echo "[$(date)] Restoring database from: $BACKUP_FILE"
echo "WARNING: This will OVERWRITE the current database!"
read -p "Continue? (yes/no): " confirm
[ "$confirm" = "yes" ] || exit 0

# Drop and recreate
docker compose exec -T postgres psql \
  -U "${DB_USERNAME:-sentinel}" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS ${DB_DATABASE:-sentinel_iot};" \
  -c "CREATE DATABASE ${DB_DATABASE:-sentinel_iot};"

# Restore
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql \
  -U "${DB_USERNAME:-sentinel}" \
  -d "${DB_DATABASE:-sentinel_iot}"

echo "[$(date)] Restore complete."
echo "Run: docker compose exec laravel-app php artisan migrate --force"
echo "Run: docker compose exec laravel-app php artisan db:seed --class=DemoSeeder --force"
```

**Step 2: Make executable**
```bash
chmod +x scripts/restore-db.sh
```

**Step 3: Commit**
```bash
git add scripts/restore-db.sh
git commit -m "feat: add database restore script"
```

---

## Task 12: Create Playwright Config

**Objective:** Set up Playwright configuration for E2E tests.

**Files:**
- Create: `tests/e2e/playwright.config.ts`
- Modify: `package.json` (add test:e2e scripts)

**Step 1: Create Playwright config**
```typescript
// tests/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  fullyParallel: false, // Sequential — tests share Docker state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputDir: 'tests/e2e/playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d',
    url: 'http://localhost:8000/api/health',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'phase-1', testMatch: /phase1.*\.spec\.ts/, grep: '@phase-1' },
    { name: 'phase-2', testMatch: /phase2.*\.spec\.ts/, grep: '@phase-2' },
    { name: 'phase-3', testMatch: /phase3.*\.spec\.ts/, grep: '@phase-3' },
    { name: 'full', grep: '@phase-[123]' },
  ],
});
```

**Step 2: Add npm scripts to package.json**
```json
{
  "scripts": {
    "test:e2e": "npx playwright test --config=tests/e2e/playwright.config.ts",
    "test:e2e:report": "npx playwright show-report tests/e2e/playwright-report"
  }
}
```

**Step 3: Install Playwright browsers**
```bash
npx playwright install chromium
```

**Step 4: Commit**
```bash
git add tests/e2e/playwright.config.ts package.json
git commit -m "feat: add Playwright E2E config with phase-based projects"
```

---

## Task 13: Create Auth Fixture

**Objective:** Reusable login fixture for Playwright tests.

**Files:**
- Create: `tests/e2e/fixtures/auth.ts`

**Step 1: Write auth fixture**
```typescript
// tests/e2e/fixtures/auth.ts
import { test as base, expect, type Page } from '@playwright/test';

// Credentials from DemoSeeder
const ADMIN_EMAIL = 'admin@sentinel.local';
const ADMIN_PASSWORD = 'password';

// Extend test fixture with authenticatedPage
export const test = base.extend<{
  authedPage: Page;
}>({
  authedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');

    // Fill credentials
    await page.fill('[name="email"]', ADMIN_EMAIL);
    await page.fill('[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    await use(page);
  },
});

export { expect };
```

**Step 2: Commit**
```bash
git add tests/e2e/fixtures/auth.ts
git commit -m "feat: add Playwright auth fixture for admin login"
```

---

## Task 14: Create Telemetry Fixture

**Objective:** Headless MQTT publisher for triggering telemetry in E2E tests.

**Files:**
- Create: `tests/e2e/fixtures/telemetry.ts`

**Step 1: Write telemetry fixture**
```typescript
// tests/e2e/fixtures/telemetry.ts
// Headless MQTT publisher — sends payloads via docker compose run.
// This replicates what Wokwi ESP32 would send, but without a browser.

import { execSync } from 'child_process';

const COMPOSE = 'docker compose -f docker-compose.yml -f docker-compose.dev.yml';

/**
 * Publish a valid telemetry message via the attack-simulator container.
 * Topic: tenants/default/iot/sensor/test-device-001/telemetry
 */
export function publishTelemetry(deviceId = 'test-device-001', payload?: object) {
  const topic = `tenants/default/iot/sensor/${deviceId}/telemetry`;
  const data = JSON.stringify(payload ?? {
    type: 'temperature',
    location: 'test-lab',
    value: 23.5,
    unit: 'celsius',
    battery: 87,
    timestamp: new Date().toISOString(),
  });

  execSync(
    `${COMPOSE} run --rm --no-deps attack-simulator ` +
    `python -c "import paho.mqtt.client as mqtt; import os; c=mqtt.Client(); c.username_pw_set(os.getenv('MQTT_USERNAME','sentinel_device'),os.getenv('MQTT_PASSWORD','sentinel_mqtt_password')); c.connect('mosquitto',1883); c.publish('${topic}', '${data.replace(/'/g, "\\'")}'); c.disconnect()"`,
    { stdio: 'pipe', timeout: 15_000 }
  );
}

/**
 * Publish a malformed payload (invalid JSON).
 */
export function publishMalformedPayload(deviceId = 'test-device-001') {
  const topic = `tenants/default/iot/sensor/${deviceId}/telemetry`;

  execSync(
    `${COMPOSE} run --rm --no-deps attack-simulator ` +
    `python -c "import paho.mqtt.client as mqtt; import os; c=mqtt.Client(); c.username_pw_set(os.getenv('MQTT_USERNAME','sentinel_device'),os.getenv('MQTT_PASSWORD','sentinel_mqtt_password')); c.connect('mosquitto',1883); c.publish('${topic}', 'NOT-VALID-JSON'); c.disconnect()"`,
    { stdio: 'pipe', timeout: 15_000 }
  );
}
```

**Step 2: Commit**
```bash
git add tests/e2e/fixtures/telemetry.ts
git commit -m "feat: add headless MQTT telemetry fixture for E2E tests"
```

---

## Task 15: Write Phase 1 Smoke Test — Login

**Objective:** Test login page loads and admin can login.

**Files:**
- Create: `tests/e2e/phase1-smoke.spec.ts`

**Step 1: Write login tests**
```typescript
// tests/e2e/phase1-smoke.spec.ts
import { test, expect } from '@playwright/test';
import { test as authedTest } from './fixtures/auth';

// @phase-1 Test 1: Login page loads
test('login page loads @phase-1', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/Sentinel/);
  await expect(page.locator('[name="email"]')).toBeVisible();
  await expect(page.locator('[name="password"]')).toBeVisible();
});

// @phase-1 Test 2: Admin login redirects to dashboard
test('admin login redirects to dashboard @phase-1', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@sentinel.local');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
  await expect(page).toHaveURL(/\/dashboard/);
});
```

**Step 2: Run test**
```bash
npx playwright test --config=tests/e2e/playwright.config.ts --grep "@phase-1" -g "login"
```
**Expected:** 2 tests pass.

**Step 3: Commit**
```bash
git add tests/e2e/phase1-smoke.spec.ts
git commit -m "test: phase 1 smoke — login page + admin login"
```

---

## Task 16: Write Phase 1 Smoke Test — Dashboard

**Objective:** Test dashboard renders with summary cards.

**Files:**
- Modify: `tests/e2e/phase1-smoke.spec.ts`

**Step 1: Add dashboard test**
```typescript
// Append to phase1-smoke.spec.ts

// @phase-1 Test 3: Dashboard renders with summary cards
test('dashboard renders summary cards @phase-1', async ({ page }) => {
  // Login first
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@sentinel.local');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // Verify summary cards are visible
  // Look for device count, incident count, event count
  await expect(page.locator('text=/devices/i')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('text=/incidents/i')).toBeVisible();
});
```

**Step 2: Run test**
```bash
npx playwright test --config=tests/e2e/playwright.config.ts --grep "@phase-1" -g "dashboard"
```
**Expected:** 1 test pass.

**Step 3: Commit**
```bash
git add tests/e2e/phase1-smoke.spec.ts
git commit -m "test: phase 1 smoke — dashboard renders"
```

---

## Task 17: Write Phase 1 Smoke Test — Telemetry

**Objective:** Test that telemetry simulator causes device to appear online.

**Files:**
- Modify: `tests/e2e/phase1-smoke.spec.ts`

**Step 1: Add telemetry test**
```typescript
// Append to phase1-smoke.spec.ts
import { publishTelemetry } from './fixtures/telemetry';

// @phase-1 Test 4: Telemetry simulator → device appears online
test('telemetry simulator shows device online @phase-1', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@sentinel.local');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // Publish telemetry
  publishTelemetry('e2e-test-device-001');

  // Wait a moment for ingestor to process
  await page.waitForTimeout(2000);

  // Navigate to devices page and verify device exists
  await page.goto('/devices');
  await expect(page.locator('text=/e2e-test-device-001/')).toBeVisible({ timeout: 10_000 });
});
```

**Step 2: Run test**
```bash
npx playwright test --config=tests/e2e/playwright.config.ts --grep "@phase-1" -g "telemetry"
```
**Expected:** 1 test pass.

**Step 3: Commit**
```bash
git add tests/e2e/phase1-smoke.spec.ts
git commit -m "test: phase 1 smoke — telemetry simulator shows device online"
```

---

## Task 18: Write Phase 1 Smoke Test — Security Event

**Objective:** Test that malformed payload creates a visible security event.

**Files:**
- Modify: `tests/e2e/phase1-smoke.spec.ts`

**Step 1: Add security event test**
```typescript
// Append to phase1-smoke.spec.ts
import { publishMalformedPayload } from './fixtures/telemetry';

// @phase-1 Test 5: Malformed payload → security event visible
test('malformed payload creates security event @phase-1', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@sentinel.local');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // Publish malformed payload
  publishMalformedPayload('e2e-malformed-device');

  // Wait for ingestor to process
  await page.waitForTimeout(2000);

  // Navigate to security events page
  await page.goto('/security-events');
  await expect(page.locator('text=/malformed/i')).toBeVisible({ timeout: 10_000 });
});
```

**Step 2: Run test**
```bash
npx playwright test --config=tests/e2e/playwright.config.ts --grep "@phase-1" -g "malformed"
```
**Expected:** 1 test pass.

**Step 3: Commit**
```bash
git add tests/e2e/phase1-smoke.spec.ts
git commit -m "test: phase 1 smoke — malformed payload creates security event"
```

---

## Task 19: Write Phase 1 Smoke Test — API Health + Logout

**Objective:** Test API health endpoint and logout flow.

**Files:**
- Modify: `tests/e2e/phase1-smoke.spec.ts`

**Step 1: Add API health + logout tests**
```typescript
// Append to phase1-smoke.spec.ts

// @phase-1 Test 6: API health endpoint returns 200
test('API health endpoint @phase-1', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('ok');
});

// @phase-1 Test 7: Logout redirects to login
test('logout redirects to login @phase-1', async ({ page }) => {
  // Login first
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@sentinel.local');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // Click logout
  await page.click('text=/logout/i, [data-testid="logout"], form:has(button:has-text("Log")) button');

  // Should redirect to login
  await page.waitForURL('**/login', { timeout: 10_000 });
  await expect(page).toHaveURL(/\/login/);
});
```

**Step 2: Run full Phase 1 suite**
```bash
npm run test:e2e -- --grep @phase-1
```
**Expected:** All 7 tests pass.

**Step 3: Commit**
```bash
git add tests/e2e/phase1-smoke.spec.ts
git commit -m "test: phase 1 smoke — API health + logout"
```

---

## Task 20: Add npm test:e2e Scripts

**Objective:** Ensure `npm run test:e2e` works as shortcut.

**Files:**
- Modify: `package.json`

**Step 1: Verify scripts exist (from Task 12)**
```bash
cd /forge/projects/sentinel-iot
grep 'test:e2e' package.json
```
**Expected:** Both `test:e2e` and `test:e2e:report` scripts present.

**Step 2: If missing, add them**
```bash
npm pkg set scripts.test:e2e="npx playwright test --config=tests/e2e/playwright.config.ts"
npm pkg set scripts.test:e2e:report="npx playwright show-report tests/e2e/playwright-report"
```

**Step 3: Verify**
```bash
npm run test:e2e -- --grep @phase-1 --list
```
**Expected:** Lists 7 tests.

---

## Task 21: Create Wokwi Telemetry-Sensor Project

**Objective:** ESP32 + DHT22 simulator that publishes valid telemetry to Sentinel-IoT MQTT broker.

**Files:**
- Create: `wokwi/telemetry-sensor/diagram.json`
- Create: `wokwi/telemetry-sensor/sketch.ino`
- Create: `wokwi/telemetry-sensor/wokwi.toml`
- Create: `wokwi/telemetry-sensor/README.md`

**Step 1: Create wokwi.toml**
```toml
[wokwi]
version = 1
elf = ".build/telemetry-sensor.ino.elf"
firmware = ".build/telemetry-sensor.ino.hex"
```

**Step 2: Create diagram.json (ESP32 + DHT22)**
```json
{
  "version": 1,
  "author": "Sentinel-IoT",
  "editor": "wokwi",
  "parts": [
    { "type": "board-esp32-devkit-v1", "id": "esp", "top": 0, "left": 0, "attrs": {} },
    { "type": "wokwi-dht22", "id": "dht1", "top": -100, "left": 100, "attrs": {} }
  ],
  "connections": [
    [ "esp:TX0", "$serialMonitor:RX", "", [] ],
    [ "esp:RX0", "$serialMonitor:TX", "", [] ],
    [ "dht1:VCC", "esp:3V3", "red", [ "v0" ] ],
    [ "dht1:GND", "esp:GND.1", "black", [ "v0" ] ],
    [ "dht1:SDA", "esp:4", "blue", [ "v0" ] ]
  ],
  "dependencies": {}
}
```

**Step 3: Create sketch.ino**
```cpp
/*
 * Sentinel-IoT Wokwi Telemetry Sensor
 * ESP32 + DHT22 → publishes temperature/humidity to MQTT broker.
 *
 * Broker: Set MQTT_HOST to your Sentinel-IoT Mosquitto address.
 * Topic:  tenants/default/iot/sensor/{DEVICE_ID}/telemetry
 *
 * Wokwi connectivity:
 *   - Local dev: Use Private Gateway, set MQTT_HOST="host.wokwi.internal"
 *   - VPS prod:  Set MQTT_HOST to your VPS domain, port 8883 (TLS)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHTesp.h>
#include <ArduinoJson.h>

// ── Configuration ──────────────────────────────────────────────
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

const char* MQTT_HOST = "host.wokwi.internal";  // Change for production
const int   MQTT_PORT = 1883;
const char* MQTT_USER = "sentinel_device";
const char* MQTT_PASS = "sentinel_mqtt_password";

const char* DEVICE_ID  = "wokwi-dht22-001";
const char* DEVICE_TYPE = "temperature";
const char* LOCATION   = "wokwi-lab";

const char* TELEMETRY_TOPIC = "tenants/default/iot/sensor/wokwi-dht22-001/telemetry";

// ── Globals ────────────────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);
DHTesp       dht;

const int DHT_PIN = 4;
unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL = 5000; // 5 seconds

// ── Setup ──────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Sentinel-IoT Telemetry Sensor ===");

  // WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS, 6);
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.printf(" Connected! IP: %s\n", WiFi.localIP().toString().c_str());

  // DHT22
  dht.setup(DHT_PIN, DHTesp::DHT22);
  Serial.println("DHT22 initialized");

  // MQTT
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);
  Serial.printf("MQTT: %s:%d\n", MQTT_HOST, MQTT_PORT);
}

// ── MQTT reconnect ─────────────────────────────────────────────
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "esp32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(" Connected!");
    } else {
      Serial.printf(" Failed (rc=%d), retry in 5s\n", mqttClient.state());
      delay(5000);
    }
  }
}

// ── Publish telemetry ──────────────────────────────────────────
void publishTelemetry() {
  TempAndHumidity data = dht.getTempAndHumidity();

  if (dht.getStatus() != DHTesp::ERROR_NONE) {
    Serial.printf("DHT22 error: %s\n", dht.getStatusString());
    return;
  }

  JsonDocument doc;
  doc["type"]      = DEVICE_TYPE;
  doc["location"]  = LOCATION;
  doc["value"]     = round(data.temperature * 10) / 10.0;
  doc["unit"]      = "celsius";
  doc["humidity"]  = round(data.humidity * 10) / 10.0;
  doc["battery"]   = 92;
  doc["timestamp"] = millis();

  char payload[256];
  serializeJson(doc, payload, sizeof(payload));

  Serial.printf("Publishing: %s → %s\n", TELEMETRY_TOPIC, payload);
  mqttClient.publish(TELEMETRY_TOPIC, payload);
}

// ── Main loop ──────────────────────────────────────────────────
void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;
    publishTelemetry();
  }
}
```

**Step 4: Create README.md**
```markdown
# Sentinel-IoT Wokwi Telemetry Sensor

ESP32 + DHT22 simulator that publishes temperature/humidity telemetry to the Sentinel-IoT MQTT broker.

## Quick Start

1. Open project in [Wokwi](https://wokwi.com)
2. (For local broker) Run the [Wokwi IoT Gateway](https://github.com/wokwi/wokwigw)
3. Set `MQTT_HOST` in `sketch.ino`:
   - Local dev: `host.wokwi.internal` (with Private Gateway)
   - VPS production: your VPS domain (port 8883, TLS)
4. Press Run ▶️
5. Watch telemetry appear in Sentinel-IoT dashboard at `/devices`

## Payload Format

```json
{
  "type": "temperature",
  "location": "wokwi-lab",
  "value": 23.5,
  "unit": "celsius",
  "humidity": 55.2,
  "battery": 92,
  "timestamp": 12345
}
```

## Circuit

- ESP32 DevKit V1
- DHT22 temperature/humidity sensor (pin 4)
```

**Step 5: Commit**
```bash
git add wokwi/telemetry-sensor/
git commit -m "feat: add Wokwi ESP32 telemetry sensor project (DHT22 + MQTT)"
```

---

## Task 22: Write Deployment Manual v1

**Objective:** Create the first version of the Deployment Manual covering sections 1-5 and 8.

**Files:**
- Create: `docs/manuals/deployment-manual.md`

**Step 1: Write the manual**

Write a comprehensive deployment manual covering:
1. Prerequisites (VPS spec, DNS, Docker, SSH)
2. Architecture Overview (service diagram, ports, data flow)
3. Initial Deployment (clone, env, build, migrate, verify)
4. TLS/HTTPS Configuration (Caddy auto-TLS, Caddyfile)
5. Database Backup & Restore (pg_dump cron, restore procedure)
8. Troubleshooting (container, MQTT, DB, build, SELinux)

Include:
- Exact commands for every step
- Configuration examples
- Expected output for verification steps
- Troubleshooting flowchart

**Step 2: Commit**
```bash
git add docs/manuals/deployment-manual.md
git commit -m "docs: deployment manual v1 (prerequisites, deploy, TLS, backup, troubleshoot)"
```

---

## Task 23: Final Commit + Tag Phase 1

**Objective:** Verify all Phase 1 deliverables, tag the release.

**Step 1: Run all quality gates**
```bash
cd /forge/projects/sentinel-iot

echo "=== Build hygiene ==="
npm run build          # must pass
npm run lint:check     # must pass (1 warning OK)
vendor/bin/pint --test # must pass
php artisan test --compact  # must pass (73 tests)

echo "=== E2E smoke ==="
npm run test:e2e -- --grep @phase-1  # must pass (7 tests)

echo "=== Docker ==="
docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet  # must pass
```

**Step 2: Verify all files exist**
```bash
for f in \
  docker/laravel.prod.Dockerfile \
  docker/caddy/Caddyfile \
  docker-compose.prod.yml \
  .env.production.example \
  scripts/backup-db.sh \
  scripts/restore-db.sh \
  tests/e2e/playwright.config.ts \
  tests/e2e/fixtures/auth.ts \
  tests/e2e/fixtures/telemetry.ts \
  tests/e2e/phase1-smoke.spec.ts \
  wokwi/telemetry-sensor/sketch.ino \
  wokwi/telemetry-sensor/diagram.json \
  wokwi/telemetry-sensor/wokwi.toml \
  wokwi/telemetry-sensor/README.md \
  docs/manuals/deployment-manual.md; do
  [ -f "$f" ] && echo "✅ $f" || echo "❌ MISSING: $f"
done
```

**Step 3: Git tag**
```bash
git add -A
git commit -m "chore: phase 1 complete — minimal viable production"
git tag -a v0.1.0-phase1 -m "Phase 1: Minimal Viable Production"
```

**Step 4: Verify**
```bash
git log --oneline -5
git tag -l
```

---

## Summary

| Task | Description | Est. Time |
|------|-------------|-----------|
| T01 | Fix Docker content store | 5 min |
| T02 | Fix Vite build permission | 1 min |
| T03 | Fix ESLint errors | 2 min |
| T04 | Fix Pint style issue | 1 min |
| T05 | Clean git working tree | 5 min |
| T06 | Create .env.production.example | 2 min |
| T07 | Create production Dockerfile | 5 min |
| T08 | Create Caddyfile | 3 min |
| T09 | Update docker-compose.prod.yml | 5 min |
| T10 | Create DB backup script | 3 min |
| T11 | Create DB restore script | 2 min |
| T12 | Create Playwright config | 3 min |
| T13 | Create auth fixture | 3 min |
| T14 | Create telemetry fixture | 5 min |
| T15 | Smoke test: login | 5 min |
| T16 | Smoke test: dashboard | 3 min |
| T17 | Smoke test: telemetry | 5 min |
| T18 | Smoke test: security event | 5 min |
| T19 | Smoke test: API + logout | 3 min |
| T20 | Verify npm scripts | 1 min |
| T21 | Create Wokwi telemetry-sensor | 10 min |
| T22 | Write Deployment Manual v1 | 15 min |
| T23 | Final commit + tag | 3 min |
| **Total** | | **~95 min** |
