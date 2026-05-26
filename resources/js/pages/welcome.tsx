import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Bot,
    BrainCircuit,
    Cpu,
    Database,
    Code2,
    LineChart,
    Lock,
    RadioTower,
    ShieldCheck,
    Terminal,
    Zap,
} from 'lucide-react';
import { FeatureCard } from '@/components/landing/feature-card';
import { MetricTicker } from '@/components/landing/metric-ticker';

const STACK_BADGES = [
    'Laravel 13',
    'React 19',
    'Inertia v3',
    'Tailwind v4',
    'TypeScript',
    'PostgreSQL',
    'Mosquitto MQTT',
    'Sanctum',
    'Pest 4',
];

export default function Welcome() {
    return (
        <>
            <Head title="Sentinel-IoT — IoT Security Operations Center" />

            <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
                {/* Ambient glow + grid */}
                <div
                    aria-hidden
                    className="sentinel-grid-bg pointer-events-none absolute inset-0 opacity-60"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-sentinel-teal/10 blur-3xl"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute right-0 top-1/3 size-[28rem] rounded-full bg-sentinel-purple/10 blur-3xl"
                />

                {/* Top nav */}
                <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-sentinel-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
                    >
                        <span className="relative flex size-9 items-center justify-center rounded-lg bg-sentinel-teal/15 text-sentinel-teal">
                            <ShieldCheck aria-hidden className="size-5" />
                            <span
                                aria-hidden
                                className="absolute inset-0 rounded-lg ring-1 ring-sentinel-teal/40"
                            />
                        </span>
                        <span className="font-mono text-sm font-semibold tracking-wider">
                            SENTINEL<span className="text-sentinel-teal">/</span>IOT
                        </span>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="/login"
                            className="rounded-lg border border-sentinel-teal/40 bg-sentinel-teal/10 px-4 py-2 text-sm font-medium text-sentinel-teal transition-colors duration-200 hover:bg-sentinel-teal/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            Sign in
                        </Link>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-24 lg:pt-16">
                    <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 rounded-full border border-sentinel-teal/30 bg-sentinel-teal/8 px-3 py-1 text-xs font-medium text-sentinel-teal">
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-sentinel-teal opacity-60" />
                                    <span className="relative inline-flex size-2 rounded-full bg-sentinel-teal" />
                                </span>
                                <span className="font-mono uppercase tracking-[0.18em]">
                                    Live SOC · v1.0
                                </span>
                            </div>

                            <h1 className="mt-6 font-mono text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                                Defend every
                                <br />
                                <span className="bg-linear-to-r from-sentinel-teal via-sentinel-cyan to-sentinel-purple bg-clip-text text-transparent [text-shadow:0_0_40px_rgba(31,230,208,0.25)]">
                                    connected device.
                                </span>
                            </h1>

                            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                                Sentinel-IoT is an autonomous Security
                                Operations Center for IoT fleets. Stream
                                telemetry, detect anomalies, audit MQTT
                                traffic, and resolve incidents through an AI
                                co-pilot — all in one neon-lit console.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/login"
                                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-sentinel-teal px-5 py-3 text-sm font-semibold text-[#020617] shadow-[0_0_28px_rgba(31,230,208,0.35)] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    Enter Console
                                    <ArrowRight
                                        aria-hidden
                                        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                    />
                                </Link>
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/40 px-5 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:border-sentinel-cyan/40 hover:text-sentinel-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    <Code2 aria-hidden className="size-4" />
                                    Source
                                </a>
                            </div>

                            {/* Live ticker */}
                            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                                <MetricTicker label="Devices monitored" target={1102} />
                                <MetricTicker label="Threats blocked" target={428} />
                                <MetricTicker label="MQTT events / day" target={184230} />
                                <MetricTicker label="Uptime" target={99.97} suffix="%" />
                            </div>
                        </div>

                        {/* Hero terminal panel */}
                        <div
                            aria-hidden
                            className="sentinel-surface relative w-full max-w-md rounded-2xl p-5 lg:w-[28rem] lg:flex-shrink-0"
                        >
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full bg-sentinel-red/80" />
                                <span className="size-2.5 rounded-full bg-sentinel-amber/80" />
                                <span className="size-2.5 rounded-full bg-sentinel-emerald/80" />
                                <span className="ml-3 font-mono text-xs text-muted-foreground">
                                    sentinel://soc/live
                                </span>
                            </div>
                            <div className="mt-4 space-y-2 font-mono text-xs leading-relaxed">
                                <p className="text-muted-foreground">
                                    <span className="text-sentinel-teal">$</span> sentinel
                                    watch --live
                                </p>
                                <p className="text-sentinel-cyan">
                                    [09:41] anomaly@temp-sensor-001 → spike +312%
                                </p>
                                <p className="text-sentinel-amber">
                                    [09:41] mqtt.audit → unauthorized-publish blocked
                                </p>
                                <p className="text-sentinel-purple">
                                    [09:41] agent.recommend → isolate device
                                </p>
                                <p className="text-sentinel-emerald">
                                    [09:42] incident:INC-0519-007 → contained ✓
                                </p>
                                <p className="text-muted-foreground">
                                    <span className="text-sentinel-teal animate-pulse">
                                        ▮
                                    </span>{' '}
                                    streaming…
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features bento */}
                <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                    <div className="mb-10 max-w-2xl">
                        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sentinel-teal">
                            // capabilities
                        </p>
                        <h2 className="mt-3 font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                            One console. Every IoT signal.
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                            From sensor-level telemetry to broker policy, every
                            layer is monitored, audited, and explainable.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            icon={BrainCircuit}
                            title="AI Agent ChatOps"
                            desc="Streamed-token AI co-pilot. Triage incidents, query telemetry, generate post-mortems — all in chat."
                            accent="purple"
                            span="sm:col-span-2"
                        />
                        <FeatureCard
                            icon={Activity}
                            title="Anomaly Detection"
                            desc="Statistical + rule-based engine over real-time telemetry. Flags drift before it becomes an incident."
                            accent="teal"
                        />
                        <FeatureCard
                            icon={RadioTower}
                            title="MQTT Broker Audit"
                            desc="Per-topic ACL inspection, unauthorized publish detection, credential rotation alerts."
                            accent="cyan"
                        />
                        <FeatureCard
                            icon={LineChart}
                            title="Telemetry Dashboard"
                            desc="Per-device time-series with neon-lit charts and drill-down to the originating MQTT message."
                            accent="emerald"
                        />
                        <FeatureCard
                            icon={AlertTriangle}
                            title="Incident Workflow"
                            desc="Open → investigate → contain → report. Auto-generated incident reports with AI summary."
                            accent="amber"
                            span="sm:col-span-2"
                        />
                        <FeatureCard
                            icon={Cpu}
                            title="Device Management"
                            desc="Inventory, fleet health, per-device policy. Quarantine on demand from any view."
                            accent="red"
                        />
                    </div>
                </section>

                {/* Architecture strip */}
                <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                    <div className="sentinel-surface rounded-3xl p-6 sm:p-10">
                        <div className="grid gap-8 lg:grid-cols-3">
                            <div>
                                <div className="inline-flex size-11 items-center justify-center rounded-xl bg-sentinel-teal/12 text-sentinel-teal">
                                    <Terminal aria-hidden className="size-5" />
                                </div>
                                <h3 className="mt-4 font-mono text-lg font-semibold">
                                    Built for the SOC
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Keyboard-first navigation. Mono-spaced data
                                    columns. Every chart is also a query.
                                </p>
                            </div>
                            <div>
                                <div className="inline-flex size-11 items-center justify-center rounded-xl bg-sentinel-cyan/12 text-sentinel-cyan">
                                    <Database aria-hidden className="size-5" />
                                </div>
                                <h3 className="mt-4 font-mono text-lg font-semibold">
                                    Open data plane
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    PostgreSQL for state, Mosquitto for the
                                    broker, your LLM of choice for the agent.
                                </p>
                            </div>
                            <div>
                                <div className="inline-flex size-11 items-center justify-center rounded-xl bg-sentinel-purple/12 text-sentinel-purple">
                                    <Lock aria-hidden className="size-5" />
                                </div>
                                <h3 className="mt-4 font-mono text-lg font-semibold">
                                    Auth that respects you
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Sanctum tokens for bots, SPA cookies for
                                    humans, audit trail for everything.
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-wrap gap-2">
                            {STACK_BADGES.map((s) => (
                                <span
                                    key={s}
                                    className="rounded-full border border-border bg-card/40 px-3 py-1 font-mono text-xs text-muted-foreground"
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl border border-sentinel-teal/30 bg-linear-to-br from-sentinel-teal/15 via-sentinel-cyan/5 to-sentinel-purple/15 p-8 sm:p-12">
                        <div
                            aria-hidden
                            className="sentinel-grid-bg pointer-events-none absolute inset-0 opacity-50"
                        />
                        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <h2 className="font-mono text-2xl font-semibold sm:text-3xl">
                                    Ready when your fleet is.
                                </h2>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    Sign in to your SOC, point your devices at
                                    the broker, and watch the agent take its
                                    first shift.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/login"
                                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-sentinel-teal px-5 py-3 text-sm font-semibold text-[#020617] shadow-[0_0_28px_rgba(31,230,208,0.4)] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    Enter Console
                                    <ArrowRight
                                        aria-hidden
                                        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                    />
                                </Link>
                                <a
                                    href="#features"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/40 px-5 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:border-sentinel-cyan/40 hover:text-sentinel-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    <Zap aria-hidden className="size-4" />
                                    Read the docs
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="relative z-10 border-t border-border/60">
                    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                        <p className="font-mono">
                            © Sentinel-IoT — Built for IoT security teams.
                        </p>
                        <div className="flex items-center gap-4 font-mono">
                            <span className="inline-flex items-center gap-1.5">
                                <Bot aria-hidden className="size-3.5" />
                                AI online
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <RadioTower aria-hidden className="size-3.5" />
                                MQTT 1883
                            </span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
