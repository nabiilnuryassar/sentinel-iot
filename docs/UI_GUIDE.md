# Sentinel-IoT — UI Guide

> Companion to `design-system/sentinel-iot/MASTER.md`. The MASTER file is
> the generated source of truth; this guide is the human-friendly
> orientation for contributors.

## Aesthetic

Dark OLED + neon. The vibe is "SOC terminal, not enterprise dashboard":
mono captions, neon teal/cyan accents, glowing focus states, subtle grid
backgrounds. Cyberpunk treatment, but the content is IoT security
operations — never DeFi, never speculative.

## Color tokens

All tokens live in `resources/css/app.css`. Use the semantic vars; the
raw `--sentinel-*` palette is a fallback.

| Token                  | Hex / role                              |
|------------------------|-----------------------------------------|
| `--sentinel-bg-primary`| `#050b16` (page background)             |
| `--sentinel-bg-card`   | `#0b1b2e` (surface)                     |
| `--sentinel-teal`      | `#1fe6d0` (primary action / focus ring) |
| `--sentinel-cyan`      | `#38bdf8` (info)                        |
| `--sentinel-blue`      | `#3b82f6` (chart)                       |
| `--sentinel-purple`    | `#a855f7` (AI)                          |
| `--sentinel-emerald`   | `#10b981` (healthy / success)           |
| `--sentinel-amber`     | `#f59e0b` (warning)                     |
| `--sentinel-orange`    | `#fb923c` (risk)                        |
| `--sentinel-red`       | `#ef4444` (offline / blocker)           |
| `--sentinel-rose`      | `#f43f5e` (critical)                    |

Surface helpers in `@layer components`:

- `.sentinel-surface` — translucent card with subtle glow shadow.
- `.sentinel-surface-active` — primary-tinted variant for active rows.
- `.sentinel-surface-critical` — red-tinted, for critical alerts.
- `.sentinel-grid-bg` — terminal-style grid background.
- `.sentinel-glow-teal` / `.sentinel-glow-red` — accent halos.

## Typography

- **Body / UI**: Geist Variable (loaded by `@fontsource-variable/geist`).
- **Mono / captions / terminals**: `font-mono` (Tailwind default — system
  ui-monospace stack). We deliberately do not import a remote mono font
  to avoid blocking on first paint.

Use mono for:

- Section captions like `// capabilities`.
- Stat values that should look like dashboard readouts.
- Code, IDs, IP/topic strings.

## Component map

| Component                     | When to use                                      |
|-------------------------------|--------------------------------------------------|
| `PageHeader`                  | Every page top — title, subtitle, action slot.   |
| `StatCard`                    | Headline metrics row (dashboard, summaries).     |
| `StatusPill`                  | online / offline / open / mitigated, etc.        |
| `SeverityBadge`               | low / medium / high / critical.                  |
| `TelemetryChart`              | Recharts wrapper with neon strokes.              |
| `DataTable`                   | All tabular pages.                               |
| `MarkdownView`                | Agent responses, incident reports.               |
| `EnvironmentBadge`            | Environment ribbon in header.                    |
| shadcn `ui/*` primitives       | Buttons, dialogs, selects — never re-skin.      |

## Page conventions

1. Wrap in `<AppLayout>`.
2. First child is `PageHeader` (mobile pages may use a custom mobile
   header; see `dashboard.tsx` for the dual-render pattern).
3. Group page sections with `<section aria-label="...">` for screen
   readers.
4. Empty / loading / error states use `Skeleton` and `sonner` toasts.

## Realtime chat (agent)

The agent console (`resources/js/pages/agent/index.tsx`) is a
single-screen chat. Key UX rules:

- **Streaming**: tokens render as they arrive over SSE.
- **Typing indicator** when `state === 'pending'` or empty `streaming`.
- **Tool pill** appears next to the assistant bubble when a tool fires.
- **Copy** and **Regenerate** appear on hover for completed assistant
  bubbles.
- **Stop** replaces the Send button while streaming and aborts the
  fetch.
- Quick-prompt chips below the textarea offer a fast start.

The Inertia page receives `stream_url` as a prop (server-side route
resolution) and uses native `fetch` + `ReadableStream` — no axios, no
Echo.

## Accessibility

- Touch targets ≥ 44px on mobile (`min-h-10` plus padding).
- Visible focus rings on all interactive elements (`focus-visible:ring`).
- Icon-only buttons have `aria-label`.
- Honor `prefers-reduced-motion` for any animated counters or scan lines.
- Color contrast — pair `text-muted-foreground` only with surfaces that
  hold 4.5:1 against the muted shade.

## Responsive breakpoints

We verify pages at 375 / 768 / 1024 / 1440. Tailwind `sm/md/lg/xl` cover
this. The sidebar collapses below `lg` and the bottom nav takes over.

## What not to do

- No emoji as icons (`lucide-react` only).
- No hand-rolled URLs — go through Wayfinder (`@/routes/...`,
  `@/actions/...`) or a server-passed prop (e.g. `stream_url`).
- No new color systems — extend `--sentinel-*` if a new accent is needed.
- No new third-party UI libs without explicit approval.
- No animations that can't respect `prefers-reduced-motion`.
