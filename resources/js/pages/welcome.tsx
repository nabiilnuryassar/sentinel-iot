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
    Terminal,
    Zap,
} from 'lucide-react';
import { FeatureCard } from '@/components/landing/feature-card';
import { RevealStagger, RevealItem } from '@/components/scroll-reveal';
import { GlobeHero } from '@/components/ui/globe-hero';
import { motion, useReducedMotion } from 'motion/react';

import { ContainerScroll } from '@/components/ui/container-scroll-animation';
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
    const reduce = useReducedMotion();
    return (
        <>
            <Head title="Sentinel-IoT · IoT Security Operations Center" />

            <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
                {/* Ambient glow + grid */}
                <div
                    aria-hidden
                    className="sentinel-grid-bg pointer-events-none absolute inset-0 opacity-60"
                />

                {/* Top nav */}
                <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-sentinel-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
                    >
                        <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-primary/10 shadow-[0_0_12px_rgba(31,230,208,0.18)]">
                            <img src="/images/sentinel-logo.svg" alt="Sentinel-IoT" className="size-8 object-contain" />
                        </div>
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
                <GlobeHero
                  rotationSpeed={0.004}
                  className="relative"
                >
                  {/* Terminal panel — decorative overlay */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-8 right-8 z-20 hidden w-80 rounded-2xl bg-card/20 p-4 backdrop-blur-xl lg:block"
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
                        <span className="text-sentinel-teal">$</span> sentinel watch --live
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
                        <span className="text-sentinel-teal motion-safe:animate-pulse">_</span>
                        {' '}streaming…
                      </p>
                    </div>
                  </div>

                  {/* Content block */}
                  <div className="relative z-10 mx-auto w-full max-w-5xl space-y-10 px-6 text-center">
                    <motion.div
                      initial={reduce ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="space-y-8"
                    >
                      {/* Status pill */}
                      <motion.div
                        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative inline-flex items-center gap-3 rounded-full border border-sentinel-teal/30 bg-sentinel-teal/8 px-6 py-3 backdrop-blur-xl"
                      >
                        <div className="size-2 motion-safe:animate-ping rounded-full bg-sentinel-teal" />
                        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-sentinel-teal">
                          Live · operational
                        </span>
                        <div className="size-2 motion-safe:animate-ping rounded-full bg-sentinel-teal animation-delay-500" />
                      </motion.div>

                      {/* Headline */}
                      <motion.h1
                        initial={reduce ? false : { opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="font-mono text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
                      >
                        <span className="block text-3xl font-light text-foreground/70 sm:text-4xl lg:text-5xl">
                          Defend every
                        </span>
                        <span className="relative block">
                          <span className="relative z-10 bg-linear-to-r from-sentinel-teal via-sentinel-cyan to-sentinel-purple bg-clip-text text-transparent">
                            connected device.
                          </span>
                          <span
                            aria-hidden
                            className="absolute inset-0 scale-105 bg-linear-to-r from-sentinel-teal via-sentinel-cyan to-sentinel-purple bg-clip-text text-transparent opacity-50 blur-2xl"
                          >
                            connected device.
                          </span>
                        </span>
                      </motion.h1>

                      {/* Subtext */}
                      <motion.div
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="mx-auto max-w-2xl"
                      >
                        <p className="text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl">
                          An autonomous Security Operations Center for IoT fleets.
                          Stream telemetry, detect anomalies, audit MQTT traffic,
                          and resolve incidents through an AI co-pilot.
                        </p>
                      </motion.div>
                    </motion.div>

                    {/* CTAs */}
                    <motion.div
                      initial={reduce ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1 }}
                      className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
                    >
                      <Link
                        href="/login"
                        className="group inline-flex items-center gap-2 rounded-xl bg-sentinel-teal px-5 py-3 text-sm font-semibold text-[#020617] shadow-[0_0_28px_rgba(31,230,208,0.35)] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8 sm:py-4 sm:text-base"
                      >
                        <span>Enter Console</span>
                        <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
                      <a
                        href="https://github.com/nabiilnuryassar/sentinel-iot"
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-2 rounded-xl border border-border/40 bg-card/40 px-5 py-3 text-sm font-medium text-foreground backdrop-blur-xl transition-all duration-200 hover:border-sentinel-cyan/40 hover:text-sentinel-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8 sm:py-4 sm:text-base"
                      >
                        <Code2 aria-hidden className="size-4" />
                        <span>Source</span>
                      </a>
                    </motion.div>

                    {/* Live metric ticker */}
                    <motion.div
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8, delay: 1.4 }}
                      className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-xs text-muted-foreground sm:gap-x-10"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-sentinel-emerald" />
                        1,102 devices
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-sentinel-teal" />
                        428 threats blocked
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-sentinel-cyan" />
                        184k events/day
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-sentinel-purple" />
                        99.97% uptime
                      </span>
                    </motion.div>
                  </div>
                </GlobeHero>

                {/* Dashboard Demo, scroll-animated mockup */}
                <section className="relative z-10">
                    <ContainerScroll
                        titleComponent={
                            <>
                                <p className="font-mono text-xs uppercase tracking-[0.22em] text-sentinel-teal">
                                    // the console
                                </p>
                                <h2 className="mt-4 font-mono text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                                    One dashboard.
                                    <br />
                                    <span className="bg-linear-to-r from-sentinel-teal via-sentinel-cyan to-sentinel-purple bg-clip-text text-transparent">
                                        Every device in your fleet.
                                    </span>
                                </h2>
                            </>
                        }
                    >
                        <img
                            src="/demo-screenshots/03-dashboard.png"
                            alt="Sentinel-IoT dashboard showing live device telemetry, threat feed, and incident panel"
                            className="mx-auto h-full w-full object-cover object-left-top"
                            draggable={false}
                            loading="lazy"
                        />
                    </ContainerScroll>
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

                    <RevealStagger>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <RevealItem>
                                <FeatureCard
                                    icon={BrainCircuit}
                                    title="AI Agent ChatOps"
                                    desc="Streamed-token AI co-pilot. Triage incidents, query telemetry, generate post-mortems, all in chat."
                                    accent="purple"
                                    span="sm:col-span-2"
                                />
                            </RevealItem>
                            <RevealItem>
                                <FeatureCard
                                    icon={Activity}
                                    title="Anomaly Detection"
                                    desc="Statistical + rule-based engine over real-time telemetry. Flags drift before it becomes an incident."
                                    accent="teal"
                                />
                            </RevealItem>
                            <RevealItem>
                                <FeatureCard
                                    icon={RadioTower}
                                    title="MQTT Broker Audit"
                                    desc="Per-topic ACL inspection, unauthorized publish detection, credential rotation alerts."
                                    accent="cyan"
                                />
                            </RevealItem>
                            <RevealItem>
                                <FeatureCard
                                    icon={LineChart}
                                    title="Telemetry Dashboard"
                                    desc="Per-device time-series with neon-lit charts and drill-down to the originating MQTT message."
                                    accent="emerald"
                                />
                            </RevealItem>
                            <RevealItem>
                                <FeatureCard
                                    icon={AlertTriangle}
                                    title="Incident Workflow"
                                    desc="Open → investigate → contain → report. Auto-generated incident reports with AI summary."
                                    accent="amber"
                                    span="sm:col-span-2"
                                />
                            </RevealItem>
                            <RevealItem>
                                <FeatureCard
                                    icon={Cpu}
                                    title="Device Management"
                                    desc="Inventory, fleet health, per-device policy. Quarantine on demand from any view."
                                    accent="red"
                                />
                            </RevealItem>
                        </div>
                    </RevealStagger>
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
                            © Sentinel-IoT · Built for IoT security teams.
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
