# Sentinel-IoT Design System Execution Plan

> Source design reference: `docs/design/DESIGN.md`

## Goal

Mengeksekusi design system Sentinel-IoT sebagai UI dashboard **dark futuristic IoT Security Operations Center** yang konsisten, responsive, dan siap dipakai untuk demo. Rencana ini fokus pada frontend Inertia React + Tailwind v4 + shadcn/ui yang sudah ada di repository.

## Current Baseline

Repository sudah memiliki fondasi berikut:

- Laravel + Inertia React pages di `resources/js/pages`.
- Shared layout di `resources/js/layouts/app-layout.tsx`.
- Sidebar di `resources/js/components/app-sidebar.tsx`.
- shadcn/ui primitives di `resources/js/components/ui`.
- Domain components awal seperti `stat-card.tsx`, `status-pill.tsx`, `severity-badge.tsx`, `data-table.tsx`, dan `telemetry-chart.tsx`.
- Tailwind v4 token layer di `resources/css/app.css`.
- Halaman utama: dashboard, devices, telemetry, security events, incidents, dan agent console.

Planning ini berarti **migrasi visual bertahap**, bukan rewrite dari nol.

## Execution Principles

- Gunakan token design dari `DESIGN.md` sebagai sumber warna, radius, shadow, badge, dan layout.
- Pertahankan stack saat ini: Inertia React, Tailwind v4, shadcn/ui, lucide-react, TanStack Table, Recharts.
- Hindari dependency baru kecuali ada kebutuhan visual yang tidak bisa ditangani oleh package yang sudah ada.
- Dahulukan shared component dan token sebelum page-level polish.
- Setiap fase harus punya hasil visual yang bisa diuji di browser.
- Desktop dan mobile harus diverifikasi, terutama dashboard, table-to-card behavior, sidebar, dan bottom navigation.

## Target Architecture

```text
resources/css/app.css
  Design tokens, semantic colors, base background, glow utilities

resources/js/layouts/app-layout.tsx
  Desktop shell, mobile shell, content frame, responsive navigation

resources/js/components/app-sidebar.tsx
  Desktop SOC navigation and active states

resources/js/components/mobile-navigation.tsx
  Bottom navigation for mobile

resources/js/components/page-header.tsx
  Reusable title, subtitle, search/status/action area

resources/js/components/status-pill.tsx
resources/js/components/severity-badge.tsx
resources/js/components/environment-badge.tsx
  Semantic badge system

resources/js/components/stat-card.tsx
resources/js/components/metric-trend.tsx
resources/js/components/service-health-chip.tsx
  KPI and operational status components

resources/js/components/dashboard/*
  Dashboard-specific panels for telemetry, device health, MQTT, AI, incidents, ChatOps

resources/js/pages/*
  Page composition only; pages consume shared/domain components
```

## Phase 1 - Token Foundation

**Objective:** Mengubah visual foundation dari default shadcn neutral theme menjadi Sentinel-IoT dark SOC theme.

**Files:**

- Modify: `resources/css/app.css`
- Inspect: `resources/views/app.blade.php`
- Inspect: `vite.config.ts`

**Work:**

- Map `DESIGN.md` color palette ke CSS variables Tailwind v4:
  - `--background`, `--foreground`, `--card`, `--card-foreground`
  - `--primary`, `--accent`, `--muted`, `--border`, `--ring`
  - custom variables seperti `--sentinel-teal`, `--sentinel-cyan`, `--sentinel-purple`, `--sentinel-danger`
- Set dark theme as the default visual language through existing `<html class="dark">` behavior.
- Add reusable utility classes:
  - `.sentinel-surface`
  - `.sentinel-surface-active`
  - `.sentinel-surface-critical`
  - `.sentinel-glow-teal`
  - `.sentinel-glow-red`
  - `.sentinel-grid-bg`
- Keep `Geist Variable` as current primary font because it is already installed and close to the design direction.

**Acceptance Criteria:**

- Semua card dan page background berubah ke deep navy design.
- Text contrast tetap readable.
- Tidak ada area putih default di halaman authenticated.
- `npm run build` berhasil.

**Verification:**

```bash
npm run build
npm run types:check
```

## Phase 2 - App Shell and Navigation

**Objective:** Membuat shell desktop/mobile sesuai SOC dashboard structure.

**Files:**

- Modify: `resources/js/layouts/app-layout.tsx`
- Modify: `resources/js/components/app-sidebar.tsx`
- Create: `resources/js/components/mobile-navigation.tsx`
- Create: `resources/js/components/page-header.tsx`

**Work:**

- Convert `AppLayout` menjadi responsive shell:
  - Desktop: fixed sidebar `260px`, main content grid, sticky top area.
  - Mobile: no sidebar, compact top header, bottom navigation.
- Update `AppSidebar`:
  - Brand area: Sentinel-IoT + shield icon.
  - Menu: Dashboard, Devices, Telemetry, Security Events, Incidents, AI Agent.
  - Add optional future items as hidden/not-yet-routed only if routes exist later: Policy Center, Reports, Settings.
  - Active state menggunakan teal gradient + border.
- Add `PageHeader` untuk title, subtitle, environment badge, and quick statuses.
- Add `MobileNavigation` with Home, Devices, Incidents, Agent, Profile-compatible slot.

**Acceptance Criteria:**

- Sidebar tampil hanya di desktop/tablet besar.
- Bottom navigation tampil di mobile.
- Main content tidak overflow horizontal pada viewport kecil.
- Active route tetap jelas secara visual dan accessible.

**Verification:**

```bash
npm run build
npm run types:check
```

Manual browser check:

- `/dashboard`
- `/devices`
- `/security-events`
- `/incidents`
- `/agent`

## Phase 3 - Badge, Status, and KPI System

**Objective:** Menstandarkan semantic UI untuk status, severity, environment, KPI, dan trend.

**Files:**

- Modify: `resources/js/components/status-pill.tsx`
- Modify: `resources/js/components/severity-badge.tsx`
- Modify: `resources/js/components/stat-card.tsx`
- Create: `resources/js/components/environment-badge.tsx`
- Create: `resources/js/components/metric-trend.tsx`
- Create: `resources/js/components/service-health-chip.tsx`

**Work:**

- Align `SeverityBadge` ke design:
  - Low: cyan
  - Medium: amber
  - High: red
  - Critical: rose/red glow
- Extend `StatusPill` untuk status:
  - `online`, `healthy`, `warning`, `offline`, `unknown`, `connected`, `enabled`, `open`, `resolved`
- Update `StatCard` props toward `KpiCard` pattern:
  - `title`
  - `value`
  - `subtitle`
  - `trend`
  - `variant`
  - `icon`
- Keep backward compatibility while migrating existing usage.
- Add `EnvironmentBadge` for Production, Development, Testing.
- Add `MetricTrend` for up/down/neutral visual hints.

**Acceptance Criteria:**

- Severity tidak lagi memakai mapping yang bertentangan dengan `DESIGN.md`.
- Badge selalu punya text label, bukan color-only.
- KPI cards punya visual variant yang konsisten.
- Existing pages tetap compile.

**Verification:**

```bash
npm run build
npm run types:check
```

## Phase 4 - Dashboard SOC Composition

**Objective:** Mengubah dashboard menjadi first-screen SOC overview yang menjawab kondisi sistem dalam kurang dari 10 detik.

**Files:**

- Modify: `resources/js/pages/dashboard.tsx`
- Create: `resources/js/components/dashboard/dashboard-grid.tsx`
- Create: `resources/js/components/dashboard/mqtt-broker-status-card.tsx`
- Create: `resources/js/components/dashboard/device-health-card.tsx`
- Create: `resources/js/components/dashboard/security-score-card.tsx`
- Create: `resources/js/components/dashboard/security-events-panel.tsx`
- Create: `resources/js/components/dashboard/incident-panel.tsx`
- Create: `resources/js/components/dashboard/ai-agent-panel.tsx`
- Create: `resources/js/components/dashboard/telegram-chatops-panel.tsx`
- Create: `resources/js/components/dashboard/service-health-bar.tsx`

**Work:**

- Recompose dashboard in a 12-column desktop grid:
  - KPI summary row.
  - Realtime telemetry.
  - Device health.
  - Security score/risk.
  - MQTT broker status.
  - Recent security events.
  - Incident management.
  - AI Agent summary.
  - Telegram/ChatOps.
  - Service health footer.
- Use existing backend props where available.
- Use explicit demo fallback values only for UI sections whose backend data does not exist yet, and label them as UI demo data in code comments.
- Keep each dashboard panel small and focused.

**Acceptance Criteria:**

- First viewport shows system health, device counts, incident/risk state, and telemetry.
- Critical security information is not hidden below excessive decoration.
- Dashboard remains usable on mobile with stacked priority order.
- Charts remain readable on dark background.

**Verification:**

```bash
npm run build
npm run types:check
```

Manual browser check:

- Desktop width: `1440px`
- Tablet width: `1024px`
- Mobile width: `390px`

## Phase 5 - Operational Pages Polish

**Objective:** Menerapkan design system ke pages selain dashboard tanpa mengubah behavior backend.

**Files:**

- Modify: `resources/js/pages/devices/index.tsx`
- Modify: `resources/js/pages/devices/show.tsx`
- Modify: `resources/js/pages/telemetry/index.tsx`
- Modify: `resources/js/pages/security-events/index.tsx`
- Modify: `resources/js/pages/incidents/index.tsx`
- Modify: `resources/js/pages/incidents/show.tsx`
- Modify: `resources/js/pages/agent/index.tsx`
- Modify: `resources/js/components/data-table.tsx`
- Modify: `resources/js/components/telemetry-chart.tsx`

**Work:**

- Replace repeated page title markup with `PageHeader`.
- Apply sentinel card surfaces consistently.
- Improve table density for desktop.
- Add mobile-friendly list/card fallback where table columns become too narrow.
- Apply design-specific empty states and skeleton states.
- Update Agent Console to match AI panel language:
  - calm
  - professional
  - actionable
  - security-aware

**Acceptance Criteria:**

- Pages share the same shell, typography, spacing, and card language.
- Tables are readable on desktop and do not break mobile layout.
- AI Agent page visually feels connected to dashboard AI panel.
- No page uses raw default shadcn white/light surfaces.

**Verification:**

```bash
npm run build
npm run types:check
```

Manual browser check:

- Device list and detail.
- Telemetry chart page.
- Security events list.
- Incident list and detail.
- Agent console form and history.

## Phase 6 - Responsive and Accessibility Pass

**Objective:** Mengunci quality bar untuk mobile, contrast, touch target, motion, dan overflow.

**Files:**

- Modify: affected React pages/components from earlier phases.
- Modify: `resources/css/app.css` if accessibility utilities are needed.

**Work:**

- Verify breakpoint behavior:
  - Mobile: `<768px`
  - Tablet: `768px - 1024px`
  - Desktop: `>1024px`
- Ensure mobile touch targets are at least `44px`.
- Ensure critical icons include labels.
- Avoid excessive glow/pulse effects.
- Confirm text does not overlap or truncate badly.
- Confirm all form controls have accessible labels or clear context.

**Acceptance Criteria:**

- Mobile dashboard follows priority order from `DESIGN.md`.
- Desktop dashboard uses dense but readable layout.
- Severity and status remain understandable without relying only on color.
- No horizontal scroll on normal mobile viewport.

**Verification:**

```bash
npm run build
npm run types:check
```

Recommended browser checks:

- Open `/dashboard` at mobile and desktop widths.
- Confirm no console errors.
- Confirm no obvious text overlap.

## Phase 7 - Visual QA and Regression Checks

**Objective:** Memastikan design system siap demo dan tidak merusak behavior utama.

**Files:**

- No planned source edits unless QA finds issues.

**Work:**

- Run frontend checks.
- Run relevant Pest feature tests for pages/controllers.
- Visually inspect authenticated routes with seeded/demo data.
- Compare dashboard against `docs/design/desktop.png` and `docs/design/mobile.png` if those references are final.

**Verification Commands:**

```bash
npm run build
npm run types:check
php artisan test --compact tests/Feature/DashboardTest.php
php artisan test --compact tests/Feature/DeviceControllerTest.php
php artisan test --compact tests/Feature/SecurityEventControllerTest.php
php artisan test --compact tests/Feature/IncidentControllerTest.php
php artisan test --compact tests/Feature/AgentControllerTest.php
```

## Implementation Order

1. Token foundation.
2. App shell and navigation.
3. Badge, status, and KPI system.
4. Dashboard SOC composition.
5. Operational pages polish.
6. Responsive and accessibility pass.
7. Visual QA and regression checks.

This order keeps the blast radius controlled: shared design tokens first, then shell, then reusable semantic components, then pages.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Dashboard becomes too decorative | Readability drops | Limit glow to active, critical, and AI states only |
| Mobile layout becomes squeezed desktop | Poor mobile UX | Use stacked cards and bottom navigation |
| Existing tests fail due UI copy changes | Regression noise | Keep controller behavior unchanged and update tests only when assertions depend on intentional text changes |
| Missing backend data for new panels | UI blocked | Use explicit demo fallback values temporarily, then replace with backend props in a later data task |
| Token changes affect all shadcn components | Unexpected visual side effects | Apply token phase first and inspect all existing pages before deeper component work |

## Definition of Done

Design system execution is complete when:

- `resources/css/app.css` contains Sentinel-IoT tokens aligned with `DESIGN.md`.
- Shared shell supports desktop sidebar and mobile bottom navigation.
- Status, severity, KPI, and environment components use consistent semantic variants.
- Dashboard presents SOC overview with KPI, telemetry, health, MQTT, security events, incidents, AI, ChatOps, and service health sections.
- Core operational pages use the same visual language.
- `npm run build` and `npm run types:check` pass.
- Relevant Pest feature tests pass.
- Manual visual check passes on desktop and mobile.

## Out of Scope

- Backend schema changes.
- New authentication or authorization behavior.
- New AI Agent tools.
- New MQTT ingestion behavior.
- New charting library.
- Production-grade realtime streaming.
