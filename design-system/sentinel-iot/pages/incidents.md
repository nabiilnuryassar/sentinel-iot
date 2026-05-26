# Incidents Page Overrides

> **PROJECT:** Sentinel-IoT
> **Generated:** 2026-05-22 13:22:59
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1200px (standard)
- **Layout:** Full-width sections, centered content
- **Sections:** 1. Hero (date/location/countdown), 2. Speakers grid, 3. Agenda/schedule, 4. Sponsors, 5. Register CTA

### Spacing Overrides

- No overrides — use Master spacing

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- **Strategy:** Urgency colors (countdown). Event branding. Speaker cards professional. Sponsor logos neutral.

### Component Overrides

- Avoid: Let images/content push layout around
- Avoid: Stack multiple fixed elements carelessly
- Avoid: Expect z-index to work across contexts

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Deal movement animations, metric updates, leaderboard ranking changes, gauge needle movements, status change highlights
- Layout: Reserve space for async content
- Layout: Account for safe areas and other fixed elements
- Layout: Understand what creates new stacking context
- CTA Placement: Register CTA sticky + After speakers + Bottom
