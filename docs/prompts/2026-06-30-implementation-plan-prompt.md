# Implementation Plan Generation Prompt

## Context

Kamu adalah AI engineer yang bertugas membuat implementation plan untuk project **Sentinel-IoT** — sebuah IoT Security Operation Center berbasis Laravel + React Inertia + MQTT + Wokwi ESP32 simulator.

**Repository:** `/forge/projects/sentinel-iot`
**Branch:** `main`
**Current State:** MVP dengan 84 PHP tests passing, Docker stack running, 5 Wokwi devices working

---

## Task

Buatkan **detailed implementation plan** dalam format markdown yang bisa langsung dieksekusi oleh AI agent (Codex, Claude Code, atau Hermes).

**Output file:** `docs/plans/2026-06-30-implementation-plan.md`

---

## Input: Current State Analysis

### ✅ Strengths (Sudah Ada)
1. Architecture: Laravel + React Inertia + TypeScript + MQTT Ingestor (Python)
2. Tests: 84 PHP tests (518 assertions), Playwright E2E framework
3. Documentation: PRD, Architecture, UI Guide, API Docs, Deployment Manual v1
4. IoT Pipeline: ESP32 → MQTT → Ingestor → DB → Dashboard (end-to-end verified)
5. CI/CD: GitHub Actions pipeline (lint → test → build → e2e)

### 🔴 Critical Gaps (Harus Segera Diperbaiki)
1. **Git working tree kotor** — 100+ uncommitted changes
2. **DB kosong setelah rebuild** — Seeder tidak auto-run
3. **Phase 2 & 3 tests belum di-run** — Tidak ada evidence passing
4. **T18 Full Stack Verification pending** — Gateway v1.0.0 belum jalan
5. **Production Docker Compose belum tested** — Caddy auto-TLS belum dikonfigurasi

### 🟡 Medium Priority (Harus Dikerjain)
1. Rate limiting untuk API routes
2. Health check dashboard
3. Backup automation (cron job)
4. PHP tests on Postgres (bukan SQLite)
5. Deployment Manual completion

### 🟢 Low Priority (Nice-to-Have)
1. WebSocket real-time updates
2. Error tracking (Sentry)
3. Security audit (OWASP Top 10)
4. User Guide untuk non-technical users

---

## Requirements

### Format Plan
```markdown
# Sentinel-IoT Implementation Plan

## Overview
[Brief summary of what this plan covers]

## Phase 1: Critical Fixes (Day 1-2)
### Task T01: [Task Name]
- **Description:** [Apa yang harus dilakukan]
- **Files:** [File paths yang diubah]
- **Commands:** [Exact commands to run]
- **Verification:** [How to verify it works]
- **Commit Message:** [Exact commit message]
- **Estimated Time:** [X minutes]

### Task T02: [Task Name]
...

## Phase 2: Production Hardening (Day 3-5)
...

## Phase 3: Advanced Features (Week 2-4)
...

## Verification Gates
[Checkpoints yang harus dipass sebelum lanjut]

## Rollback Plan
[Bagaimana cara rollback jika gagal]
```

### Task Requirements
Setiap task HARUS punya:
1. **Description** — Jelas, spesifik, bisa dipahami developer
2. **Files** — Exact file paths yang diubah/dibuat
3. **Commands** — Exact commands yang dijalankan (bukan pseudocode)
4. **Verification** — Command yang membuktikan task berhasil
5. **Commit Message** — Format conventional commits
6. **Estimated Time** — Realistis, termasuk testing
7. **Dependencies** — Task lain yang harus selesai duluan

### Task Ordering Rules
1. **Fix blockers first** — Git cleanup, auto-seed, uncommitted changes
2. **Verify before extend** — Run existing tests sebelum tambah fitur baru
3. **Incremental delivery** — Setiap phase bisa di-deploy sendiri
4. **No big bang** — Task harus kecil (2-15 menit), bisa diverifikasi mandiri

---

## Specific Tasks to Include

### Phase 1: Critical Fixes (Day 1-2)
- [ ] T01: Git cleanup — commit semua uncommitted changes
- [ ] T02: Fix auto-seed di docker-compose entrypoint
- [ ] T03: Run Phase-1 Playwright tests (verify 7/7 pass)
- [ ] T04: Run PHP tests on Postgres (bukan SQLite)
- [ ] T05: Fix any failing tests

### Phase 2: Production Hardening (Day 3-5)
- [ ] T06: Run Phase-2 Playwright tests
- [ ] T07: Run Phase-3 Playwright tests
- [ ] T08: T18 Full Stack Verification
- [ ] T09: Production Docker Compose test
- [ ] T10: Caddy auto-TLS configuration
- [ ] T11: DB backup automation (cron job)
- [ ] T12: Rate limiting untuk API routes

### Phase 3: Advanced Features (Week 2-4)
- [ ] T13: Health check dashboard
- [ ] T14: Monitoring & alerting setup
- [ ] T15: Security hardening (CSP, CORS, input validation)
- [ ] T16: Deployment Manual v2 completion
- [ ] T17: User Guide v1

### Phase 4: Long-term (Month 2+)
- [ ] T18: WebSocket real-time updates
- [ ] T19: Error tracking (Sentry)
- [ ] T20: Security audit (OWASP Top 10)
- [ ] T21: Performance optimization

---

## Constraints & Preferences

### Technical Constraints
- **Stack:** Laravel 11 + React 18 + TypeScript + Vite
- **Database:** PostgreSQL 15 (bukan SQLite)
- **Container:** Docker Compose (dev + prod)
- **MQTT:** Mosquitto 2.x dengan ACL
- **IoT:** Wokwi ESP32 simulator
- **E2E:** Playwright headless mode
- **CI/CD:** GitHub Actions

### Deployment Target
- **Type:** Single-client on-premise VPS
- **OS:** Ubuntu 22.04 LTS
- **TLS:** Let's Encrypt via Caddy
- **Backup:** pg_dump cron + S3 sync

### Quality Gates
- [ ] All PHP tests pass (84+ tests)
- [ ] All Playwright E2E pass (phase-1/2/3)
- [ ] No hardcoded secrets in code
- [ ] Docker healthchecks passing
- [ ] API rate limiting active
- [ ] DB backup verified

---

## Output Format

Generate plan dalam format yang bisa langsung:
1. **Copy-paste ke AI agent** (Codex/Claude/Hermes)
2. **Commit ke repository** sebagai `docs/plans/`
3. **Track progress** dengan checklist

Setiap task harus **independent** — bisa dikerjakan mandiri tanpa konteks penuh.

---

## Example Task Format

```markdown
### Task T01: Git Cleanup — Commit All Uncommitted Changes

**Description:**
Commit semua 100+ uncommitted changes yang tersebar di working tree. Ini critical karena:
- Tidak bisa rollback jika ada error
- Tidak bisa collaborate dengan developer lain
- CI/CD tidak bisa jalan (dirty tree)

**Files:**
- `.gitignore` (update)
- All modified files (auto-detected by git)

**Commands:**
```bash
cd /forge/projects/sentinel-iot

# Review changes
git status --short | wc -l
git diff --stat

# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "chore: commit all pending changes before production hardening

- 100+ files modified across app, tests, docs, wokwi
- Added Wokwi ESP32 simulator integration
- Phase-1 Playwright E2E tests passing
- MQTT ingestor fixes and topic standardization
- Dashboard real data bindings
- Multi-tenant schema migration"
```

**Verification:**
```bash
git status --short
# Expected: clean working tree

git log --oneline -5
# Expected: new commit at HEAD
```

**Commit Message:** `chore: commit all pending changes before production hardening`

**Estimated Time:** 10 minutes

**Dependencies:** None
```

---

## Additional Context

### Current Git Status
- 100+ uncommitted changes
- Many deleted files (old structure: `app/app/`, `tests/tests/`)
- Untracked files: `.agents/skills/`, `.pnpm-store/`, `wokwi/`
- Last commit: `e7d6073` "feat(e2e): phase-1 Playwright smoke tests + MQTT ingestor fixes"

### Docker Stack Status
- `sentinel-laravel` → Up, port 8000
- `sentinel-mosquitto` → Up (healthy), port 1883/8883
- `sentinel-mqtt-ingestor` → Up
- `sentinel-postgres` → Up (healthy), port 5433

### Test Status
- PHP: 84/84 pass (SQLite)
- Playwright Phase-1: 7/7 pass (headless)
- Playwright Phase-2: Not run
- Playwright Phase-3: Not run

### Documentation Status
- PRD: ✅ Complete
- Architecture: ✅ Complete
- UI Guide: ✅ Complete
- API Docs: ✅ Complete
- Deployment Manual: ⚠️ v1 drafted, needs completion
- User Guide: ❌ Not started

---

## Final Notes

Plan harus:
1. **Actionable** — Setiap task bisa langsung dieksekusi
2. **Verifiable** — Ada command untuk membuktikan success
3. **Incremental** — Setiap phase bisa di-deploy sendiri
4. **Realistic** — Time estimates termasuk debugging
5. **Complete** — Cover semua gaps dari analisis

Jangan lupa:
- **Security first** — Fix hardcoded secrets sebelum deploy
- **Test first** — Verify existing tests sebelum tambah fitur baru
- **Document first** — Update docs sebelum tag v1.0.0
