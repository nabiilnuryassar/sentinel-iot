# Sentinel-IoT Phase 3: Full Hardening — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.
> **Prerequisite:** Phase 2 must be complete (`v0.2.0-phase2` tag).

**Goal:** mTLS MQTT, audit logging, rate limiting, security scanning, pentest checklist, full Playwright E2E, Wokwi attack simulators, complete documentation.

**Verification Gate:** `npx playwright test --grep @phase-3` must pass. Plus full regression: `npx playwright test --grep @phase-[123]`.

---

## Task Dependency Graph

```
T01 (gen-mqtt-certs) ──► T02 (enforce mTLS) ──► T03 (audit logging)
         │                                           │
         ▼                                           ▼
T04 (rate limiting) ──► T05 (security scan) ──► T06 (pentest checklist)
         │
         ▼
T07 (Wokwi: malformed) ──► T08 (Wokwi: spoof) ──► T09 (Wokwi: flood)
         │
         ▼
T10 (test: flood attack) ──► T11 (test: spoof) ──► T12 (test: unauthorized)
         │
         ▼
T13 (test: rate limit) ──► T14 (test: tenant isolation) ──► T15 (test: HTTPS + full regression)
         │
         ▼
T16 (Deployment Manual v3) ──► T17 (User Guide v2) ──► T18 (commit + tag)
```

---

## Task 01: Create MQTT Certificate Generation Script

**Objective:** Generate CA + server + device certs for mTLS.

**Files:**
- Create: `scripts/gen-mqtt-certs.sh`

**Step 1: Write cert generation script**
```bash
#!/usr/bin/env bash
# scripts/gen-mqtt-certs.sh
# Generates CA, server, and device certificates for Mosquitto mTLS.
# Usage: ./scripts/gen-mqtt-certs.sh [device_id]

set -euo pipefail

CERT_DIR="${CERT_DIR:-./mosquitto/certs}"
DEVICE_ID="${1:-}"

mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

# ── CA ──────────────────────────────────────────────────────
if [ ! -f ca.key ]; then
  echo "Generating CA..."
  openssl genrsa -out ca.key 4096
  openssl req -new -x509 -key ca.key -out ca.crt -days 3650 \
    -subj "/C=ID/O=Sentinel-IoT/CN=Sentinel-IoT-CA"
fi

# ── Server cert ─────────────────────────────────────────────
if [ ! -f server.key ]; then
  echo "Generating server cert..."
  openssl genrsa -out server.key 2048
  openssl req -new -key server.key -out server.csr \
    -subj "/C=ID/O=Sentinel-IoT/CN=*.sentinel-iot.local"
  openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
    -CAcreateserial -out server.crt -days 825 \
    -extfile <(printf "subjectAltName=DNS:*.sentinel-iot.local,DNS:mosquitto,DNS:localhost")
fi

# ── Device cert (optional) ──────────────────────────────────
if [ -n "$DEVICE_ID" ]; then
  echo "Generating device cert for: $DEVICE_ID"
  openssl genrsa -out "device-${DEVICE_ID}.key" 2048
  openssl req -new -key "device-${DEVICE_ID}.key" \
    -out "device-${DEVICE_ID}.csr" \
    -subj "/C=ID/O=Sentinel-IoT/CN=${DEVICE_ID}"
  openssl x509 -req -in "device-${DEVICE_ID}.csr" \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out "device-${DEVICE_ID}.crt" -days 365
  echo "Device cert: $CERT_DIR/device-${DEVICE_ID}.crt"
  echo "Device key:  $CERT_DIR/device-${DEVICE_ID}.key"
fi

echo "Done. Files in: $CERT_DIR"
echo "CA cert: $CERT_DIR/ca.crt (distribute to devices)"
```

**Step 2: Make executable + test**
```bash
chmod +x scripts/gen-mqtt-certs.sh
./scripts/gen-mqtt-certs.sh
```

**Step 3: Commit**
```bash
git add scripts/gen-mqtt-certs.sh
git commit -m "feat: add MQTT mTLS certificate generation script"
```

---

## Task 02: Enforce mTLS in Mosquitto Config

**Objective:** Enable `require_certificate true` in mosquitto.conf.

**Files:**
- Modify: `mosquitto/config/mosquitto.conf`

**Step 1: Update mosquitto.conf**
```bash
# Change in mosquitto/config/mosquitto.conf:
# require_certificate false → require_certificate true
sed -i 's/require_certificate false/require_certificate true/' mosquitto/config/mosquitto.conf
```

**Step 2: Add CRL support (optional)**
```
# Add to mosquitto.conf after require_certificate:
# crlfile /mosquitto/certs/ca.crl
```

**Step 3: Test with generated certs**
```bash
# Start mosquitto with certs
docker compose up -d mosquitto

# Test: connect with valid device cert
mosquitto_pub -h localhost -p 8883 \
  --cafile mosquitto/certs/ca.crt \
  --cert mosquitto/certs/device-test.crt \
  --key mosquitto/certs/device-test.key \
  -t "tenants/default/iot/sensor/test/telemetry" \
  -m '{"type":"test","value":1}' -u sentinel_device -P password

# Expected: message published successfully
```

**Step 4: Commit**
```bash
git add mosquitto/config/mosquitto.conf
git commit -m "security: enforce mTLS (require_certificate) for MQTT"
```

---

## Task 03: Add Audit Logging

**Objective:** Log all admin actions to a dedicated table.

**Files:**
- Create: `database/migrations/2026_07_01_000000_create_audit_logs_table.php`
- Create: `app/Models/AuditLog.php`
- Create: `app/Http/Middleware/AuditAdminActions.php`
- Modify: `bootstrap/app.php` (register middleware)

**Step 1: Migration**
```php
// database/migrations/2026_07_01_000000_create_audit_logs_table.php
Schema::create('audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->string('action');           // e.g. 'device.quarantine'
    $table->string('resource_type')->nullable();
    $table->unsignedBigInteger('resource_id')->nullable();
    $table->jsonb('before')->nullable();
    $table->jsonb('after')->nullable();
    $table->string('ip_address')->nullable();
    $table->string('user_agent')->nullable();
    $table->timestamps();
    $table->index(['resource_type', 'resource_id']);
    $table->index('action');
});
```

**Step 2: Model + Middleware**
Create AuditLog model with `$fillable` and `belongsTo(User)`.
Create middleware that logs POST/PUT/DELETE requests for authenticated users.

**Step 3: Register middleware in bootstrap/app.php**
```php
$middleware->web(append: [
    \App\Http\Middleware\AuditAdminActions::class,
]);
```

**Step 4: Commit**
```bash
git add database/migrations/*audit* app/Models/AuditLog.php app/Http/Middleware/AuditAdminActions.php bootstrap/app.php
git commit -m "feat: add audit logging for admin actions"
```

---

## Task 04: Add Rate Limiting

**Objective:** Throttle login, API, and agent endpoints.

**Files:**
- Modify: `routes/web.php` (login throttle)
- Modify: `routes/api.php` (API throttle)
- Modify: `app/Http/Controllers/AgentController.php` (agent throttle)

**Step 1: Login throttle**
```php
// routes/web.php
Route::post('/login', [LoginController::class, 'store'])
    ->middleware(['guest', 'throttle:5,1'])  // 5 attempts per minute
    ->name('login.store');
```

**Step 2: API throttle**
```php
// routes/api.php
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function (): void {
    // existing API routes
});
```

**Step 3: Agent throttle**
```php
// In AgentController, add throttle middleware or use attribute
#[ThrottleRequests(maxAttempts: 10, decayMinutes: 1)]
```

**Step 4: Commit**
```bash
git add routes/web.php routes/api.php app/Http/Controllers/AgentController.php
git commit -m "security: add rate limiting for login (5/min), API (60/min), agent (10/min)"
```

---

## Task 05: Add Security Scanning

**Objective:** Trivy image scan + dependency audit in CI.

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Add Trivy job**
```yaml
# Add to .github/workflows/ci.yml jobs:
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -f docker/laravel.prod.Dockerfile -t sentinel-iot:scan .
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: sentinel-iot:scan
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

  dependency-audit:
    name: Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: corepack enable && pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=high
```

**Step 2: Commit**
```bash
git add .github/workflows/ci.yml
git commit -m "security: add Trivy image scan + pnpm audit to CI"
```

---

## Task 06: Create Pentest Checklist

**Objective:** OWASP Top 10 self-assessment document.

**Files:**
- Create: `docs/pentest-checklist.md`

**Step 1: Write checklist**

Cover OWASP Top 10:
1. Injection (SQL, NoSQL, command)
2. Broken Authentication
3. Sensitive Data Exposure
4. XML External Entities
5. Broken Access Control
6. Security Misconfiguration
7. Cross-Site Scripting (XSS)
8. Insecure Deserialization
9. Using Components with Known Vulnerabilities
10. Insufficient Logging & Monitoring

For each: checklist items, test method, expected result, status.

**Step 2: Commit**
```bash
git add docs/pentest-checklist.md
git commit -m "docs: add OWASP Top 10 pentest checklist"
```

---

## Task 07-09: Wokwi Attack Simulator Projects

### Task 07: Wokwi Malformed Payload
**Files:** `wokwi/malformed-payload/`
ESP32 that sends invalid JSON to telemetry topic. Triggers "malformed_payload" security event.

### Task 08: Wokwi Spoof Device
**Files:** `wokwi/spoof-device/`
ESP32 that publishes to a topic with another device's ID. Triggers "device_spoofing" security event.

### Task 09: Wokwi Flood Attack
**Files:** `wokwi/flood-attack/`
ESP32 that sends 100+ messages in 10 seconds. Triggers "publish_flood" security event.

**Each: create diagram.json + sketch.ino + wokwi.toml + README.md, commit.**

---

## Task 10-15: Phase 3 Playwright E2E Tests

### Task 10: Test — Publish Flood Attack `@phase-3`
**Files:** `tests/e2e/phase3-attack.spec.ts`
Run flood simulator → verify "publish_flood" security event created with severity "high".

### Task 11: Test — Device Spoofing Attack `@phase-3`
Run spoof simulator → verify "device_spoofing" security event created.

### Task 12: Test — Unauthorized Publish `@phase-3`
Run unauthorized publish script → verify broker rejects at auth, no message ingested.

### Task 13: Test — Rate Limit Login `@phase-3`
**Files:** `tests/e2e/phase3-tenant.spec.ts`
Send 10 failed login attempts → verify 429 Too Many Requests after threshold.

### Task 14: Test — Tenant Isolation `@phase-3`
Login as tenant A → try access tenant B data via API → verify 403/404, no data leak.

### Task 15: Test — HTTPS + Full Regression `@phase-3`
**Files:** `tests/e2e/phase3-regression.spec.ts`
- HTTP request → verify 301 redirect to HTTPS
- Run all `@phase-1` + `@phase-2` + `@phase-3` tests → verify all green

**Each: write test → run → verify pass → commit.**

---

## Task 16: Update Deployment Manual v3

**Objective:** Add Appendices C, D, E.

**Files:**
- Modify: `docs/manuals/deployment-manual.md`

Add:
- Appendix C: MQTT mTLS Setup (cert generation, device enrollment)
- Appendix D: Rate Limiting Configuration
- Appendix E: Security Scan & Pentest Checklist

**Commit:**
```bash
git add docs/manuals/deployment-manual.md
git commit -m "docs: deployment manual v3 (mTLS, rate limiting, pentest)"
```

---

## Task 17: Update User Guide v2

**Objective:** Add sections 7-9.

**Files:**
- Modify: `docs/manuals/user-guide.md`

Add:
7. AI Agent Console (what it does, example prompts, audit trail)
8. Telegram Bot (commands, alerts)
9. FAQ (common questions + troubleshooting)

**Commit:**
```bash
git add docs/manuals/user-guide.md
git commit -m "docs: user guide v2 (AI agent, Telegram, FAQ)"
```

---

## Task 18: Final Commit + Tag Phase 3

**Step 1: Run ALL quality gates**
```bash
npm run build
npm run lint:check
vendor/bin/pint --test
php artisan test --compact
npm run test:e2e                                    # ALL phases
npm run test:e2e -- --grep @phase-3                # Phase 3
```

**Step 2: Full verification**
```bash
# All 20 E2E tests must pass
npx playwright test --config=tests/e2e/playwright.config.ts --grep "@phase-[123]"
```

**Step 3: Tag**
```bash
git add -A
git commit -m "chore: phase 3 complete — full hardening"
git tag -a v1.0.0 -m "Sentinel-IoT v1.0.0 — Production Ready"
```

---

## Summary

| Task | Description | Est. Time |
|------|-------------|-----------|
| T01 | MQTT cert generation script | 5 min |
| T02 | Enforce mTLS in Mosquitto | 5 min |
| T03 | Audit logging (migration + model + middleware) | 10 min |
| T04 | Rate limiting (login, API, agent) | 5 min |
| T05 | Security scanning (Trivy + pnpm audit) | 5 min |
| T06 | Pentest checklist (OWASP Top 10) | 15 min |
| T07 | Wokwi: malformed payload | 10 min |
| T08 | Wokwi: spoof device | 10 min |
| T09 | Wokwi: flood attack | 10 min |
| T10 | Test: flood attack | 5 min |
| T11 | Test: spoof attack | 5 min |
| T12 | Test: unauthorized publish | 5 min |
| T13 | Test: rate limit login | 5 min |
| T14 | Test: tenant isolation | 10 min |
| T15 | Test: HTTPS + full regression | 5 min |
| T16 | Deployment Manual v3 | 15 min |
| T17 | User Guide v2 | 15 min |
| T18 | Commit + tag v1.0.0 | 3 min |
| **Total** | | **~143 min** |
