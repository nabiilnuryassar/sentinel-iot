# Quick Implementation Plan Prompt

Buat implementation plan untuk Sentinel-IoT (Laravel + React + MQTT + Wokwi ESP32).

**File:** `docs/plans/2026-06-30-implementation-plan.md`

## Current State
- Docker stack: ✅ All healthy
- PHP tests: 84/84 pass (SQLite)
- Playwright Phase-1: 7/7 pass
- Phase-2/3: Not run
- Git: 100+ uncommitted changes (CRITICAL)
- DB: Empty after rebuild (seeder not auto-run)

## Tasks to Include

### Phase 1: Critical (Day 1-2)
1. Git cleanup — commit 100+ changes
2. Auto-seed di docker-compose entrypoint
3. Run Phase-1 Playwright (verify 7/7)
4. PHP tests on Postgres
5. Fix failing tests

### Phase 2: Production (Day 3-5)
6. Run Phase-2/3 Playwright
7. T18 Full Stack Verification
8. Production Docker Compose test
9. Caddy auto-TLS
10. DB backup automation
11. Rate limiting API

### Phase 3: Hardening (Week 2-4)
12. Health check dashboard
13. Monitoring setup
14. Security hardening (CORS, CSP, input validation)
15. Deployment Manual v2
16. User Guide v1

## Task Format
Setiap task:
- Description (apa yang dilakukan)
- Files (exact paths)
- Commands (exact commands)
- Verification (proof of success)
- Commit message
- Time estimate

## Constraints
- Stack: Laravel 11 + React 18 + TypeScript + Vite
- DB: PostgreSQL 15
- Deploy: Single-client on-premise VPS
- TLS: Let's Encrypt via Caddy
- Quality gates: All tests pass, no hardcoded secrets, healthchecks OK

## Output
Markdown checklist yang bisa langsung dieksekusi oleh AI agent.
