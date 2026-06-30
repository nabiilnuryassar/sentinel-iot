# GlobeHero Integration Prompt — Sentinel-IoT

> Copy this prompt when you need to integrate or adapt a 3D globe hero
> component (or similar Three.js visual) into the Sentinel-IoT codebase.

---

## Context

Sentinel-IoT is a **dark OLED + neon SOC console** for IoT fleet security.
The design system uses Tailwind v4 + shadcn/ui + Geist Variable font on
a `#050b16` deep-navy background with `#1fe6d0` (sentinel-teal) as the
primary accent.

**Stack:** Laravel 13, Inertia v3, React 19, TypeScript 5.9, motion
(formerly Framer Motion), Recharts, lucide-react.

**Project structure:**
```
resources/js/
  components/
    ui/              ← shadcn primitives + custom UI (globe-hero.tsx lives here)
    landing/         ← landing page domain components
  layouts/
  lib/               ← utils, format helpers
  pages/             ← Inertia pages (route-connected)
resources/css/
  app.css            ← design tokens (--sentinel-* palette, surface classes)
```

**Design tokens** (all in `resources/css/app.css`):
```
--sentinel-bg-primary: #050b16      ← page background
--sentinel-bg-card:    #0b1b2e      ← card / surface
--sentinel-teal:       #1fe6d0      ← primary accent, focus ring, glow
--sentinel-cyan:       #38bdf8      ← info, links
--sentinel-purple:     #a855f7      ← AI / agent
--sentinel-emerald:    #10b981      ← healthy, success
--sentinel-amber:      #f59e0b      ← warning
--sentinel-red:        #ef4444      ← offline, critical
--sentinel-rose:       #f43f5e      ← alert critical
```

**CSS component classes:**
- `.sentinel-surface` — translucent card with blur + inset highlight
- `.sentinel-grid-bg` — terminal-style 32px grid lines (teal, 3.5% opacity)
- `.sentinel-glow-teal` / `.sentinel-glow-red` — accent halos

**Typography:**
- Body/UI: Geist Variable (`@fontsource-variable/geist`)
- Mono/captions/terminal: `font-mono` (system ui-monospace stack)
- Use mono for section captions (`// capabilities`), stat readouts, code/IDs

---

## Integration Steps

### 0. Install dependencies (if not already present)

```bash
pnpm add three @react-three/drei @react-three/fiber
pnpm add -D @types/three
```

Verify motion (formerly framer-motion) is installed:
```bash
grep '"motion"' package.json || pnpm add motion
```

### 1. Place the component

```text
resources/js/components/ui/globe-hero.tsx    ← the reusable GlobeHero component
```

This goes in the shadcn `ui/` directory because it is a generic UI primitive
(wraps a Three.js canvas + children), not a domain-specific component.

### 2. Create a demo / integration page

```text
resources/js/pages/globe-hero-demo.tsx       ← Inertia page for preview / testing
```

To serve this page, add a route in `routes/web.php`:
```php
Route::inertia('/globe-demo', 'globe-hero-demo')->name('globe-demo');
```

### 3. Key adaptations for Sentinel-IoT

When adapting a generic globe component, apply these changes:

| Generic pattern                  | Sentinel-IoT replacement                                          |
|----------------------------------|-------------------------------------------------------------------|
| `framer-motion` import           | `import { motion } from "motion/react"`                           |
| `bg-background` (generic)        | Keep — maps to `--sentinel-bg-primary` (`#050b16`)                |
| `text-primary`                   | `text-sentinel-teal`                                              |
| `bg-primary/20`                  | `bg-sentinel-teal/20`                                             |
| `text-primary-foreground`        | `text-[#020617]` (dark text on teal)                              |
| `font-family: Inter`             | Use `font-mono` for headlines, Geist Variable for body            |
| Generic gradient `from-primary`  | `from-sentinel-teal via-sentinel-cyan to-sentinel-purple`          |
| Globe wireframe `color` prop     | `"#1fe6d0"` (hardcoded sentinel-teal, not CSS var in WebGL)       |
| `h-screen`                       | `h-[100dvh]` (prevents iOS Safari jump)                           |
| Framer Motion `useReducedMotion` | `import { useReducedMotion } from "motion/react"` — same API      |
| Generic button CTA               | Use `<Link href="/login">` with sentinel-teal bg + shadow glow    |
| "Global Network" / generic copy  | Sentinel SOC copy: "Live · operational", "Defend every connected device." |
| Emoji as decorative dots         | `<span className="size-1.5 rounded-full bg-sentinel-emerald" />`  |

### 4. Motion / reduced-motion contract

Every `motion.div` must gate its `initial` prop on `useReducedMotion()`:

```tsx
const reduce = useReducedMotion();

<motion.div
  initial={reduce ? false : { opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
>
```

When `reduce` is true: no entrance animation, no hover scale. The
Three.js globe rotation has no reduced-motion gate (it is ambient
background, not user-triggered motion); if you want to gate it, swap
`rotationSpeed` to `0` when `reduce` is true.

### 5. Typography rules (Section 4.1 / taste-skill)

- Headlines: `font-mono` (matching the existing hero "Defend every connected device.")
- Hero font scale: `text-4xl sm:text-5xl lg:text-6xl` (8-word headline → don't start at 7xl)
- Subtext: max 20 words, max 4 lines, `text-muted-foreground`
- Eyebrow/status pill: `font-mono uppercase tracking-[0.18em]`
- No serif (not justified for SOC dashboard)
- No em-dashes anywhere — use comma or restructure

### 6. Color consistency lock

One accent color across the whole page: `sentinel-teal` (`#1fe6d0`).
Supporting accents (cyan, purple) are used only for the gradient text
effect in the hero headline — they do not replace teal as the primary.

The globe wireframe must be teal. Do not use a generic white or
blue-grey wireframe.

### 7. Button contrast check

Primary CTA: bg `#1fe6d0` + text `#020617` → contrast ratio ~10.4:1 (AAA).
Secondary CTA: `bg-card/40` + `text-foreground` on dark bg → 4.5:1+ (AA).

### 8. Performance considerations

Three.js adds ~237KB gzipped to the bundle. The demo page (`globe-hero-demo.tsx`)
is lazy-loaded by Inertia (per-route code splitting). The globe canvas does
not block LCP because it renders behind the content layer.

For production landing pages, consider:
- Dynamic `import()` for the GlobeHero component
- `Suspense` boundary with a static fallback
- `devicePixelRatio` capping on the Canvas (`dpr={[1, 1.5]}`)

### 9. Em-dash audit (mandatory)

Zero em-dashes (`—`) in user-visible text. Check:
- Headlines
- Eyebrows / status pills
- Button labels
- Body copy
- Tooltips / alt text

Replace with comma, period, or regular hyphen.

---

## File Reference

```text
resources/js/components/ui/globe-hero.tsx     ← reusable 3D globe wrapper
resources/js/pages/globe-hero-demo.tsx        ← demo page with SOC-themed copy
resources/js/components/landing/feature-card.tsx  ← bento feature cards (companion)
resources/js/components/landing/metric-ticker.tsx ← animated counter (companion)
resources/css/app.css                         ← all --sentinel-* tokens
docs/UI_GUIDE.md                              ← full component / token map
docs/design/DESIGN.md                         ← design system specification
```

---

## Pre-Flight Checklist (from taste-skill Section 14)

Before shipping a globe hero page, verify:

- [ ] Zero em-dashes in all user-visible strings
- [ ] Globe wireframe color is `#1fe6d0` (sentinel-teal), not generic white
- [ ] Headline uses `font-mono`, not serif or Inter
- [ ] `h-[100dvh]` instead of `h-screen`
- [ ] CTA buttons pass contrast check (teal bg + dark text ≥ 3:1)
- [ ] `useReducedMotion()` wraps all entrance animations
- [ ] Status pill / eyebrow max 1 per 3 sections
- [ ] Page title uses `·` separator, not `—` (`<Head title="Sentinel-IoT · ..." />`)
- [ ] `npm run types:check` passes
- [ ] `npm run build` passes
