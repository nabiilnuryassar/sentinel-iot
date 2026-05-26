import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Bot,
    Database,
    Gauge,
    HardDrive,
    RadioTower,
    Search,
    Send,
    Server,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    Wifi,
    Key,
    Copy,
    Check,
    UserCheck,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { SeverityBadge } from '@/components/severity-badge';
import type { Severity } from '@/components/severity-badge';
import { StatCard } from '@/components/stat-card';
import { StatusPill } from '@/components/status-pill';
import { TelemetryChart } from '@/components/telemetry-chart';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AppLayout } from '@/layouts/app-layout';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { index as agentIndex } from '@/routes/agent';
import { index as devicesIndex } from '@/routes/devices';
import { index as incidentsIndex } from '@/routes/incidents';
import { store as storeIncident } from '@/routes/incidents';
import { index as securityEventsIndex } from '@/routes/security-events';
import { rotate as rotateToken } from '@/routes/tokens';
import type { PageProps } from '@/types';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RecentEvent {
    id: number;
    severity: Severity;
    event_type: string;
    topic: string | null;
    detected_at: string | null;
}

interface DashboardProps {
    total_devices: number;
    online_devices: number;
    offline_devices: number;
    security_events_today: number;
    open_incidents: number;
    risk_level: RiskLevel;
    recent_telemetry: Array<{ minute: string; count: number }>;
    recent_events: RecentEvent[];
}

const RISK_COPY: Record<RiskLevel, { label: string; hint: string; score: number }> = {
    low: { label: 'Low', hint: 'Quiet monitoring window', score: 92 },
    medium: { label: 'Medium', hint: 'Security activity needs review', score: 78 },
    high: { label: 'High', hint: 'Open incidents require action', score: 62 },
    critical: { label: 'Critical', hint: 'Critical incident active', score: 36 },
};

const deviceRows = [
    ['temp-sensor-001', 'Sensor', 'online', '9 sec ago', '78%', '-42 dBm'],
    ['door-lock-001', 'Actuator', 'online', '23 sec ago', '92%', '-55 dBm'],
    ['power-meter-001', 'Meter', 'warning', '35 sec ago', '65%', '-63 dBm'],
    ['air-quality-001', 'Sensor', 'warning', '1 min ago', '41%', '-71 dBm'],
    ['water-leak-001', 'Sensor', 'offline', '5 min ago', '--', '--'],
] as const;

const incidentRows = [
    ['INC-2025-0519-007', 'Unauthorized access attempt', 'temp-sensor-001', 'Open - High', '09:41', 'high'],
    ['INC-2025-0519-006', 'Data exfiltration suspected', 'power-meter-001', 'Investigating', '09:32', 'high'],
    ['INC-2025-0519-005', 'Multiple failed logins', 'mqtt-broker', 'Investigating', '09:18', 'medium'],
    ['INC-2025-0519-004', 'Device offline', 'water-leak-001', 'Open - Low', '09:05', 'low'],
] as const;

const services = [
    ['Laravel App', 'v10.15.0', 'healthy', Server],
    ['Mosquitto MQTT Broker', 'v2.0.18', 'healthy', RadioTower],
    ['AI Agent Service', 'v1.8.3', 'online', Bot],
    ['Telegram Bot Gateway', 'v1.6.2', 'connected', Send],
    ['InfluxDB', 'v2.7.5', 'healthy', Database],
    ['PostgreSQL', 'v15.4', 'healthy', HardDrive],
] as const;

function AnimatedCounter({ value, duration = 800 }: { value: number | string; duration?: number }) {
    const numericValue = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, ''));
    const isPercent = typeof value === 'string' && value.includes('%');
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (isNaN(numericValue)) {
return;
}

        let start = 0;
        const end = numericValue;

        if (start === end) {
            const timeoutId = setTimeout(() => {
                setCount(end);
            }, 0);

            return () => {
                clearTimeout(timeoutId);
            };
        }

        const totalMiliseconds = duration;
        const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 10);
        const timer = setInterval(() => {
            start += Math.ceil(end / (totalMiliseconds / incrementTime));

            if (start >= end) {
                clearInterval(timer);
                setCount(end);
            } else {
                setCount(start);
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [numericValue, duration]);

    if (isNaN(numericValue)) {
        return <span>{value}</span>;
    }

    return <span>{count.toLocaleString()}{isPercent ? '%' : ''}</span>;
}

export default function Dashboard(props: DashboardProps) {
    const risk = RISK_COPY[props.risk_level];
    const warningDevices = Math.max(
        props.total_devices - props.online_devices - props.offline_devices,
        0,
    );
    const telemetryData = buildTelemetryData(props.recent_telemetry);

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 lg:gap-5">
                <MobileDashboardHeader />
                <PageHeader
                    title="Sentinel-IoT Dashboard"
                    subtitle="IoT Security Operations Center"
                    className="hidden lg:flex"
                />

                <section
                    aria-label="Operational summary"
                    className="grid grid-cols-2 gap-3 lg:grid-cols-6 lg:gap-4"
                >
                    <StatCard
                        title="Total Devices"
                        value={<AnimatedCounter value={props.total_devices} />}
                        subtitle="+ 12.5% vs last 7 days"
                        trend="up"
                        variant="info"
                        icon={Smartphone}
                        className="sentinel-surface"
                    />
                    <StatCard
                        title="Online Devices"
                        value={<AnimatedCounter value={props.online_devices} />}
                        subtitle="88.3% of total"
                        variant="success"
                        icon={Wifi}
                        className="sentinel-surface"
                    />
                    <StatCard
                        title="Open Incidents"
                        value={<AnimatedCounter value={props.open_incidents} />}
                        subtitle="+ 2 vs yesterday"
                        trend="down"
                        variant="danger"
                        icon={AlertTriangle}
                        className="sentinel-surface"
                    />
                    <StatCard
                        title="Security Events Today"
                        value={<AnimatedCounter value={props.security_events_today} />}
                        subtitle="+ 18.7% vs yesterday"
                        trend="up"
                        variant="info"
                        icon={ShieldCheck}
                        className="sentinel-surface"
                    />
                    <StatCard
                        title="Risk Level"
                        value={risk.label}
                        subtitle="CVSS 7.6"
                        variant="risk"
                        icon={Gauge}
                        className="sentinel-surface"
                    />
                    <StatCard
                        title="AI Recommendations"
                        value={<AnimatedCounter value={12} />}
                        subtitle="Actionable items"
                        variant="ai"
                        icon={Bot}
                        className="sentinel-surface"
                    />
                </section>

                <section className="grid gap-4 lg:grid-cols-12">
                    <Card className="sentinel-surface sentinel-grid-bg relative overflow-hidden lg:col-span-5 border-border/10">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                        />
                        <CardHeader className="flex-row items-start justify-between gap-3">
                            <div>
                                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                                    // realtime telemetry
                                </CardTitle>
                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <Legend color="bg-primary" label="Temperature (C)" />
                                    <Legend color="bg-blue-400" label="Humidity (%)" />
                                    <Legend color="bg-purple-400" label="Battery (%)" />
                                </div>
                            </div>
                            <span className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-primary">
                                Last 1h
                            </span>
                        </CardHeader>
                        <CardContent>
                            <TelemetryChart
                                data={telemetryData}
                                xKey="minute"
                                lines={[
                                    {
                                        dataKey: 'temperature',
                                        name: 'Temperature',
                                        color: 'var(--sentinel-teal)',
                                    },
                                    {
                                        dataKey: 'humidity',
                                        name: 'Humidity',
                                        color: 'var(--sentinel-blue)',
                                    },
                                    {
                                        dataKey: 'battery',
                                        name: 'Battery',
                                        color: 'var(--sentinel-purple)',
                                    },
                                ]}
                                height={220}
                            />
                        </CardContent>
                    </Card>

                    <DeviceHealthCard
                        total={props.total_devices}
                        healthy={props.online_devices}
                        warning={warningDevices}
                        offline={props.offline_devices}
                    />
                    <SecurityScoreCard score={risk.score} />
                    <MqttBrokerCard />
                </section>

                <section className="grid gap-4 lg:grid-cols-12">
                    <MonitoredDevicesGallery />
                    <LiveThreatFeed events={props.recent_events} />
                    <IncidentPanel />
                    <div className="grid gap-4 lg:col-span-3">
                        <AiAgentPanel />
                        <ApiAuthPanel />
                        <OperatorSpotlight />
                    </div>
                </section>

                <ServiceHealthBar />
            </div>
        </AppLayout>
    );
}

function MobileDashboardHeader() {
    return (
        <header className="flex items-start justify-between gap-3 lg:hidden">
            <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary">
                    <ShieldAlert aria-hidden className="size-6" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Sentinel-IoT
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        IoT Security Operations Center
                    </p>
                </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full border border-border bg-background/40">
                <Search aria-hidden className="size-5 text-muted-foreground" />
            </div>
        </header>
    );
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <span className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className={cn('size-2 rounded-full', color)} />
            {label}
        </span>
    );
}

function DeviceHealthCard({
    total,
    healthy,
    warning,
    offline,
}: {
    total: number;
    healthy: number;
    warning: number;
    offline: number;
}) {
    const healthyPct = total > 0 ? Math.round((healthy / total) * 100) : 0;
    const warningPct = total > 0 ? Math.round((warning / total) * 100) : 0;
    const offlinePct = Math.max(0, 100 - healthyPct - warningPct);

    return (
        <Card className="sentinel-surface border-border/10 lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">// device health</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-[auto_1fr] items-center gap-4">
                <div
                    className="grid size-32 place-items-center rounded-full"
                    style={{
                        background: `conic-gradient(var(--sentinel-emerald) 0 ${healthyPct}%, var(--sentinel-amber) ${healthyPct}% ${healthyPct + warningPct}%, var(--sentinel-red) ${healthyPct + warningPct}% 100%)`,
                    }}
                >
                    <div className="grid size-20 place-items-center rounded-full bg-[#050b16] text-center border border-border/10">
                        <div>
                            <div className="text-2xl font-mono font-semibold">
                                <AnimatedCounter value={total} />
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                                Total
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2 text-xs font-mono">
                    <HealthLine color="bg-emerald-400" label="Healthy" value={healthy} percent={healthyPct} />
                    <HealthLine color="bg-amber-400" label="Warning" value={warning} percent={warningPct} />
                    <HealthLine color="bg-red-400" label="Offline" value={offline} percent={offlinePct} />
                    <Link
                        href={devicesIndex.url()}
                        className="inline-flex pt-2 text-sentinel-teal hover:underline text-[10px]"
                    >
                        View all devices →
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

function HealthLine({
    color,
    label,
    value,
    percent,
}: {
    color: string;
    label: string;
    value: number;
    percent: number;
}) {
    return (
        <div>
            <div className="flex items-center gap-2 font-medium text-foreground">
                <span className={cn('size-2 rounded-full', color)} />
                {label}
            </div>
            <div className="pl-4 text-muted-foreground text-[10px]">
                {value} ({percent}%)
            </div>
        </div>
    );
}

function SecurityScoreCard({ score }: { score: number }) {
    return (
        <Card className="sentinel-surface border-border/10 lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">// security score</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mx-auto grid size-36 place-items-center rounded-full bg-[conic-gradient(var(--sentinel-teal)_0_78%,rgba(28,51,79,0.9)_78%_100%)] p-3">
                    <div className="grid size-full place-items-center rounded-full bg-[#050b16] text-center shadow-inner shadow-black/40 border border-border/10">
                        <div>
                            <div className="text-4xl font-mono font-semibold">{score}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">/100</div>
                            <div className="mt-1 text-xs font-semibold text-sentinel-teal font-mono">
                                Good
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border/10 pt-3 text-center text-[10px] font-mono">
                    {[
                        ['Identity', 82],
                        ['Network', 74],
                        ['Data', 79],
                        ['Device', 76],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <div className="text-muted-foreground">{label}</div>
                            <div className="font-semibold text-foreground">{value}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function MqttBrokerCard() {
    const rows = [
        ['Status', 'Healthy', 'healthy'],
        ['Auth', 'Enabled', 'enabled'],
        ['ACL', 'Enabled', 'enabled'],
        ['Broker Logs', 'No Errors', 'healthy'],
        ['Port 1883 (TCP)', 'Open', 'open'],
        ['Port 8883 (TLS)', 'Open', 'open'],
    ] as const;

    return (
        <Card className="sentinel-surface border-border/10 lg:col-span-3">
            <CardHeader className="flex-row items-center gap-3">
                <RadioTower aria-hidden className="size-5 text-muted-foreground" />
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">// mqtt broker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {rows.map(([label, value, status]) => (
                    <div
                        key={label}
                        className="flex items-center justify-between gap-3 border-b border-border/10 pb-2 text-xs font-mono last:border-0 last:pb-0"
                    >
                        <span className="text-muted-foreground">{label}</span>
                        <StatusPill status={status} className="shrink-0" />
                        <span className="sr-only">{value}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function MonitoredDevicesGallery() {
    const getSparklinePath = (id: string) => {
        let hash = 0;

        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }

        const points = [];

        for (let i = 0; i <= 6; i++) {
            const x = (i / 6) * 70;
            const seed = Math.abs(Math.sin(hash + i));
            const y = 8 + seed * 16;
            points.push(`${x},${y}`);
        }

        return `M ${points.join(' L ')}`;
    };

    return (
        <Card className="sentinel-surface relative overflow-hidden lg:col-span-5 border-border/10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentinel-teal/30 to-transparent"
            />
            <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">// monitored devices</CardTitle>
                <Link
                    href={devicesIndex.url()}
                    className="text-xs text-sentinel-teal hover:underline font-mono"
                >
                    fleet_view.sh →
                </Link>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {deviceRows.map(([id, type, status, seen, battery, signal]) => {
                    const isOnline = status === 'online';
                    const isWarning = status === 'warning';
                    const isOffline = status === 'offline';
                    
                    return (
                        <div
                            key={id}
                            className="group relative flex items-center justify-between gap-4 rounded-xl border border-border/10 bg-background/35 p-3 hover:border-sentinel-teal/30 hover:shadow-[0_0_12px_rgba(31,230,208,0.06)] transition-all duration-300 cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <span className="relative flex size-2 shrink-0">
                                    {isOnline && (
                                        <>
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                        </>
                                    )}
                                    {isWarning && (
                                        <>
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                            <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                                        </>
                                    )}
                                    {isOffline && (
                                        <span className="relative inline-flex size-2 rounded-full bg-red-500/60" />
                                    )}
                                </span>
                                <div>
                                    <div className="font-mono text-xs font-semibold text-foreground group-hover:text-sentinel-teal transition-colors">
                                        {id}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-mono">
                                        {type} · batt: {battery}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <svg className="h-8 w-20 shrink-0 overflow-visible" viewBox="0 0 70 32">
                                    <path
                                        d={getSparklinePath(id)}
                                        fill="none"
                                        stroke={
                                            isOnline
                                                ? 'var(--sentinel-teal)'
                                                : isWarning
                                                  ? 'var(--sentinel-amber)'
                                                  : 'var(--sentinel-red)'
                                        }
                                        strokeWidth="1.5"
                                        className="opacity-80"
                                    />
                                </svg>
                                
                                <div className="text-right font-mono text-[10px] shrink-0">
                                    <div className="text-foreground">{signal}</div>
                                    <div className="text-muted-foreground">{seen}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function LiveThreatFeed({ events }: { events: RecentEvent[] }) {
    const fallback = [
        { id: 101, event_type: 'malformed_payload', topic: 'temp-sensor-001', severity: 'high', detected_at: new Date().toISOString() },
        { id: 102, event_type: 'unauthorized_publish', topic: 'door-lock-001', severity: 'high', detected_at: new Date().toISOString() },
        { id: 103, event_type: 'topic_spoofing', topic: 'power-meter-001', severity: 'medium', detected_at: new Date().toISOString() },
        { id: 104, event_type: 'device_offline', topic: 'water-leak-001', severity: 'medium', detected_at: new Date().toISOString() },
        { id: 105, event_type: 'failed_login', topic: 'unknown', severity: 'low', detected_at: new Date().toISOString() },
    ] as const;

    const [processing, setProcessing] = useState(false);

    const handleTriage = (event: { event_type: string; topic: string | null; severity: string }) => {
        const title = `Triage: ${event.event_type.replaceAll('_', ' ')} on ${event.topic ?? 'unknown'}`;
        const deviceId = event.topic && event.topic !== 'unknown' ? event.topic : undefined;
        
        setProcessing(true);
        router.post(storeIncident.url(), {
            title,
            severity: event.severity,
            affected_device_id: deviceId,
            summary: `Auto-triaged from rolling security event threat feed. Type: ${event.event_type}.`,
        }, {
            onFinish: () => setProcessing(false),
        });
    };

    const items = events.length > 0 ? events : fallback;

    return (
        <Card className="sentinel-surface relative overflow-hidden lg:col-span-2 border-border/10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentinel-red/30 to-transparent"
            />
            <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">// threat feed</CardTitle>
                <Link
                    href={securityEventsIndex.url()}
                    className="text-xs text-sentinel-red hover:underline font-mono"
                >
                    feed.log →
                </Link>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.slice(0, 5).map((event) => (
                    <div
                        key={event.id}
                        className="group flex flex-col justify-between gap-2 rounded-xl border border-border/10 bg-background/25 p-3 hover:border-sentinel-red/30 transition-all duration-300 hover:shadow-[0_0_12px_rgba(239,68,68,0.05)]"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="truncate text-xs font-mono font-semibold text-foreground group-hover:text-sentinel-red transition-colors">
                                    {event.event_type.replaceAll('_', ' ').toUpperCase()}
                                </div>
                                <div className="truncate text-[10px] text-muted-foreground font-mono">
                                    SRC: {event.topic ?? 'unknown'}
                                </div>
                            </div>
                            <SeverityBadge severity={event.severity as Severity} />
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {formatRelative(event.detected_at)}
                            </span>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleTriage(event)}
                                className="rounded border border-sentinel-red/35 bg-sentinel-red/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-sentinel-red hover:bg-sentinel-red/20 transition-all cursor-pointer disabled:opacity-50"
                            >
                                triage_event
                            </button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function IncidentPanel() {
    return (
        <Card className="sentinel-surface border-border/10 lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">// active incidents</CardTitle>
                <Link
                    href={incidentsIndex.url()}
                    className="text-xs text-sentinel-teal hover:underline font-mono"
                >
                    incident.db →
                </Link>
            </CardHeader>
            <CardContent className="space-y-3">
                {incidentRows.map(([id, title, entity, state, time, severity]) => (
                    <div
                        key={id}
                        className={cn(
                            'rounded-xl border bg-background/35 p-3 font-mono transition-colors',
                            severity === 'high' && 'border-red-400/30 hover:border-red-400/50',
                            severity === 'medium' && 'border-amber-400/30 hover:border-amber-400/50',
                            severity === 'low' && 'border-blue-400/30 hover:border-blue-400/50',
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="text-xs font-semibold text-red-300">
                                    {id}
                                </div>
                                <div className="truncate text-xs text-foreground mt-1">{title}</div>
                                <div className="truncate text-[10px] text-muted-foreground mt-0.5">
                                    {entity} · {state}
                                </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{time}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function AiAgentPanel() {
    return (
        <Card className="sentinel-surface border-purple-400/30">
            <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Bot aria-hidden className="size-7 text-purple-300" />
                    <div>
                        <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">// ai agent</CardTitle>
                        <div className="text-[10px] text-muted-foreground font-mono">
                            OpenClaw/Hermes Co-Pilot
                        </div>
                    </div>
                </div>
                <StatusPill status="online" />
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 p-3 text-xs font-mono leading-relaxed">
                    System posture is High risk. 7 open incidents detected with
                    3 critical. Recommend immediate review of unauthorized
                    access attempts and topic spoofing events.
                </div>
                <div className="space-y-2 text-xs font-mono">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Top Recommendations
                    </div>
                    {[
                        ['Isolate device temp-sensor-001', 'High'],
                        ['Review ACL rules for topic security', 'Medium'],
                        ['Rotate MQTT credentials', 'Medium'],
                    ].map(([text, severity]) => (
                        <div key={text} className="flex items-center justify-between gap-2 border-b border-border/5 pb-1">
                            <span className="truncate">{text}</span>
                            <SeverityBadge
                                severity={severity.toLowerCase() as Severity}
                            />
                        </div>
                    ))}
                </div>
                <Link
                    href={agentIndex.url()}
                    className="flex min-h-9 items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs text-primary font-mono hover:bg-primary/20 transition-colors"
                >
                    Ask OpenClaw anything...
                    <Send aria-hidden className="size-4" />
                </Link>
            </CardContent>
        </Card>
    );
}

function ApiAuthPanel() {
    const { props } = usePage<PageProps>();
    const flash = props.flash;
    const [copied, setCopied] = useState(false);
    
    const { post, processing } = useForm();

    const handleRotate = (e: React.FormEvent) => {
        e.preventDefault();
        post(rotateToken.url());
    };

    const handleCopy = () => {
        if (flash?.new_bot_token) {
            navigator.clipboard.writeText(flash.new_bot_token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Card className="sentinel-surface relative overflow-hidden border-border/10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentinel-cyan/30 to-transparent"
            />
            <CardHeader className="flex-row items-center gap-3">
                <Key aria-hidden className="size-5 text-sentinel-cyan" />
                <div>
                    <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">// api auth keys</CardTitle>
                    <p className="text-[10px] text-muted-foreground font-mono">Active Bot Token Management</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="rounded-xl border border-border/10 bg-background/20 p-3 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Token Identity:</span>
                        <span className="text-foreground">bot-service</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Expires:</span>
                        <span className="text-sentinel-amber">Never (Rotate Required)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Scopes:</span>
                        <span className="text-sentinel-teal">ingest, query, triage</span>
                    </div>
                </div>

                {flash?.new_bot_token && (
                    <div className="relative rounded-xl border border-sentinel-teal/30 bg-sentinel-teal/5 p-3 space-y-2 animate-in fade-in zoom-in duration-300">
                        <div className="font-mono text-[10px] text-sentinel-teal uppercase tracking-wider font-semibold">
                            ⚠️ New Bot Token Generated
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 rounded-lg p-2 border border-border/10">
                            <span className="font-mono text-xs select-all truncate flex-1 text-foreground">
                                {flash.new_bot_token}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="p-1 hover:bg-border/20 rounded transition-colors text-sentinel-teal cursor-pointer"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                            </button>
                        </div>
                        <p className="text-[9px] text-muted-foreground leading-normal">
                            Store this securely. It will not be shown again. Plaintext has been saved to .env as LARAVEL_API_TOKEN.
                        </p>
                    </div>
                )}

                <form onSubmit={handleRotate}>
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex min-h-9 items-center justify-center gap-2 rounded-xl border border-sentinel-cyan/30 bg-sentinel-cyan/10 px-3 text-xs text-sentinel-cyan hover:bg-sentinel-cyan/20 transition-colors font-mono cursor-pointer font-semibold"
                    >
                        {processing ? 'ROTATING...' : 'ROTATE BOT TOKEN'}
                    </button>
                </form>
            </CardContent>
        </Card>
    );
}

function OperatorSpotlight() {
    const { props } = usePage<PageProps>();
    const user = props.auth?.user;

    return (
        <Card className="sentinel-surface relative overflow-hidden border-border/10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentinel-purple/30 to-transparent"
            />
            <CardHeader className="flex-row items-center gap-3">
                <UserCheck aria-hidden className="size-5 text-sentinel-purple" />
                <div>
                    <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">// operator spotlight</CardTitle>
                    <p className="text-[10px] text-muted-foreground font-mono">Active On-Call Security Analyst</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
                <div className="flex items-center gap-3 rounded-xl border border-border/10 bg-background/25 p-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-sentinel-purple/10 border border-sentinel-purple/20 text-sentinel-purple font-mono font-bold">
                        {user?.name ? user.name.slice(0, 2).toUpperCase() : 'OP'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-foreground">{user?.name ?? 'Unknown Operator'}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{user?.email ?? 'operator@sentinel.local'}</div>
                    </div>
                </div>

                <div className="space-y-2 border-t border-border/10 pt-3">
                    <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">SHIFT SCHEDULE:</span>
                        <span className="text-sentinel-purple">Alpha (08:00 - 16:00 UTC)</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">INCIDENTS RESOLVED WEEK:</span>
                        <span className="text-foreground font-semibold">14 incidents</span>
                    </div>
                </div>

                <div className="space-y-1.5 border-t border-border/10 pt-3">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Recent actions logs:</div>
                    <div className="space-y-1 text-[10px] text-muted-foreground">
                        <div className="flex items-start gap-1">
                            <span className="text-sentinel-purple">▸</span>
                            <span>Quarantined temp-sensor-001</span>
                        </div>
                        <div className="flex items-start gap-1">
                            <span className="text-sentinel-purple">▸</span>
                            <span>Triaged event #4208</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ServiceHealthBar() {
    return (
        <div
            aria-label="Service health"
            className="grid gap-3 rounded-2xl sentinel-surface border-border/10 p-3 shadow-lg lg:grid-cols-6"
        >
            {services.map(([name, version, status, Icon]) => (
                <div
                    key={name}
                    className="flex items-center gap-3 rounded-xl bg-background/25 p-3"
                >
                    <div className="flex size-10 items-center justify-center rounded-xl border border-border/10 bg-background/35 text-primary">
                        <Icon aria-hidden className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-xs font-mono font-semibold">{name}</div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground">
                                {version}
                            </span>
                            <StatusPill status={status} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function buildTelemetryData(data: DashboardProps['recent_telemetry']) {
    if (data.length === 0) {
        return [
            '08:45',
            '08:55',
            '09:05',
            '09:15',
            '09:25',
            '09:35',
            '09:45',
            '09:35',
        ].map((minute, index) => ({
            minute,
            temperature: 70 + index + Math.sin(index) * 4,
            humidity: 48 + index + Math.cos(index) * 3,
            battery: 23 + index * 1.5,
        }));
    }

    return data.map((row, index) => ({
        minute: row.minute,
        temperature: 68 + (row.count % 12) + Math.sin(index) * 3,
        humidity: 48 + (row.count % 10) + Math.cos(index) * 2,
        battery: 24 + (row.count % 8) + index * 0.4,
    }));
}

