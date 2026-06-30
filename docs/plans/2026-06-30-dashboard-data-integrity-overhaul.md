# Dashboard Data Integrity & UX Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded dashboard data with real server queries, decompose the 947-line monolith into focused components, and add a live health-polling endpoint.

**Architecture:** Two new backend services (`ServiceHealthChecker`, `SecurityScoreCalculator`) feed the existing `DashboardController` via constructor injection. A new `GET /api/dashboard/health` endpoint returns live infrastructure status. The frontend splits `dashboard.tsx` into a `dashboard/` directory of 16 focused files, wired to real Inertia props and a polling hook.

**Tech Stack:** PHP 8.4, Laravel 13, Inertia v3 + React 19, Pest 4, Tailwind CSS v4, Recharts, Sonner, Sanctum v4

**Spec:** `docs/superpowers/specs/2026-06-30-dashboard-data-integrity-overhaul-design.md`

## Global Constraints

- PHP 8.4 with strict types where established in the codebase
- Pest 4 for all tests (`php artisan make:test --pest`)
- Inertia v3 for all server-side rendering (`Inertia::render()`)
- Tailwind CSS v4 for all styling
- Sonner for toast notifications (already installed, `import { toast } from 'sonner'`)
- Existing `sentinel-surface` CSS class on all dashboard cards
- All new models use `BelongsToTenant` trait (existing multi-tenancy pattern)
- `DashboardSummary` service stays unchanged — only the controller and new services change
- Existing factories used for test data (`DeviceFactory`, `IncidentFactory`, `SecurityEventFactory`, `TelemetryLogFactory`)
- Database: PostgreSQL (use `date_trunc()` for time bucketing, not SQLite-compatible alternatives)

---

### Task 1: Add Service Config Keys

**Files:**
- Modify: `config/services.php`

**Interfaces:**
- Produces: `config('services.mqtt.host')`, `config('services.mqtt.port')`, `config('services.mqtt.version')`, `config('services.agent.url')`, `config('services.agent.version')`, `config('services.influxdb.url')`, `config('services.influxdb.version')`

- [ ] **Step 1: Read current `config/services.php`**

Read the file to understand existing structure and where to add new keys.

- [ ] **Step 2: Add MQTT, Agent, and InfluxDB config blocks**

Append these blocks inside the existing array in `config/services.php`:

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

- [ ] **Step 3: Run Pint on the changed file**

```bash
vendor/bin/pint --dirty --format agent
```

- [ ] **Step 4: Commit**

```bash
git add config/services.php
git commit -m "chore: add mqtt/agent/influxdb service config keys"
```

---

### Task 2: Create `SecurityScoreCalculator` Service

**Files:**
- Create: `app/Services/SecurityScoreCalculator.php`
- Create: `tests/Unit/SecurityScoreCalculatorTest.php`

**Interfaces:**
- Consumes: `App\Models\Device`, `App\Models\DevicePolicy`, `App\Models\SecurityEvent`
- Produces: `SecurityScoreCalculator::calculate(): array{overall: int, sub_scores: array<int, array{label: string, value: int}>, label: string}`

- [ ] **Step 1: Create the test file**

```bash
php artisan make:test --pest SecurityScoreCalculatorTest --unit --no-interaction
```

- [ ] **Step 2: Write the failing tests**

Replace `tests/Unit/SecurityScoreCalculatorTest.php` with:

```php
<?php

use App\Models\Device;
use App\Models\DevicePolicy;
use App\Models\SecurityEvent;
use App\Services\SecurityScoreCalculator;

it('returns perfect score when all devices are online with policies and no events', function (): void {
    $devices = Device::factory()->online()->count(3)->create();
    foreach ($devices as $device) {
        DevicePolicy::factory()->create(['device_id' => $device->device_id]);
    }

    $result = app(SecurityScoreCalculator::class)->calculate();

    expect($result['overall'])->toBe(100);
    expect($result['label'])->toBe('Excellent');
    expect($result['sub_scores'])->toHaveCount(4);
    foreach ($result['sub_scores'] as $sub) {
        expect($sub['value'])->toBe(100);
    }
});

it('returns low score when devices are offline with network events', function (): void {
    Device::factory()->offline()->count(3)->create();
    SecurityEvent::factory()->count(10)->create([
        'event_type' => SecurityEvent::TYPE_UNAUTHORIZED_PUBLISH,
        'detected_at' => now()->subHour(),
    ]);

    $result = app(SecurityScoreCalculator::class)->calculate();

    expect($result['overall'])->toBeLessThan(50);
    expect($result['label'])->toBe('Poor');
});

it('calculates identity score from device policy coverage', function (): void {
    $devices = Device::factory()->online()->count(4)->create();
    DevicePolicy::factory()->create(['device_id' => $devices[0]->device_id]);
    DevicePolicy::factory()->create(['device_id' => $devices[1]->device_id]);

    $result = app(SecurityScoreCalculator::class)->calculate();

    $identity = collect($result['sub_scores'])->firstWhere('label', 'Identity');
    expect($identity['value'])->toBe(50);
});

it('clamps network score to zero when many events exist', function (): void {
    Device::factory()->online()->count(2)->create();
    SecurityEvent::factory()->count(30)->create([
        'event_type' => SecurityEvent::TYPE_PUBLISH_FLOOD,
        'detected_at' => now()->subHour(),
    ]);

    $result = app(SecurityScoreCalculator::class)->calculate();

    $network = collect($result['sub_scores'])->firstWhere('label', 'Network');
    expect($network['value'])->toBe(0);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
php artisan test --compact --filter=SecurityScoreCalculatorTest
```

Expected: FAIL — `SecurityScoreCalculator` class does not exist.

- [ ] **Step 4: Implement the service**

Create `app/Services/SecurityScoreCalculator.php`:

```php
<?php

namespace App\Services;

use App\Models\Device;
use App\Models\SecurityEvent;
use Illuminate\Support\Carbon;

class SecurityScoreCalculator
{
    /**
     * @return array{overall: int, sub_scores: array<int, array{label: string, value: int}>, label: string}
     */
    public function calculate(): array
    {
        $now = Carbon::now();
        $dayAgo = $now->copy()->subHours(24);
        $totalDevices = Device::query()->count();

        $identity = $this->identityScore($totalDevices);
        $network = $this->networkScore($dayAgo);
        $data = $this->dataScore($dayAgo);
        $device = $this->deviceScore($totalDevices);

        $subScores = [
            ['label' => 'Identity', 'value' => $identity],
            ['label' => 'Network', 'value' => $network],
            ['label' => 'Data', 'value' => $data],
            ['label' => 'Device', 'value' => $device],
        ];

        $overall = (int) round(($identity + $network + $data + $device) / 4);

        return [
            'overall' => $overall,
            'sub_scores' => $subScores,
            'label' => $this->labelFor($overall),
        ];
    }

    private function identityScore(int $totalDevices): int
    {
        if ($totalDevices === 0) {
            return 100;
        }
        $withPolicies = Device::query()->whereHas('policies')->count();

        return (int) round(($withPolicies / $totalDevices) * 100);
    }

    private function networkScore(Carbon $since): int
    {
        $events = SecurityEvent::query()
            ->where('detected_at', '>=', $since)
            ->whereIn('event_type', [
                SecurityEvent::TYPE_PUBLISH_FLOOD,
                SecurityEvent::TYPE_UNAUTHORIZED_PUBLISH,
            ])
            ->count();

        return max(0, 100 - ($events * 5));
    }

    private function dataScore(Carbon $since): int
    {
        $events = SecurityEvent::query()
            ->where('detected_at', '>=', $since)
            ->where('event_type', SecurityEvent::TYPE_MALFORMED_PAYLOAD)
            ->count();

        return max(0, 100 - ($events * 5));
    }

    private function deviceScore(int $totalDevices): int
    {
        if ($totalDevices === 0) {
            return 100;
        }
        $online = Device::query()
            ->where('last_seen_at', '>=', now()->copy()->subMinutes(5))
            ->count();

        return (int) round(($online / $totalDevices) * 100);
    }

    private function labelFor(int $score): string
    {
        return match (true) {
            $score >= 85 => 'Excellent',
            $score >= 70 => 'Good',
            $score >= 50 => 'Fair',
            default => 'Poor',
        };
    }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
php artisan test --compact --filter=SecurityScoreCalculatorTest
```

Expected: PASS

- [ ] **Step 6: Run Pint and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Services/SecurityScoreCalculator.php tests/Unit/SecurityScoreCalculatorTest.php
git commit -m "feat: add SecurityScoreCalculator service with real DB-backed sub-scores"
```

---

### Task 3: Create `ServiceHealthChecker` Service

**Files:**
- Create: `app/Services/ServiceHealthChecker.php`
- Create: `tests/Unit/ServiceHealthCheckerTest.php`

**Interfaces:**
- Consumes: `config('services.mqtt.*')`, `config('services.agent.*')`, `config('services.influxdb.*')`, `DB`, `Http`
- Produces: `ServiceHealthChecker::check(): array<int, array{name: string, version: string, status: string, icon: string}>`

- [ ] **Step 1: Create the test file**

```bash
php artisan make:test --pest ServiceHealthCheckerTest --unit --no-interaction
```

- [ ] **Step 2: Write the failing tests**

Replace `tests/Unit/ServiceHealthCheckerTest.php` with:

```php
<?php

use App\Services\ServiceHealthChecker;

it('returns an entry for every infrastructure service', function (): void {
    $result = app(ServiceHealthChecker::class)->check();

    expect($result)->toBeArray();
    expect($result)->toHaveCount(6);

    $laravel = collect($result)->firstWhere('name', 'Laravel App');
    expect($laravel)->not->toBeNull();
    expect($laravel['status'])->toBe('healthy');

    foreach ($result as $service) {
        expect($service)->toHaveKeys(['name', 'version', 'status', 'icon']);
    }
});

it('returns error status when MQTT host is unreachable', function (): void {
    config(['services.mqtt.host' => '192.0.2.1']);
    config(['services.mqtt.port' => 1]);

    $result = app(ServiceHealthChecker::class)->check();

    $mqtt = collect($result)->firstWhere('name', 'Mosquitto MQTT Broker');
    expect($mqtt['status'])->toBe('error');
});
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
php artisan test --compact --filter=ServiceHealthCheckerTest
```

Expected: FAIL — `ServiceHealthChecker` class does not exist.

- [ ] **Step 4: Implement the service**

Create `app/Services/ServiceHealthChecker.php`. Full implementation in the spec (Section 2.1). Key points:
- Each service check is its own private method wrapped in try/catch
- `checkLaravel()` always returns `healthy`
- `checkPostgres()` uses `DB::selectOne('SELECT version()')`
- `checkMqtt()` uses `fsockopen()` with 2-second timeout
- `checkAgent()` and `checkInfluxDb()` use `Http::timeout(2)`
- `checkTelegram()` reads `config('services.telegram.bot_token')`

- [ ] **Step 5: Run the tests to verify they pass**

```bash
php artisan test --compact --filter=ServiceHealthCheckerTest
```

Expected: PASS (Laravel + Postgres healthy; others may be `error` in test env — that's expected).

- [ ] **Step 6: Run Pint and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Services/ServiceHealthChecker.php tests/Unit/ServiceHealthCheckerTest.php
git commit -m "feat: add ServiceHealthChecker with real infrastructure pings"
```

---

### Task 4: Create Health API Endpoint

**Files:**
- Create: `app/Http/Controllers/Api/DashboardHealthController.php`
- Modify: `routes/api.php`
- Create: `tests/Feature/Api/DashboardHealthTest.php`

**Interfaces:**
- Consumes: `ServiceHealthChecker::check()` (Task 3)
- Produces: `GET /api/dashboard/health` → JSON array of service statuses

- [ ] **Step 1: Create the test file and directory**

```bash
mkdir -p tests/Feature/Api
php artisan make:test --pest Api/DashboardHealthTest --no-interaction
```

- [ ] **Step 2: Write the failing tests**

Replace contents with:

```php
<?php

use App\Models\User;

it('returns service health for authenticated user', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard/health');

    $response->assertOk()
        ->assertJsonStructure([
            '*' => ['name', 'version', 'status', 'icon'],
        ])
        ->assertJsonCount(6);
});

it('rejects unauthenticated requests', function (): void {
    $this->getJson('/api/dashboard/health')->assertUnauthorized();
});
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
php artisan test --compact --filter=DashboardHealthTest
```

Expected: FAIL — route does not exist.

- [ ] **Step 4: Create the controller**

Create `app/Http/Controllers/Api/DashboardHealthController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ServiceHealthChecker;
use Illuminate\Http\JsonResponse;

class DashboardHealthController extends Controller
{
    public function __construct(private readonly ServiceHealthChecker $checker) {}

    public function health(): JsonResponse
    {
        return response()->json($this->checker->check());
    }
}
```

- [ ] **Step 5: Register the route in `routes/api.php`**

Add inside the existing auth middleware group:

```php
use App\Http\Controllers\Api\DashboardHealthController;

Route::get('/dashboard/health', [DashboardHealthController::class, 'health'])
    ->middleware('throttle:10,1');
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
php artisan test --compact --filter=DashboardHealthTest
```

Expected: PASS

- [ ] **Step 7: Run Pint and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Api/DashboardHealthController.php routes/api.php tests/Feature/Api/DashboardHealthTest.php
git commit -m "feat: add GET /api/dashboard/health endpoint with Sanctum auth"
```

---

### Task 5: Update Dashboard Controller with Real Data

**Files:**
- Modify: `app/Http/Controllers/DashboardController.php`
- Modify: `tests/Feature/DashboardTest.php`

**Interfaces:**
- Consumes: `DashboardSummary::summary()` (unchanged), `SecurityScoreCalculator::calculate()` (Task 2)
- Produces: New Inertia props: `incidents`, `devices`, `security_score`, `operator`, fixed `recent_telemetry`

- [ ] **Step 1: Read existing controller and test**

- [ ] **Step 2: Update the test to assert new props**

Replace `tests/Feature/DashboardTest.php` with:

```php
<?php

use App\Models\Device;
use App\Models\DevicePolicy;
use App\Models\Incident;
use App\Models\SecurityEvent;
use App\Models\TelemetryLog;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the dashboard with all required props', function (): void {
    $user = User::factory()->create();
    $devices = Device::factory()->online()->count(3)->create();
    Device::factory()->offline()->count(2)->create();
    DevicePolicy::factory()->create(['device_id' => $devices[0]->device_id]);

    SecurityEvent::factory()->count(4)->create([
        'detected_at' => now()->subMinutes(10),
    ]);

    Incident::factory()->open()->severity(Incident::SEVERITY_HIGH)->create();

    TelemetryLog::factory()->count(5)->create([
        'received_at' => now()->subMinutes(5),
        'temperature' => 22.5,
        'humidity' => 45.0,
        'battery' => 80.0,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('total_devices')
            ->has('online_devices')
            ->has('offline_devices')
            ->has('security_events_today')
            ->has('open_incidents')
            ->has('risk_level')
            ->has('recent_telemetry', 60)
            ->has('recent_telemetry.0.temperature')
            ->has('recent_telemetry.0.humidity')
            ->has('recent_telemetry.0.battery')
            ->has('recent_events')
            ->has('bot_token')
            ->has('incidents')
            ->has('incidents.0.id')
            ->has('incidents.0.title')
            ->has('incidents.0.severity')
            ->has('incidents.0.status')
            ->has('devices')
            ->has('devices.0.device_id')
            ->has('devices.0.name')
            ->has('devices.0.type')
            ->has('devices.0.status')
            ->has('security_score')
            ->has('security_score.overall')
            ->has('security_score.sub_scores')
            ->has('security_score.label')
            ->has('operator')
            ->has('operator.name')
            ->has('operator.email')
            ->has('operator.resolved_this_week')
        );
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
php artisan test --compact --filter=DashboardTest
```

Expected: FAIL — new props missing.

- [ ] **Step 4: Update the DashboardController**

Key changes to `app/Http/Controllers/DashboardController.php`:
- Add constructor injection for `SecurityScoreCalculator`
- Replace `aggregateTelemetryPerMinute()` to return real `temperature`/`humidity`/`battery` averages using `AVG()` + `date_trunc('minute', received_at)` — see spec Section 2.2 for full implementation
- Add `recentIncidents()` — top 5 open/investigating, returns `id`, `title`, `severity`, `status`, `device_id`, `created_at`
- Add `allDevices()` — all devices, returns `device_id`, `name`, `type`, `status`, `last_seen_at`, `metadata_json`
- Add `operatorData(User $user)` — returns `name`, `email`, `resolved_this_week` (count of closed incidents this week)
- Pass all four new datasets in the `Inertia::render()` call

Full implementation in the spec, Section 2.2.

- [ ] **Step 5: Run the test to verify it passes**

```bash
php artisan test --compact --filter=DashboardTest
```

Expected: PASS

- [ ] **Step 6: Run Pint and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/DashboardController.php tests/Feature/DashboardTest.php
git commit -m "feat: wire real incidents, devices, security score, and operator data into dashboard"
```

---

### Task 6: Frontend — Main Layout, Types, and Directory Structure

**Files:**
- Create: `resources/js/pages/dashboard/index.tsx`

**Interfaces:**
- Consumes: All Inertia props from Task 5
- Produces: `DashboardProps`, `ServiceHealth`, `RecentEvent`, `IncidentRow`, `DeviceRow`, `SecurityScore`, `OperatorData`, `BotTokenData` types; main layout shell importing all child components

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p resources/js/pages/dashboard/components
mkdir -p resources/js/pages/dashboard/hooks
```

- [ ] **Step 2: Create `resources/js/pages/dashboard/index.tsx`**

See spec Section 3.5 for full props interface. The layout file:
- Exports all TypeScript interfaces
- Imports `useDashboardHealth` hook
- Renders: `MobileDashboardHeader` → `PageHeader` → `KpiRow` → `TelemetryPanel` + `DeviceHealthCard` (Row 2) → `SecurityScoreCard` + `MqttBrokerCard` + `AiAgentPanel` (Row 2.5) → `DeviceGallery` + `ThreatFeed` + `IncidentPanel` + right stack (Row 3) → `ServiceHealthBar` (Row 4)
- Row 2: `lg:grid-cols-10`, Row 2.5: `lg:grid-cols-12`, Row 3: `lg:grid-cols-12`
- Row-group gaps: `gap-4 lg:gap-5`

- [ ] **Step 3: Do NOT delete old `dashboard.tsx` yet** — do that in the final cleanup task

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/dashboard/index.tsx
git commit -m "feat: scaffold dashboard directory with typed props and layout"
```

---

### Task 7: Frontend — Hook, KPI Row, Animated Counter

**Files:**
- Create: `resources/js/pages/dashboard/hooks/use-dashboard-health.ts`
- Create: `resources/js/pages/dashboard/components/animated-counter.tsx`
- Create: `resources/js/pages/dashboard/components/kpi-row.tsx`

- [ ] **Step 1: Create `use-dashboard-health.ts`**

The hook polls `GET /api/dashboard/health` every 10 seconds. Uses `useState` + `useEffect` with cleanup. Returns `{ health: ServiceHealth[], stale: boolean }`. On fetch error, sets `stale: true` but keeps last known `health` state. Full implementation in spec Section 3.2.

- [ ] **Step 2: Create `animated-counter.tsx`**

Fixed version of the original. Key changes:
- `useMemo` for parsed numeric value (avoids re-triggering on parent re-renders)
- Guard `numericValue <= 0` early return (prevents division-by-zero in interval calc)
- Uses `Math.max(Math.ceil(end / (totalMs / stepMs)), 1)` for increment (never 0)

- [ ] **Step 3: Create `kpi-row.tsx`**

6 stat cards in `grid-cols-2 lg:grid-cols-6`. Removed hardcoded subtitle strings from original (fake percentages). Accepts props: `totalDevices`, `onlineDevices`, `openIncidents`, `securityEventsToday`, `riskLevel`.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/dashboard/hooks/use-dashboard-health.ts resources/js/pages/dashboard/components/animated-counter.tsx resources/js/pages/dashboard/components/kpi-row.tsx
git commit -m "feat: add useDashboardHealth hook, AnimatedCounter, KpiRow"
```

---

### Task 8: Frontend — Telemetry Panel, Legend, Device Health Card

**Files:**
- Create: `resources/js/pages/dashboard/components/legend.tsx`
- Create: `resources/js/pages/dashboard/components/telemetry-panel.tsx`
- Create: `resources/js/pages/dashboard/components/device-health-card.tsx`

- [ ] **Step 1: Create `legend.tsx`** — tiny shared component (color dot + label)

- [ ] **Step 2: Create `telemetry-panel.tsx`**

Wraps existing `TelemetryChart` with card chrome. Adds empty state: when all data values are 0, shows pulsing skeleton + "Waiting for sensor data..." text. Column span: `lg:col-span-6`.

- [ ] **Step 3: Create `device-health-card.tsx`**

Same conic-gradient donut logic as original, but column span changed to `lg:col-span-4`. All data from props (already real from `DashboardSummary`).

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/dashboard/components/legend.tsx resources/js/pages/dashboard/components/telemetry-panel.tsx resources/js/pages/dashboard/components/device-health-card.tsx
git commit -m "feat: extract TelemetryPanel (with empty state), Legend, DeviceHealthCard"
```

---

### Task 9: Frontend — Security Score, MQTT Broker, AI Agent

**Files:**
- Create: `resources/js/pages/dashboard/components/security-score-card.tsx`
- Create: `resources/js/pages/dashboard/components/mqtt-broker-card.tsx`
- Create: `resources/js/pages/dashboard/components/ai-agent-panel.tsx`

- [ ] **Step 1: Create `security-score-card.tsx`**

Key fix: dynamic conic-gradient from `score.overall` prop (was hardcoded `78%`). Label from `score.label` (was hardcoded "Good"). Sub-scores from `score.sub_scores` (was hardcoded). Column span: `lg:col-span-4`.

- [ ] **Step 2: Create `mqtt-broker-card.tsx`**

Top row uses real MQTT health from polled `ServiceHealth` data. Sub-rows (Auth, ACL, Ports) remain static (no API to query individual subsystems — this is honest). Column span: `lg:col-span-4`.

- [ ] **Step 3: Create `ai-agent-panel.tsx`**

Removes hardcoded recommendation list. Shows: agent status pill + "Ask OpenClaw" link. When real AI recommendation data becomes available later, it can be added back via props. Column span: `lg:col-span-4`.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/dashboard/components/security-score-card.tsx resources/js/pages/dashboard/components/mqtt-broker-card.tsx resources/js/pages/dashboard/components/ai-agent-panel.tsx
git commit -m "feat: extract SecurityScoreCard (dynamic), MqttBrokerCard (live), AiAgentPanel (clean)"
```

---

### Task 10: Frontend — Device Gallery, Threat Feed, Incident Panel

**Files:**
- Create: `resources/js/pages/dashboard/components/device-gallery.tsx`
- Create: `resources/js/pages/dashboard/components/threat-feed.tsx`
- Create: `resources/js/pages/dashboard/components/incident-panel.tsx`

- [ ] **Step 1: Create `device-gallery.tsx`**

Key changes from original:
- Data from `DeviceRow[]` props (was hardcoded `deviceRows` constant)
- Sparklines removed, replaced with real RSSI signal bars (`rssiToBars()` function: `-50 → 4 bars`, `-60 → 3`, `-70 → 2`, else `1`)
- Empty state: "No devices registered" + link to add first device
- Column span: `lg:col-span-5`

- [ ] **Step 2: Create `threat-feed.tsx`**

Key changes from original:
- Events stored in local `useState` (initialized from props) for optimistic removal after triage
- Triage success: `toast.success()` + remove event from local state
- Triage error: `toast.error()`
- Empty state: green emerald card "No threats detected — System nominal"
- Column span: `lg:col-span-2`

- [ ] **Step 3: Create `incident-panel.tsx`**

Key changes from original:
- Data from `IncidentRow[]` props (was hardcoded `incidentRows` constant)
- Incident ID formatted as `INC-{id padded to 6 digits}`
- Empty state: green card "No active incidents" with checkmark
- Column span: `lg:col-span-2`

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/dashboard/components/device-gallery.tsx resources/js/pages/dashboard/components/threat-feed.tsx resources/js/pages/dashboard/components/incident-panel.tsx
git commit -m "feat: extract DeviceGallery (real RSSI), ThreatFeed (with toasts), IncidentPanel (real data)"
```

---

### Task 11: Frontend — API Auth, Operator, Service Health Bar, Mobile Header

**Files:**
- Create: `resources/js/pages/dashboard/components/api-auth-panel.tsx`
- Create: `resources/js/pages/dashboard/components/operator-spotlight.tsx`
- Create: `resources/js/pages/dashboard/components/service-health-bar.tsx`
- Create: `resources/js/pages/dashboard/components/mobile-header.tsx`

- [ ] **Step 1: Create `api-auth-panel.tsx`**

Same logic as original (token display, rotation form, copy button). Accepts `botToken` prop. Adds Sonner toast on successful rotation.

- [ ] **Step 2: Create `operator-spotlight.tsx`**

Key changes from original:
- Data from `OperatorData` props (was hardcoded)
- Shows: user avatar (initials), name, email, resolved_this_week count
- Removed: hardcoded shift schedule, hardcoded action logs (no data source)

- [ ] **Step 3: Create `service-health-bar.tsx`**

Uses `ServiceHealth[]` from polled hook. Each service gets: icon (mapped from `icon` string to Lucide component), name, version, `StatusPill`. Full-width, `lg:grid-cols-6`.

- [ ] **Step 4: Create `mobile-header.tsx`**

Existing mobile header + new compact service status strip below it:
```tsx
<div className="flex items-center gap-3 lg:hidden px-1">
    {health.map(s => (
        <div key={s.name} className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", statusColor(s.status))} />
            <span className="text-[10px] font-mono text-muted-foreground">{shortName(s.name)}</span>
        </div>
    ))}
</div>
```

Where `shortName` maps: `'Laravel App' → 'API'`, `'Mosquitto MQTT Broker' → 'MQTT'`, `'PostgreSQL' → 'DB'`, etc.

- [ ] **Step 5: Commit**

```bash
git add resources/js/pages/dashboard/components/api-auth-panel.tsx resources/js/pages/dashboard/components/operator-spotlight.tsx resources/js/pages/dashboard/components/service-health-bar.tsx resources/js/pages/dashboard/components/mobile-header.tsx
git commit -m "feat: extract ApiAuthPanel, OperatorSpotlight, ServiceHealthBar, MobileHeader"
```

---

### Task 12: Cleanup and Final Verification

**Files:**
- Delete: `resources/js/pages/dashboard.tsx` (old monolith)

- [ ] **Step 1: Verify all new components exist**

```bash
ls -la resources/js/pages/dashboard/index.tsx
ls -la resources/js/pages/dashboard/hooks/use-dashboard-health.ts
ls resources/js/pages/dashboard/components/*.tsx
```

Expected: 14 component files + 1 hook + 1 index.

- [ ] **Step 2: Delete the old monolith**

```bash
rm resources/js/pages/dashboard.tsx
```

- [ ] **Step 3: Run all backend tests**

```bash
php artisan test --compact
```

Expected: All tests pass, including updated `DashboardTest` and new service tests.

- [ ] **Step 4: Run the full PHP formatter**

```bash
vendor/bin/pint --format agent
```

- [ ] **Step 5: Build frontend to check for TypeScript errors**

```bash
npm run build
```

Expected: Clean build with no TypeScript errors. If components reference each other incorrectly, fix import paths.

- [ ] **Step 6: Commit the cleanup**

```bash
git add -A resources/js/pages/dashboard.tsx resources/js/pages/dashboard/
git commit -m "refactor: remove old dashboard.tsx monolith, use decomposed dashboard/ directory"
```
