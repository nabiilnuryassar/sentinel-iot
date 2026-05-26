````markdown
# DESIGN.md — Sentinel-IoT UI/UX Design System

## 1. Project Name

**Sentinel-IoT**

## 2. Design Theme

**Futuristic IoT Security Operations Center**

Sentinel-IoT menggunakan desain visual bergaya **dark futuristic enterprise dashboard** yang menggabungkan elemen:

- Cybersecurity dashboard
- IoT monitoring platform
- SOC / Security Operation Center
- AI Agent assistant console
- Telegram ChatOps interface
- Real-time telemetry observability

Desain dibuat agar terlihat:

- High class
- Modern
- Futuristic
- Professional
- Enterprise-grade
- Readable
- Cocok untuk dashboard web dan mobile responsive

---

# 3. Design Goals

## 3.1 Primary Goals

1. Memberikan tampilan dashboard yang mudah dipahami oleh admin.
2. Menampilkan status IoT, security event, incident, dan AI recommendation secara cepat.
3. Menciptakan pengalaman seperti SOC platform profesional.
4. Memisahkan informasi normal, warning, critical, dan AI insight secara visual.
5. Mendukung tampilan desktop dan mobile responsive.
6. Menampilkan kesan teknologi tinggi tanpa mengorbankan readability.

## 3.2 User Experience Goals

Admin harus bisa memahami dalam waktu kurang dari 10 detik:

- Apakah sistem sehat?
- Berapa device aktif?
- Apakah ada incident?
- Apakah MQTT broker aman?
- Apa rekomendasi AI Agent?
- Apakah ada alert dari Telegram/ChatOps?

---

# 4. Visual Direction

## 4.1 Style Keywords

```text
Dark
Futuristic
Cybersecurity
Premium
Glassmorphism
Enterprise
SOC Dashboard
Neon Accent
Minimal but Dense
Readable
High Contrast
```
````

## 4.2 UI Character

Sentinel-IoT harus terasa seperti:

```text
Datadog + Security SOC + IoT Dashboard + AI Copilot
```

Dengan nuansa:

- Dark navy background
- Glowing teal/cyan accents
- Card-based layout
- Rounded panels
- Compact enterprise data density
- Status chips
- Micro-interactions
- AI assistant panel
- Security severity color system

---

# 5. Color Palette

## 5.1 Primary Colors

| Token                 | Color              |       Hex | Usage                     |
| --------------------- | ------------------ | --------: | ------------------------- |
| `color-bg-primary`    | Deep Navy Black    | `#050B16` | Main app background       |
| `color-bg-secondary`  | Dark Navy          | `#071426` | Sidebar, large containers |
| `color-bg-card`       | Midnight Card      | `#0B1B2E` | Card background           |
| `color-bg-card-hover` | Elevated Navy      | `#10243A` | Hover state               |
| `color-border-subtle` | Subtle Border      | `#1C334F` | Default card border       |
| `color-border-active` | Active Teal Border | `#1FE6D0` | Active/selected border    |

## 5.2 Accent Colors

| Token                  | Color         |       Hex | Usage                         |
| ---------------------- | ------------- | --------: | ----------------------------- |
| `color-accent-teal`    | Neon Teal     | `#1FE6D0` | Primary accent, active states |
| `color-accent-cyan`    | Electric Cyan | `#38BDF8` | Telemetry, links, highlights  |
| `color-accent-blue`    | Cyber Blue    | `#3B82F6` | Data flow, charts             |
| `color-accent-purple`  | AI Purple     | `#A855F7` | AI Agent, recommendations     |
| `color-accent-emerald` | Success Green | `#10B981` | Healthy, online, success      |
| `color-accent-amber`   | Warning Amber | `#F59E0B` | Warning, medium severity      |
| `color-accent-orange`  | Risk Orange   | `#FB923C` | Risk level, CVSS              |
| `color-accent-red`     | Critical Red  | `#EF4444` | High severity, incidents      |
| `color-accent-rose`    | Alert Rose    | `#F43F5E` | Critical alert glow           |

## 5.3 Text Colors

| Token                  | Color          |       Hex | Usage                |
| ---------------------- | -------------- | --------: | -------------------- |
| `color-text-primary`   | Soft White     | `#F8FAFC` | Primary text         |
| `color-text-secondary` | Slate Light    | `#CBD5E1` | Secondary text       |
| `color-text-muted`     | Muted Slate    | `#94A3B8` | Labels, helper text  |
| `color-text-disabled`  | Disabled Slate | `#64748B` | Disabled state       |
| `color-text-inverse`   | Dark Text      | `#020617` | Text on bright chips |

## 5.4 Severity Colors

| Severity |      Text |              Background |                  Border | Usage               |
| -------- | --------: | ----------------------: | ----------------------: | ------------------- |
| Low      | `#38BDF8` | `rgba(56,189,248,0.12)` | `rgba(56,189,248,0.35)` | Informational issue |
| Medium   | `#F59E0B` | `rgba(245,158,11,0.12)` | `rgba(245,158,11,0.35)` | Warning issue       |
| High     | `#EF4444` |  `rgba(239,68,68,0.14)` |   `rgba(239,68,68,0.4)` | Serious incident    |
| Critical | `#F43F5E` |  `rgba(244,63,94,0.18)` |   `rgba(244,63,94,0.5)` | Critical incident   |

## 5.5 Status Colors

| Status           | Color   |       Hex |
| ---------------- | ------- | --------: |
| Online / Healthy | Emerald | `#10B981` |
| Warning          | Amber   | `#F59E0B` |
| Offline          | Red     | `#EF4444` |
| Unknown          | Slate   | `#64748B` |
| Processing       | Cyan    | `#38BDF8` |
| AI Active        | Purple  | `#A855F7` |

---

# 6. Typography

## 6.1 Font Recommendation

Recommended fonts:

```text
Primary: Inter
Secondary: Geist Sans
Monospace: JetBrains Mono
```

Fallback:

```css
font-family:
    Inter,
    Geist,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
```

Monospace:

```css
font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
```

## 6.2 Type Scale

| Token       | Size |    Weight | Usage                |
| ----------- | ---: | --------: | -------------------- |
| `text-xs`   | 12px | 400 / 500 | Labels, table meta   |
| `text-sm`   | 14px | 400 / 500 | Body, nav items      |
| `text-base` | 16px | 400 / 500 | Main content         |
| `text-lg`   | 18px |       600 | Card title           |
| `text-xl`   | 20px | 600 / 700 | Section title        |
| `text-2xl`  | 24px |       700 | Dashboard page title |
| `text-3xl`  | 30px | 700 / 800 | Hero numbers         |
| `text-4xl`  | 36px |       800 | Major KPI value      |

## 6.3 Typography Rules

- Use **large numbers** for KPI cards.
- Use muted text for labels and descriptions.
- Use monospace for:
    - device ID
    - incident ID
    - MQTT topic
    - client ID
    - timestamps

- Avoid all-caps except for small badges.
- Keep line height comfortable:
    - body: `1.5`
    - card titles: `1.25`
    - KPI values: `1.1`

---

# 7. Layout System

## 7.1 Desktop Layout

Desktop dashboard uses:

```text
Left Sidebar + Top Header + Main Content Grid
```

Recommended structure:

```text
┌──────────────────────────────────────────────┐
│ Sidebar │ Header                             │
│         ├────────────────────────────────────│
│         │ KPI Cards                          │
│         │ Charts + Status Panels             │
│         │ Tables + Incident + AI Console     │
│         │ Service Health Footer              │
└──────────────────────────────────────────────┘
```

## 7.2 Desktop Grid

Use a 12-column grid.

```css
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 16px;
}
```

Recommended layout:

| Section             |                   Grid Span |
| ------------------- | --------------------------: |
| Sidebar             |                 Fixed 260px |
| KPI cards           | 2 columns each / responsive |
| Realtime chart      |                 5–6 columns |
| Device health       |                 2–3 columns |
| Security score      |                 2–3 columns |
| MQTT status         |                   3 columns |
| Device table        |                 5–6 columns |
| Security events     |                   3 columns |
| Incident management |                   3 columns |
| AI console          |                   3 columns |
| Telegram panel      |                   3 columns |

## 7.3 Mobile Layout

Mobile layout uses stacked card design:

```text
Header
Environment status
KPI grid 2 columns
Realtime telemetry
Device health
Security score
MQTT broker status
Bottom navigation
```

Recommended breakpoint:

```text
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
```

## 7.4 Spacing Scale

| Token      | Value |
| ---------- | ----: |
| `space-1`  |   4px |
| `space-2`  |   8px |
| `space-3`  |  12px |
| `space-4`  |  16px |
| `space-5`  |  20px |
| `space-6`  |  24px |
| `space-8`  |  32px |
| `space-10` |  40px |

Recommended:

- Card padding desktop: `20px`
- Card padding mobile: `14px - 16px`
- Section gap desktop: `16px - 24px`
- Section gap mobile: `12px - 16px`

---

# 8. Border Radius

| Token         | Value | Usage           |
| ------------- | ----: | --------------- |
| `radius-sm`   |   6px | Small chips     |
| `radius-md`   |  10px | Inputs, buttons |
| `radius-lg`   |  14px | Cards           |
| `radius-xl`   |  18px | Large panels    |
| `radius-2xl`  |  24px | Hero containers |
| `radius-full` | 999px | Pills, avatar   |

Recommended card radius:

```css
border-radius: 18px;
```

---

# 9. Shadows & Glow

## 9.1 Base Shadow

```css
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
```

## 9.2 Card Inner Glow

```css
box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 16px 40px rgba(0, 0, 0, 0.35);
```

## 9.3 Accent Glow

Teal:

```css
box-shadow: 0 0 24px rgba(31, 230, 208, 0.22);
```

Red:

```css
box-shadow: 0 0 24px rgba(239, 68, 68, 0.22);
```

Purple:

```css
box-shadow: 0 0 24px rgba(168, 85, 247, 0.22);
```

Use glow sparingly. Only for:

- Active navigation
- Critical risk
- AI Agent online indicator
- Selected tabs
- Important alert card

---

# 10. Glassmorphism Style

## 10.1 Card Background

```css
background: linear-gradient(
    180deg,
    rgba(15, 35, 58, 0.82),
    rgba(7, 20, 38, 0.88)
);
border: 1px solid rgba(148, 163, 184, 0.14);
backdrop-filter: blur(16px);
```

## 10.2 Active Card Border

```css
border: 1px solid rgba(31, 230, 208, 0.45);
```

## 10.3 Critical Card Border

```css
border: 1px solid rgba(239, 68, 68, 0.5);
background: linear-gradient(
    180deg,
    rgba(127, 29, 29, 0.28),
    rgba(15, 23, 42, 0.84)
);
```

---

# 11. Icons

## 11.1 Recommended Icon Library

Use:

```text
Lucide Icons
Heroicons
Tabler Icons
```

Recommended if using React:

```bash
lucide-react
```

Recommended if using Laravel Blade:

```text
Blade Icons
Heroicons
Phosphor Icons
```

## 11.2 Icon Style

Icons should be:

- Stroke-based
- 1.5px to 2px stroke
- Rounded line caps
- Minimal and geometric
- Consistent size

## 11.3 Icon Mapping

| Module          | Icon                      |
| --------------- | ------------------------- |
| Dashboard       | Grid / LayoutDashboard    |
| Devices         | Server / Cpu / Smartphone |
| Telemetry       | Activity / LineChart      |
| Security Events | ShieldAlert               |
| Incidents       | TriangleAlert             |
| AI Agent        | Bot / BrainCircuit        |
| Policy Center   | ShieldCheck               |
| Reports         | FileText / BarChart       |
| Settings        | Settings                  |
| MQTT Broker     | RadioTower / Wifi         |
| Database        | Database                  |
| Telegram        | Send / MessageCircle      |
| Risk            | ShieldX / Gauge           |
| Online          | CircleCheck               |
| Offline         | CircleX                   |
| Warning         | OctagonAlert              |

---

# 12. Component System

## 12.1 App Shell

### Desktop

Components:

- Sidebar
- Header
- Main content area
- Service health footer

```text
AppShell
├── Sidebar
├── TopHeader
├── MainContent
└── ServiceStatusBar
```

### Mobile

Components:

- Mobile header
- Stacked content
- Bottom navigation

```text
MobileShell
├── MobileHeader
├── MobileContent
└── BottomNavigation
```

---

## 12.2 Sidebar

### Purpose

Primary navigation for desktop dashboard.

### Structure

```text
Logo
Navigation Menu
System Time Card
```

### Menu Items

```text
Dashboard
Devices
Telemetry
Security Events
Incidents
AI Agent Console
Policy Center
Reports
Settings
```

### Active State

```css
background: linear-gradient(
    90deg,
    rgba(31, 230, 208, 0.22),
    rgba(56, 189, 248, 0.08)
);
border: 1px solid rgba(31, 230, 208, 0.35);
color: #1fe6d0;
```

---

## 12.3 Top Header

### Elements

- Page title
- Subtitle
- Global search
- Environment badge
- Quick system status
- User profile

### Example Header Content

```text
Sentinel-IoT Dashboard
IoT Security Operations Center

Search devices, topics, incidents...
Production
MQTT Broker: Healthy
AI Agent: Online
Telegram Bot: Connected
Admin
```

---

## 12.4 KPI Summary Card

### Purpose

Displays key metrics.

### KPI Cards

1. Total Devices
2. Online Devices
3. Open Incidents
4. Security Events Today
5. Risk Level
6. AI Recommendations

### Structure

```text
Icon
Label
Value
Trend / Subtitle
Optional action button
```

### Example

```text
Total Devices
1,248
↑ 12.5% vs last 7 days
```

### Variants

| Variant | Accent  |
| ------- | ------- |
| Info    | Blue    |
| Success | Emerald |
| Warning | Amber   |
| Danger  | Red     |
| AI      | Purple  |
| Risk    | Orange  |

---

## 12.5 Realtime Telemetry Chart

### Purpose

Shows current telemetry trend.

### Chart Data

- Temperature
- Humidity
- Battery

### Recommended Chart

- Multi-line chart
- Smooth line
- No heavy grid
- Dark transparent background
- Right-side latest values

### Colors

```text
Temperature: #1FE6D0
Humidity: #3B82F6
Battery: #A855F7
```

---

## 12.6 Device Health Donut

### Purpose

Shows overall device health.

### Segments

- Healthy
- Warning
- Offline

### Colors

```text
Healthy: #10B981
Warning: #F59E0B
Offline: #EF4444
```

### Center Text

```text
1,248
Total
```

---

## 12.7 Security Score Gauge

### Purpose

Shows overall security posture.

### Score Range

```text
0 - 100
```

### Score Meaning

|  Score | Label     | Color   |
| -----: | --------- | ------- |
|   0–39 | Poor      | Red     |
|  40–59 | Risky     | Orange  |
|  60–79 | Good      | Teal    |
| 80–100 | Excellent | Emerald |

### Example

```text
78 / 100
Good
```

---

## 12.8 MQTT Broker Status Card

### Purpose

Shows broker health and security configuration.

### Fields

```text
Status
Auth
ACL
Broker Logs
Port 1883 TCP
Port 8883 TLS
```

### Example

```text
Status: Healthy
Auth: Enabled
ACL: Enabled
Broker Logs: No Errors
Port 1883: Open
Port 8883: Open
```

---

## 12.9 Device Status Table

### Purpose

Displays device status in a compact operational view.

### Columns

```text
Device ID
Type
Status
Last Seen
Battery
Signal RSSI
Actions
```

### Example Rows

```text
temp-sensor-001
door-lock-001
power-meter-001
air-quality-001
water-leak-001
```

### Status Badge

| Status  | Color |
| ------- | ----- |
| Online  | Green |
| Warning | Amber |
| Offline | Red   |

---

## 12.10 Security Events Panel

### Purpose

Shows recent security events.

### Event Types

```text
Malformed payload detected
Unauthorized publish attempt
Topic spoofing detected
Device offline
Failed login attempt
Weak password detected
```

### Event Item Structure

```text
Icon
Event title
Affected device/client
Timestamp
Severity badge
```

---

## 12.11 Incident Management Panel

### Purpose

Shows active incidents and status.

### Incident Item Structure

```text
Incident ID
Title
Affected entity
Status
Severity
Timestamp
```

### Example

```text
INC-2025-0519-007
Unauthorized access attempt
temp-sensor-001
Open • High
09:41
```

### Incident Status

| Status        | Color |
| ------------- | ----- |
| Open          | Red   |
| Investigating | Amber |
| Resolved      | Green |
| Closed        | Slate |

---

## 12.12 AI Agent Console

### Purpose

Displays AI Agent summary, recommendations, and interaction input.

### Header

```text
AI Agent Console
OpenClaw / Hermes-style Agent
Online
```

### Sections

1. System posture summary
2. Top recommendations
3. Quick actions
4. Chat input

### Example Summary

```text
System posture is High risk.
7 open incidents detected with 3 critical.
Recommend immediate review of unauthorized access attempts and topic spoofing events.
```

### Recommendation Item

```text
Isolate device temp-sensor-001
Severity: High
```

### Input Placeholder

```text
Ask OpenClaw anything...
```

---

## 12.13 Telegram / ChatOps Panel

### Purpose

Shows Telegram command and alert history.

### Content

```text
/status
/audit temp-sensor-001
Alert: Unauthorized access attempt
```

### Status

```text
Connected
```

### Message Types

| Type    | Color |
| ------- | ----- |
| Command | Blue  |
| Alert   | Red   |
| System  | Teal  |
| Success | Green |

---

## 12.14 Service Health Footer

### Purpose

Displays backend services health.

### Services

```text
Laravel App
Mosquitto MQTT Broker
AI Agent Service
Telegram Bot Gateway
InfluxDB
PostgreSQL
```

### Structure

```text
Service Icon
Service Name
Version
Status chip
```

### Example

```text
Laravel App
v10.15.0
Healthy
```

---

# 13. Mobile Design

## 13.1 Mobile Screens

The mobile responsive design includes three core screens:

1. Dashboard
2. Incidents
3. AI Agent / ChatOps

## 13.2 Mobile Navigation

Use bottom navigation.

### Items

```text
Home
Devices
Incidents
Agent
Profile
```

### Active State

- Teal icon
- Teal label
- Small glow background

## 13.3 Mobile Header

### Dashboard Header

```text
Sentinel-IoT
IoT Security Operations Center
Notification icon
```

### Incidents Header

```text
Incidents & Security
Monitor • Detect • Respond
Filter icon
```

### AI Agent Header

```text
AI Agent / ChatOps
OpenClaw • Hermes-style Agent
Online badge
```

## 13.4 Mobile Dashboard Layout

```text
Header
Environment status
KPI card grid
Realtime telemetry chart
Device health + security score
MQTT broker status
Bottom navigation
```

## 13.5 Mobile KPI Grid

Use 2-column cards.

```css
grid-template-columns: repeat(2, minmax(0, 1fr));
gap: 10px;
```

First row can include:

```text
Total Devices
Online Devices
Open Incidents
Security Events Today
Risk Level
AI Recommendations
```

## 13.6 Mobile Incidents Screen

Sections:

```text
Segmented tabs:
- Security Events
- Incidents

Filters:
- All
- High
- Medium
- Low

Security Events list
Incident timeline
Floating action button
```

## 13.7 Mobile AI Agent Screen

Sections:

```text
System Summary
Top Recommendations
Ask OpenClaw quick prompts
Telegram / ChatOps
Message input
```

---

# 14. Responsive Behavior

## 14.1 Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## 14.2 Desktop to Tablet

Desktop:

```text
Sidebar visible
Header horizontal
Multi-column grid
```

Tablet:

```text
Sidebar collapsible
KPI grid becomes 2–3 columns
Tables may become cards
Right panels stack below
```

Mobile:

```text
Sidebar removed
Bottom navigation shown
Cards stack vertically
Tables become list cards
Charts simplified
```

## 14.3 Table to Card Conversion

Desktop device table:

```text
Device ID | Type | Status | Last Seen | Battery | RSSI
```

Mobile device card:

```text
temp-sensor-001
Sensor • Online
Battery 78% • RSSI -42 dBm
Last seen 9 sec ago
```

---

# 15. Interaction Design

## 15.1 Hover States

Desktop cards:

```css
transform: translateY(-2px);
border-color: rgba(31, 230, 208, 0.35);
```

## 15.2 Active States

Use teal glow and border.

```css
background: rgba(31, 230, 208, 0.12);
border-color: rgba(31, 230, 208, 0.45);
```

## 15.3 Alert Interaction

Critical alert cards should pulse subtly.

```css
@keyframes alertPulse {
    0% {
        box-shadow: 0 0 0 rgba(239, 68, 68, 0);
    }
    50% {
        box-shadow: 0 0 24px rgba(239, 68, 68, 0.25);
    }
    100% {
        box-shadow: 0 0 0 rgba(239, 68, 68, 0);
    }
}
```

Use only for:

- New critical incident
- Unauthorized publish
- Broker offline

## 15.4 Loading States

Use skeleton loaders with dark shimmer.

```css
background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.08),
    rgba(148, 163, 184, 0.18),
    rgba(148, 163, 184, 0.08)
);
```

## 15.5 Empty States

Example:

```text
No security events detected.
System is currently healthy.
```

Use shield check icon and muted text.

---

# 16. Data Visualization Guidelines

## 16.1 Chart Style

- Use dark card background.
- Avoid heavy grid lines.
- Use thin grid with low opacity.
- Use neon accent lines.
- Show latest values clearly.
- Use tooltips with dark background.

## 16.2 Chart Colors

```text
Temperature: #1FE6D0
Humidity: #3B82F6
Battery: #A855F7
Security events: #EF4444
Device online: #10B981
Device warning: #F59E0B
Device offline: #EF4444
```

## 16.3 Tooltip Style

```css
background: #071426;
border: 1px solid rgba(31, 230, 208, 0.24);
border-radius: 10px;
color: #f8fafc;
```

---

# 17. Badge & Chip System

## 17.1 Status Chip

```text
Online
Healthy
Connected
Enabled
Open
No Errors
```

### Healthy Chip

```css
background: rgba(16, 185, 129, 0.12);
color: #10b981;
border: 1px solid rgba(16, 185, 129, 0.35);
```

### Warning Chip

```css
background: rgba(245, 158, 11, 0.12);
color: #f59e0b;
border: 1px solid rgba(245, 158, 11, 0.35);
```

### Danger Chip

```css
background: rgba(239, 68, 68, 0.14);
color: #ef4444;
border: 1px solid rgba(239, 68, 68, 0.4);
```

## 17.2 Environment Badge

Examples:

```text
Production
Development
Testing
```

Production:

```css
background: rgba(16, 185, 129, 0.12);
border: 1px solid rgba(16, 185, 129, 0.35);
color: #10b981;
```

---

# 18. Content Guidelines

## 18.1 Language

Use English for technical dashboard labels or mixed technical Indonesian depending on project requirement.

Recommended dashboard language:

```text
English UI labels with Indonesian explanation in documentation
```

Examples:

```text
Total Devices
Online Devices
Open Incidents
Security Events Today
Risk Level
AI Recommendations
Device Health
Security Score
MQTT Broker Status
AI Agent Console
Telegram / ChatOps
```

## 18.2 ID Format

### Device ID

```text
temp-sensor-001
door-lock-001
power-meter-001
air-quality-001
water-leak-001
```

### Incident ID

```text
INC-2025-0519-007
```

### MQTT Topic

```text
iot/building-a/lab-a/temp-sensor-001/telemetry
```

## 18.3 Tone of AI Agent

AI Agent should sound:

- Calm
- Professional
- Clear
- Actionable
- Security-aware

Example:

```text
System posture is High risk.
7 open incidents detected with 3 critical.
Recommend immediate review of unauthorized access attempts and topic spoofing events.
```

---

# 19. Page Structure

## 19.1 Dashboard Page

### Purpose

Main overview page.

### Sections

1. KPI summary
2. Realtime telemetry
3. Device health
4. Security score
5. MQTT broker status
6. Device status table
7. Security events
8. Incident management
9. AI Agent console
10. Telegram ChatOps
11. Service health footer

---

## 19.2 Devices Page

### Purpose

Manage and monitor IoT devices.

### Sections

- Device list
- Device detail
- Last telemetry
- Battery
- RSSI
- Status history
- Topic mapping
- Policy association

---

## 19.3 Telemetry Page

### Purpose

Analyze telemetry data.

### Sections

- Telemetry chart
- Time range filter
- Device filter
- Raw payload viewer
- Export data

---

## 19.4 Security Events Page

### Purpose

Review security activity.

### Sections

- Event list
- Severity filter
- Event type filter
- Source client
- MQTT topic
- Payload detail
- Convert to incident action

---

## 19.5 Incidents Page

### Purpose

Manage active incidents.

### Sections

- Incident list
- Timeline
- Severity
- Status
- Affected device
- Root cause
- Recommendation
- Generate report

---

## 19.6 AI Agent Console Page

### Purpose

Interact with OpenClaw/Hermes-style AI agent.

### Sections

- System summary
- Chat input
- Recommendation list
- Tool activity log
- Generated reports
- Approval actions

---

## 19.7 Policy Center Page

### Purpose

Manage IoT/MQTT security policies.

### Sections

- Device policy
- Topic ACL mapping
- Allowed client ID
- Auth policy
- Recommended changes from AI

---

## 19.8 Reports Page

### Purpose

Access generated reports.

### Sections

- Incident reports
- Security audit reports
- Daily system summary
- AI-generated recommendations

---

# 20. Mobile Screens

## 20.1 Mobile Dashboard

Content priority:

1. System health
2. KPI cards
3. Realtime telemetry
4. Device health
5. Security score
6. MQTT broker status

## 20.2 Mobile Incidents

Content priority:

1. Security Events
2. Severity filters
3. Incident timeline
4. Quick action button

## 20.3 Mobile AI Agent

Content priority:

1. System summary
2. Top recommendations
3. Quick prompt chips
4. Telegram/ChatOps alerts
5. Chat input

---

# 21. Example UI Copy

## 21.1 Dashboard KPI

```text
Total Devices
1,248
↑ 12.5% vs last 7 days
```

```text
Online Devices
1,102
88.3% of total
```

```text
Open Incidents
7
↑ 2 vs yesterday
```

```text
Risk Level
High
CVSS 7.6
```

## 21.2 AI Agent Summary

```text
System posture is High risk.
7 open incidents detected with 3 critical.
Recommend immediate review of unauthorized access attempts and topic spoofing events.
```

## 21.3 Recommendations

```text
Isolate device temp-sensor-001
Review ACL rules for topic security
Rotate MQTT credentials
Enable anomaly detection
```

## 21.4 Telegram ChatOps

```text
/status
System healthy. 1,102 devices online.

/audit temp-sensor-001
No critical findings. 2 warnings.

Alert: Unauthorized access attempt
INC-2025-0519-007
```

---

# 22. Accessibility Guidelines

## 22.1 Contrast

Ensure text has sufficient contrast:

- Primary text on background: high contrast
- Muted text must remain readable
- Severity badges should not rely on color only

## 22.2 Icons + Labels

Every critical icon should have a label.

Bad:

```text
Only red triangle icon
```

Good:

```text
Red triangle + "High"
```

## 22.3 Touch Targets

Mobile touch target minimum:

```text
44px x 44px
```

## 22.4 Motion

Animations should be subtle.

Avoid:

- Excessive pulsing
- Flashing red alerts
- Overused glow

---

# 23. Implementation with Tailwind CSS

## 23.1 Tailwind Theme Example

```js
// tailwind.config.js
export default {
    theme: {
        extend: {
            colors: {
                background: {
                    primary: '#050B16',
                    secondary: '#071426',
                    card: '#0B1B2E',
                    elevated: '#10243A',
                },
                accent: {
                    teal: '#1FE6D0',
                    cyan: '#38BDF8',
                    blue: '#3B82F6',
                    purple: '#A855F7',
                    emerald: '#10B981',
                    amber: '#F59E0B',
                    orange: '#FB923C',
                    red: '#EF4444',
                    rose: '#F43F5E',
                },
                text: {
                    primary: '#F8FAFC',
                    secondary: '#CBD5E1',
                    muted: '#94A3B8',
                    disabled: '#64748B',
                },
            },
            borderRadius: {
                card: '18px',
                panel: '24px',
            },
            boxShadow: {
                glowTeal: '0 0 24px rgba(31, 230, 208, 0.22)',
                glowRed: '0 0 24px rgba(239, 68, 68, 0.22)',
                card: '0 16px 40px rgba(0,0,0,0.35)',
            },
        },
    },
};
```

---

# 24. Reusable CSS Tokens

```css
:root {
    --bg-primary: #050b16;
    --bg-secondary: #071426;
    --bg-card: #0b1b2e;
    --bg-card-hover: #10243a;

    --border-subtle: #1c334f;
    --border-active: #1fe6d0;

    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;

    --accent-teal: #1fe6d0;
    --accent-cyan: #38bdf8;
    --accent-blue: #3b82f6;
    --accent-purple: #a855f7;
    --accent-emerald: #10b981;
    --accent-amber: #f59e0b;
    --accent-orange: #fb923c;
    --accent-red: #ef4444;
    --accent-rose: #f43f5e;

    --radius-card: 18px;
    --radius-panel: 24px;
}
```

---

# 25. Component Class Examples

## 25.1 Card

```css
.sentinel-card {
    background: linear-gradient(
        180deg,
        rgba(15, 35, 58, 0.82),
        rgba(7, 20, 38, 0.88)
    );
    border: 1px solid rgba(148, 163, 184, 0.14);
    border-radius: 18px;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.04),
        0 16px 40px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(16px);
}
```

## 25.2 Active Nav Item

```css
.nav-item-active {
    background: linear-gradient(
        90deg,
        rgba(31, 230, 208, 0.22),
        rgba(56, 189, 248, 0.08)
    );
    color: #1fe6d0;
    border: 1px solid rgba(31, 230, 208, 0.35);
    box-shadow: 0 0 24px rgba(31, 230, 208, 0.12);
}
```

## 25.3 Severity Badge

```css
.badge-high {
    background: rgba(239, 68, 68, 0.14);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.4);
}

.badge-medium {
    background: rgba(245, 158, 11, 0.12);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.35);
}

.badge-low {
    background: rgba(56, 189, 248, 0.12);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.35);
}
```

---

# 26. Component Inventory

## 26.1 Layout Components

```text
AppShell
Sidebar
TopHeader
MobileHeader
BottomNavigation
DashboardGrid
ServiceStatusBar
```

## 26.2 Dashboard Components

```text
KpiCard
TelemetryChartCard
DeviceHealthDonut
SecurityScoreGauge
MqttBrokerStatusCard
DeviceStatusTable
SecurityEventList
IncidentTimeline
AiAgentConsole
TelegramChatOpsPanel
ServiceHealthChip
```

## 26.3 Shared Components

```text
StatusBadge
SeverityBadge
EnvironmentBadge
SearchInput
IconButton
MetricTrend
ProgressRing
MiniSparkline
EmptyState
LoadingSkeleton
Tooltip
Tabs
FilterChip
CommandInput
```

---

# 27. Recommended Component Props

## 27.1 KpiCard

```ts
type KpiCardProps = {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    variant: 'info' | 'success' | 'warning' | 'danger' | 'ai' | 'risk';
    icon: React.ReactNode;
};
```

## 27.2 StatusBadge

```ts
type StatusBadgeProps = {
    status:
        | 'online'
        | 'healthy'
        | 'warning'
        | 'offline'
        | 'unknown'
        | 'connected';
};
```

## 27.3 SeverityBadge

```ts
type SeverityBadgeProps = {
    severity: 'low' | 'medium' | 'high' | 'critical';
};
```

## 27.4 SecurityEventItem

```ts
type SecurityEventItemProps = {
    title: string;
    entity: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
    type: string;
};
```

## 27.5 IncidentItem

```ts
type IncidentItemProps = {
    incidentId: string;
    title: string;
    affectedEntity: string;
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
};
```

---

# 28. Dashboard Data Example

```json
{
    "summary": {
        "total_devices": 1248,
        "online_devices": 1102,
        "open_incidents": 7,
        "security_events_today": 342,
        "risk_level": "High",
        "cvss": 7.6,
        "ai_recommendations": 12
    },
    "mqtt_broker": {
        "status": "Healthy",
        "auth": "Enabled",
        "acl": "Enabled",
        "broker_logs": "No Errors",
        "port_1883": "Open",
        "port_8883": "Open"
    },
    "ai_agent": {
        "status": "Online",
        "summary": "System posture is High risk.",
        "recommendations": [
            {
                "title": "Isolate device temp-sensor-001",
                "severity": "High"
            },
            {
                "title": "Review ACL rules for topic security",
                "severity": "Medium"
            }
        ]
    }
}
```

---

# 29. Design Do's and Don'ts

## 29.1 Do

- Use dark theme consistently.
- Use teal as the main active accent.
- Use red only for serious security issues.
- Use clear status badges.
- Use compact but readable cards.
- Use charts to show trends, not decoration.
- Keep AI recommendations actionable.
- Keep mobile cards touch-friendly.

## 29.2 Don't

- Do not use too many neon colors at once.
- Do not overload the dashboard with raw JSON.
- Do not make all cards glow.
- Do not rely only on color to indicate severity.
- Do not hide critical incidents below the fold.
- Do not put long AI text in small cards.
- Do not make mobile layout a squeezed desktop.

---

# 30. Final Design Summary

Sentinel-IoT menggunakan desain **dark futuristic SOC dashboard** dengan elemen visual premium seperti glassmorphism card, neon teal accent, severity color coding, compact data visualization, AI Agent console, dan Telegram ChatOps panel.

Desktop layout berfokus pada dashboard operasional lengkap dengan KPI, telemetry, security events, incident management, AI recommendation, dan service health. Mobile layout dibuat sebagai versi responsive yang memprioritaskan informasi paling penting: system health, incidents, dan AI Agent interaction.

Design system ini harus menjaga keseimbangan antara tampilan futuristik dan keterbacaan, sehingga cocok untuk prototype tugas kuliah, demo produk, maupun presentasi arsitektur sistem informasi IoT Security Operation Center.

```

```
