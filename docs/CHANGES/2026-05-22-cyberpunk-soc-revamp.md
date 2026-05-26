# Cyberpunk SOC Dashboard Revamp

Date: 2026-05-22  
Area: frontend  
Type: feat  

## Context

The Sentinel-IoT console required a visual and functional overhaul to align with a cyberpunk Security Operations Center (SOC) theme. This includes glassmorphism cards, monitored devices gallery, API token rotation flow, Operator spotlight, rolling live threat feed, a fully-streaming ChatGPT-like agent interface, and quarantine action for fleet management.

## What changed

- **Frontend Pages Revamp:**
  - `resources/js/pages/dashboard.tsx`: Upgraded components to use frosted-dark glassmorphism containers (`.sentinel-surface`), added inline sparklines, dynamic status pulses, Sanctum token rotation banner, operator shift schedules, and triage workflow buttons.
  - `resources/js/pages/agent/index.tsx`: Rebuilt AI chat module to stream tokens using native `fetch` + `ReadableStream` from `/agent/stream`, added typing indicator dots, automatic scroll down, copy to clipboard, and prompt regeneration.
  - `resources/js/pages/devices/index.tsx` & `devices/show.tsx`: Styled device cards with neon glows on hover, and added quarantine toggle action.
  - `resources/js/pages/security-events/index.tsx`: Cleaned up warnings and updated with glass cards.
  - `resources/js/pages/incidents/index.tsx` & `incidents/show.tsx`: Improved visual hierarchies for incidents.
  - `resources/js/pages/telemetry/index.tsx`: Converted Recharts line paths to use neon-stroke palettes.
  - `resources/js/pages/auth/login.tsx`: Re-themed to look like an interactive green-on-dark hacker-terminal sign-in screen.
- **Backend API & Controllers:**
  - `app/Http/Controllers/TokenController.php`: Handles rotation of Sanctum bot API token and updates `.env`.
  - `app/Http/Controllers/DeviceController.php`: Toggles device quarantine status.
  - `routes/web.php`: Registered new endpoint routes.
  - `app/Listeners/LogAgentMessageCompletion.php`: Stub event listener logging AI agent completed messages.
- **Tests:**
  - `tests/Feature/TokenRotationTest.php`: Simulates token rotation and checks `.env` update mock.
  - `tests/Feature/DeviceQuarantineTest.php`: Tests the quarantine toggle route.

## Impact

- **Behavior changes:** Access to the terminal-like login page, dynamic streaming responses from the AI agent, and capability to quarantine devices and rotate Sanctum keys directly from the dashboard.
- **Compatibility notes:** Cleaned up Inertia v3 warnings by removing deprecated `preserveScroll` options from form handlers.

## How to test

- **Automated Tests:**
  `docker exec sentinel-laravel php artisan test --compact`
- **Lint and Compilation Verification:**
  - Type-checking: `npm run types:check`
  - Linter: `npm run lint:check`
  - Production build: `npm run build`

## Rollback plan

- Revert the files modified in this task.
- Restore the original database schema if needed, and reset the `LARAVEL_API_TOKEN` environment variable in `.env`.
