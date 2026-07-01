import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { index as devicesIndex } from '@/routes/devices';
import { AnimatedCounter } from './animated-counter';

interface DeviceHealthCardProps {
    total: number;
    healthy: number;
    warning: number;
    offline: number;
}

export function DeviceHealthCard({ total, healthy, warning, offline }: DeviceHealthCardProps) {
    const healthyPct = total > 0 ? Math.round((healthy / total) * 100) : 0;
    const warningPct = total > 0 ? Math.round((warning / total) * 100) : 0;
    const offlinePct = Math.max(0, 100 - healthyPct - warningPct);

    return (
        <Card className="sentinel-surface relative overflow-hidden border-border/10 lg:col-span-5">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
            />
            <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    // device health
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-5">
                {/* Donut chart — centered & larger */}
                <div
                    className="grid size-40 place-items-center rounded-full shadow-[0_0_24px_rgba(52,211,153,0.08)]"
                    style={{
                        background: `conic-gradient(var(--sentinel-emerald) 0 ${healthyPct}%, var(--sentinel-amber) ${healthyPct}% ${healthyPct + warningPct}%, var(--sentinel-red) ${healthyPct + warningPct}% 100%)`,
                    }}
                >
                    <div className="grid size-28 place-items-center rounded-full border border-border/10 bg-[#050b16] text-center shadow-inner shadow-black/40">
                        <div>
                            <div className="font-mono text-3xl font-semibold">
                                <AnimatedCounter value={total} />
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground">Total Devices</div>
                        </div>
                    </div>
                </div>

                {/* Legend rows with progress bars */}
                <div className="w-full space-y-3 font-mono text-xs">
                    <HealthLine color="bg-emerald-400" label="Healthy" value={healthy} percent={healthyPct} />
                    <HealthLine color="bg-amber-400" label="Warning" value={warning} percent={warningPct} />
                    <HealthLine color="bg-red-400" label="Offline" value={offline} percent={offlinePct} />
                </div>

                <Link
                    href={devicesIndex.url()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/8 py-2 font-mono text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/15"
                >
                    View all devices →
                </Link>
            </CardContent>
        </Card>
    );
}

function HealthLine({ color, label, value, percent }: { color: string; label: string; value: number; percent: number }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-foreground">
                    <span className={cn('size-2 rounded-full', color)} />
                    {label}
                </div>
                <span className="text-muted-foreground">
                    {value} <span className="text-[10px]">({percent}%)</span>
                </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/20">
                <div
                    className={cn('h-full rounded-full transition-all duration-700', color)}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
