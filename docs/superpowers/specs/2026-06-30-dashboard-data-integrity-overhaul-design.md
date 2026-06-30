# Dashboard Data Integrity & UX Overhaul — Design Spec

**Date:** 2026-06-30
**Scope:** Full sweep of all 20 issues from the dashboard UI/UX critique
**Approach:** C — Full decomposition + live health endpoints

---

## 1. Problem Statement

The dashboard (`resources/js/pages/dashboard.tsx`, 947 lines) renders 12+ panels, but 5 of them display hardcoded static data that never changes. The telemetry chart fabricates multi-sensor readings from message counts. The security score ring ignores its own prop. The incident panel, service health bar, operator spotlight, and device gallery all use `as const` arrays with no backend binding.

Operators cannot trust this dashboard — the data doesn't change, and some of it is provably false.

---

## 2. Architecture

### 2.1 Backend Services

#### `App\Services\ServiceHealthChecker` (new)

Pings each infrastructure component and returns structured status. Each check is wrapped in try/catch — failures return `status: 'error'` instead of crashing.

```php
/**
 * @return array<int, array{name: string, version: string, status: string, icon: string}>
 */
public function check(): array
```

| Service | Check Method | Version Source |
|---------|-------------|----------------|
| Laravel App | Always 'healthy' (we're alive) | `config('app.version')` or `config('sentinel.version')` |
| PostgreSQL | `DB::connection()->getPdo()` try/catch | `PostgreSQL::VERSION()` query |
| Mosquitto MQTT | `fsockopen('127.0.0.1', 1883, timeout: 2)` | `config('services.mqtt.version')` |
| AI Agent Service | HTTP GET `{config('services.agent.url')}/health` | Response body or config |
| Telegram Bot | HTTP GET `https://api.telegram.org/bot{token}/getMe` | API response |
| InfluxDB | HTTP GET `{config('services.influxdb.url')}/ping` | `config('services.influxdb.version')` |

Config additions in `config/services.php`:

```php
'mqtt' => [
    'host' => env('MQTT_HOST', '127.0.0.1'),
    'port' => env('MQTT_PORT', 1883),
    'version' => env('MQTT_VERSION', 'v2.0.18'),
],
'agent' => [
    'url' => env('AGENT_URL', 'http://localhost:8001'),
    'version' => env('AGENT_VERSION', 'v1.8.3'),
],
'influxdb' => [
    'url' => env('INFLUXDB_URL', 'http://localhost:8086'),
    'version' => env('INFLUXDB_VERSION', 'v2.7.5'),
],
```

#### `App\Services\SecurityScoreCalculator` (new)

Computes real security sub-scores from DB data. Returns overall score (weighted average) + 4 sub-scores.

```php
/**
 * @return array{
 *   overall: int,
 *   sub_scores: array<int, array{label: string, value: int}>,
 *   label: string,
 * }
 */
public function calculate(): array
```

| Sub-score | Label | Calculation |
|-----------|-------|-------------|
| Identity | Identity | `% of devices with ≥1 active DevicePolicy` |
| Network | Network | `100 - (publish_flood + unauthorized_publish events in 24h × 5)`, clamped 0-100 |
| Data | Data | `100 - (malformed_payload events in 24h × 5)`, clamped 0-100 |
| Device | Device | `% of devices currently online` |

Overall = equal-weight average of all 4. Label mapping: `≥85 → 'Excellent'`, `≥70 → 'Good'`, `≥50 → 'Fair'`, `<50 → 'Poor'`.

### 2.2 Controller Changes

#### `DashboardController::index()` (modified)

New data to send via Inertia props:

```php
return Inertia::render('dashboard', [
    // Existing (unchanged):
    ...$this->summary->summary(),         // total_devices, online_devices, etc.
    'recent_telemetry' => $recentTelemetry,
    'recent_events' => $recentEvents,
    'bot_token' => $botTokenData,

    // New:
    'incidents' => $this->recentIncidents(),    // top 5 open/investigating
    'devices' => $this->allDevices(),           // all devices with status
    'security_score' => $this->scoreCalculator->calculate(),
    'operator' => $this->operatorData($request->user()),
]);
```

New private methods on the controller:

**`recentIncidents()`** — Returns top 5 incidents with `status IN (open, investigating)`, ordered by `created_at DESC`. Shape:

```php
[
    'id' => $incident->id,
    'title' => $incident->title,
    'severity' => $incident->severity,
    'status' => $incident->status,
    'device_id' => $incident->affected_device_id,
    'created_at' => $incident->created_at->toIso8601String(),
]
```

**`allDevices()`** — Returns all devices. Shape:

```php
[
    'device_id' => $device->device_id,
    'name' => $device->name,
    'type' => $device->type,
    'status' => $device->status,
    'last_seen_at' => $device->last_seen_at?->toIso8601String(),
    'metadata_json' => $device->metadata_json,
]
```

**`operatorData(User $user)`** — Returns current user info + resolved incident count this week. Shape:

```php
[
    'name' => $user->name,
    'email' => $user->email,
    'resolved_this_week' => Incident::where('created_by', $user->id)
        ->where('status', Incident::STATUS_CLOSED)
        ->where('updated_at', '>=', now()->startOfWeek())
        ->count(),
]
```

#### Telemetry aggregation fix

Replace `aggregateTelemetryPerMinute()` to return real sensor averages:

```php
private function aggregateTelemetryPerMinute(Carbon $from, Carbon $to): array
{
    return TelemetryLog::query()
        ->where('received_at', '>=', $from)
        ->where('received_at', '<=', $to)
        ->selectRaw("date_trunc('minute', received_at) as minute_bucket")
        ->selectRaw('AVG(temperature) as temperature')
        ->selectRaw('AVG(humidity) as humidity')
        ->selectRaw('AVG(battery) as battery')
        ->groupBy('minute_bucket')
        ->orderBy('minute_bucket')
        ->get()
        ->map(fn ($row) => [
            'minute' => Carbon::parse($row->minute_bucket)->format('H:i'),
            'temperature' => round($row->temperature ?? 0, 1),
            'humidity' => round($row->humidity ?? 0, 1),
            'battery' => round($row->battery ?? 0, 1),
        ])
        ->all();
}
```

### 2.3 Health API Endpoint

#### `App\Http\Controllers\Api\DashboardHealthController` (new)

```
GET /api/dashboard/health
```

- Auth: Sanctum (same guard as existing API)
- Rate limit: 1 request per 10 seconds (`throttle:10,1`)
- Returns: `ServiceHealthChecker::check()` as JSON

Route registration in `routes/api.php`:

```php
Route::get('/dashboard/health', [DashboardHealthController::class, 'health'])
    ->middleware('auth:sanctum', 'throttle:10,1');
```

---

## 3. Frontend Architecture

### 3.1 Directory Structure

Delete `resources/js/pages/dashboard.tsx`. Replace with:

```
resources/js/pages/dashboard/
├── index.tsx                    # Main layout + prop types (~80 lines)
├── hooks/
│   └── use-dashboard-health.ts  # Polling hook for /api/dashboard/health
├── components/
│   ├── kpi-row.tsx              # 6 stat cards
│   ├── telemetry-panel.tsx      # Real temp/humidity/battery chart
│   ├── device-health-card.tsx   # Donut chart (real data)
│   ├── security-score-card.tsx  # Dynamic arc + real sub-scores
│   ├── mqtt-broker-card.tsx     # Polls health endpoint
│   ├── device-gallery.tsx       # Real devices, signal bars (no sparklines)
│   ├── threat-feed.tsx          # Already real, fix empty state + triage
│   ├── incident-panel.tsx       # Real incidents from props
│   ├── ai-agent-panel.tsx       # Real recommendations or remove hardcoded list
│   ├── api-auth-panel.tsx       # Already real, fix rotation UX
│   ├── operator-spotlight.tsx   # Real user + real resolved count
│   ├── service-health-bar.tsx   # Polls health endpoint
│   ├── mobile-header.tsx        # Add compact service status dots
│   └── legend.tsx               # Shared legend component
```

### 3.2 Data Flow

**Static (Inertia props, loaded on page visit):**

| Prop | Consumer |
|------|----------|
| `total_devices`, `online_devices`, `offline_devices` | `KpiRow` |
| `open_incidents`, `security_events_today`, `risk_level` | `KpiRow` |
| `recent_telemetry` (real sensor averages) | `TelemetryPanel` |
| `recent_events` | `ThreatFeed` |
| `incidents` (top 5) | `IncidentPanel` |
| `devices` (all) | `DeviceGallery` |
| `security_score` (overall + sub-scores) | `SecurityScoreCard` |
| `bot_token` | `ApiAuthPanel` |
| `operator` (user + resolved count) | `OperatorSpotlight` |

**Polled (`useDashboardHealth` hook, 10s interval):**

| Data | Consumer |
|------|----------|
| Service health array | `MqttBrokerCard`, `ServiceHealthBar` |

Hook implementation:

```ts
function useDashboardHealth(intervalMs = 10_000) {
    const [health, setHealth] = useState<ServiceHealth[]>([]);
    const [stale, setStale] = useState(false);

    useEffect(() => {
        let active = true;
        const poll = async () => {
            try {
                const res = await fetch('/api/dashboard/health');
                if (!active) return;
                if (res.ok) {
                    setHealth(await res.json());
                    setStale(false);
                } else {
                    setStale(true);
                }
            } catch {
                if (active) setStale(true);
            }
        };
        poll();
        const id = setInterval(poll, intervalMs);
        return () => { active = false; clearInterval(id); };
    }, [intervalMs]);

    return { health, stale };
}
```

Shows stale data while re-fetching (no loading spinner flicker). On persistent error: shows last known state + subtle "stale" indicator.

### 3.3 Grid Layout (Rebalanced)

**Row 1 — Operational Summary:** `grid-cols-2 lg:grid-cols-6`, gap-3 lg:gap-4
- 6 stat cards (unchanged grid, fix data bindings)

**Row 2 — Charts & Health:** `lg:grid-cols-10`, gap-4
| Panel | Span |
|-------|------|
| Telemetry Panel | `lg:col-span-6` |
| Device Health Card | `lg:col-span-4` |

**Row 2.5 — System Status:** `lg:grid-cols-12`, gap-4
| Panel | Span |
|-------|------|
| Security Score Card | `lg:col-span-4` |
| MQTT Broker Card | `lg:col-span-4` |
| AI Agent Panel | `lg:col-span-4` |

**Row 3 — Detail Panels:** `lg:grid-cols-12`, gap-4
| Panel | Span |
|-------|------|
| Device Gallery | `lg:col-span-5` |
| Threat Feed | `lg:col-span-2` |
| Incident Panel | `lg:col-span-2` |
| Right stack (API Auth + Operator) | `lg:col-span-3` |

**Row 4 — Footer:** `ServiceHealthBar` (full width, `lg:grid-cols-6`)

**Spacing:** Row 1 uses `gap-3 lg:gap-4`. Rows 2-3 use `gap-4`. Gap between row groups: `gap-5 lg:gap-6` (use a wrapper div with the larger gap).

### 3.4 Component Fixes

#### `SecurityScoreCard`
- Dynamic conic-gradient: `conic-gradient(var(--sentinel-teal) 0 ${score}%, rgba(28,51,79,0.9) ${score}% 100%)`
- Label from score: `≥85 → 'Excellent'`, `≥70 → 'Good'`, `≥50 → 'Fair'`, `<50 → 'Poor'`
- Sub-scores from props (not hardcoded Identity 82, Network 74, etc.)
- Accept `{ overall: number, sub_scores: Array<{label: string, value: number}>, label: string }` prop

#### `AnimatedCounter`
- Guard `numericValue <= 0` early return (prevents division-by-zero in interval calc)
- Memoize parsed numeric value with `useMemo` to avoid re-triggering on parent re-renders

#### `DeviceGallery`
- Remove `getSparklinePath` entirely
- Show real RSSI signal bars from `device.metadata_json?.rssi`:
  ```tsx
  function rssiToBars(rssi?: number): number {
      if (rssi === undefined || rssi === null) return 0;
      if (rssi >= -50) return 4;
      if (rssi >= -60) return 3;
      if (rssi >= -70) return 2;
      return 1;
  }
  ```
- 4 vertical bars, green for active, gray for inactive

#### `ThreatFeed` — Empty State
When `events.length === 0`:
```tsx
<Card className="sentinel-surface border-emerald-400/30 lg:col-span-2">
    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <ShieldCheck className="size-8 text-emerald-400 mb-2" />
        <div className="text-sm font-mono text-emerald-300">No threats detected</div>
        <div className="text-xs text-muted-foreground font-mono mt-1">System nominal</div>
    </CardContent>
</Card>
```

#### `ThreatFeed` — Triage Feedback
After successful `router.post(storeIncident.url(), ...)`:
- Show Sonner toast: `toast.success(\`Incident created from ${event.event_type}\`)`
- Remove triaged event from local state (optimistic update)
- On error: `toast.error('Failed to create incident — try again')`

#### `IncidentPanel` — Data Binding
- Remove `incidentRows` constant
- Accept `incidents` prop (array from controller)
- Handle empty state: green card with "No active incidents" + checkmark

#### `AiAgentPanel` — Recommendations
- Remove hardcoded recommendation list
- Accept `recommendations` prop OR show a single summary message from the AI agent
- If no real AI recommendation data exists yet, show only the agent status + "Ask OpenClaw" link (remove the fake recommendation list)

#### `ApiAuthPanel` — Token Rotation UX
- After successful rotation, the flash message already shows the new token
- Add: toast notification "New bot token generated — copy it now"
- Add: visual emphasis (pulsing border) on the token display area

#### `OperatorSpotlight` — Data Binding
- Remove hardcoded shift schedule, incident count, and action logs
- Show: user name, email, resolved_this_week count from props
- Remove "Recent actions logs" section entirely (no data source)
- Remove hardcoded shift schedule (no data source)

#### `MobileHeader` — Service Status Strip
Add compact status dots below existing mobile header:
```tsx
<div className="flex items-center gap-3 lg:hidden px-1">
    {health.map(s => (
        <div key={s.name} className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full",
                s.status === 'healthy' || s.status === 'online' || s.status === 'connected'
                    ? 'bg-emerald-400' : 'bg-red-400'
            )} />
            <span className="text-[10px] font-mono text-muted-foreground">{shortName(s.name)}</span>
        </div>
    ))}
</div>
```

Where `shortName` maps: `'Laravel App' → 'API'`, `'Mosquitto MQTT Broker' → 'MQTT'`, `'PostgreSQL' → 'DB'`, etc.

### 3.5 Props Interface

```ts
interface DashboardProps {
    // Existing:
    total_devices: number;
    online_devices: number;
    offline_devices: number;
    security_events_today: number;
    open_incidents: number;
    risk_level: RiskLevel;
    recent_telemetry: Array<{
        minute: string;
        temperature: number;
        humidity: number;
        battery: number;
    }>;
    recent_events: RecentEvent[];
    bot_token: BotTokenData | null;

    // New:
    incidents: IncidentRow[];
    devices: DeviceRow[];
    security_score: SecurityScore;
    operator: OperatorData;
}

interface IncidentRow {
    id: number;
    title: string;
    severity: Severity;
    status: string;
    device_id: string | null;
    created_at: string;
}

interface DeviceRow {
    device_id: string;
    name: string;
    type: string;
    status: string;
    last_seen_at: string | null;
    metadata_json: Record<string, unknown> | null;
}

interface SecurityScore {
    overall: number;
    sub_scores: Array<{ label: string; value: number }>;
    label: string;
}

interface OperatorData {
    name: string;
    email: string;
    resolved_this_week: number;
}

interface ServiceHealth {
    name: string;
    version: string;
    status: string;
    icon: string;
}
```

---

## 4. Empty States

| Panel | Condition | Treatment |
|-------|-----------|-----------|
| Threat Feed | 0 events | Green emerald card: "No threats detected — system nominal" with ShieldCheck icon |
| Incident Panel | 0 open | Green card: "No active incidents" with checkmark |
| Telemetry Chart | 0 data points | Pulsing skeleton + "Waiting for sensor data..." text |
| Device Gallery | 0 devices | "No devices registered. Add your first device →" with link to devices index |
| AI Agent Panel | No recommendations | Show only agent status + "Ask OpenClaw" link |

---

## 5. Files Changed (Summary)

### New Files (Backend)
| File | Purpose |
|------|---------|
| `app/Services/ServiceHealthChecker.php` | Ping infrastructure services |
| `app/Services/SecurityScoreCalculator.php` | Compute security sub-scores |
| `app/Http/Controllers/Api/DashboardHealthController.php` | Health API endpoint |
| `tests/Feature/Api/DashboardHealthTest.php` | Health endpoint tests |
| `tests/Unit/ServiceHealthCheckerTest.php` | Service checker tests |
| `tests/Unit/SecurityScoreCalculatorTest.php` | Score calculator tests |

### Modified Files (Backend)
| File | Change |
|------|--------|
| `app/Http/Controllers/DashboardController.php` | Add new props, fix telemetry aggregation |
| `config/services.php` | Add mqtt, agent, influxdb config |
| `routes/api.php` | Add health endpoint route |

### New Files (Frontend)
| File | Purpose |
|------|---------|
| `resources/js/pages/dashboard/index.tsx` | Main layout |
| `resources/js/pages/dashboard/hooks/use-dashboard-health.ts` | Health polling hook |
| `resources/js/pages/dashboard/components/kpi-row.tsx` | Stat cards |
| `resources/js/pages/dashboard/components/telemetry-panel.tsx` | Telemetry chart |
| `resources/js/pages/dashboard/components/device-health-card.tsx` | Donut chart |
| `resources/js/pages/dashboard/components/security-score-card.tsx` | Score ring |
| `resources/js/pages/dashboard/components/mqtt-broker-card.tsx` | MQTT status |
| `resources/js/pages/dashboard/components/device-gallery.tsx` | Device list |
| `resources/js/pages/dashboard/components/threat-feed.tsx` | Threat feed |
| `resources/js/pages/dashboard/components/incident-panel.tsx` | Incidents |
| `resources/js/pages/dashboard/components/ai-agent-panel.tsx` | AI agent |
| `resources/js/pages/dashboard/components/api-auth-panel.tsx` | Token management |
| `resources/js/pages/dashboard/components/operator-spotlight.tsx` | Operator info |
| `resources/js/pages/dashboard/components/service-health-bar.tsx` | Service footer |
| `resources/js/pages/dashboard/components/mobile-header.tsx` | Mobile header |
| `resources/js/pages/dashboard/components/legend.tsx` | Shared legend |

### Deleted Files (Frontend)
| File | Reason |
|------|--------|
| `resources/js/pages/dashboard.tsx` | Replaced by directory |

### Modified Files (Frontend)
| File | Change |
|------|--------|
| `resources/js/components/telemetry-chart.tsx` | No change needed (already accepts generic data) |

---

## 6. Out of Scope

- **Real-time WebSocket/SSE updates** — polling at 10s is sufficient for a SOC dashboard. Upgrade later if needed.
- **AI recommendation generation** — the AI Agent panel will show agent status + link only until real AI recommendations are wired.
- **Operator action logs** — no data source exists. Panel simplified to user info + resolved count.
- **Shift schedule** — no data source. Removed from operator panel.
