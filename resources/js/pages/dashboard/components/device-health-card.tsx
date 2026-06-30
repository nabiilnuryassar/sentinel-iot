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
        <Card className="sentinel-surface border-border/10 lg:col-span-4">
            <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    // device health
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-[auto_1fr] items-center gap-4">
                <div
                    className="grid size-32 place-items-center rounded-full"
                    style={{
                        background: `conic-gradient(var(--sentinel-emerald) 0 ${healthyPct}%, var(--sentinel-amber) ${healthyPct}% ${healthyPct + warningPct}%, var(--sentinel-red) ${healthyPct + warningPct}% 100%)`,
                    }}
                >
                    <div className="grid size-20 place-items-center rounded-full border border-border/10 bg-[#050b16] text-center">
                        <div>
                            <div className="font-mono text-2xl font-semibold">
                                <AnimatedCounter value={total} />
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground">Total</div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2 font-mono text-xs">
                    <HealthLine color="bg-emerald-400" label="Healthy" value={healthy} percent={healthyPct} />
                    <HealthLine color="bg-amber-400" label="Warning" value={warning} percent={warningPct} />
                    <HealthLine color="bg-red-400" label="Offline" value={offline} percent={offlinePct} />
                    <Link
                        href={devicesIndex.url()}
                        className="inline-flex pt-2 text-[10px] text-sentinel-teal hover:underline"
                    >
                        View all devices →
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

function HealthLine({ color, label, value, percent }: { color: string; label: string; value: number; percent: number }) {
    return (
        <div>
            <div className="flex items-center gap-2 font-medium text-foreground">
                <span className={cn('size-2 rounded-full', color)} />
                {label}
            </div>
            <div className="pl-4 text-[10px] text-muted-foreground">
                {value} ({percent}%)
            </div>
        </div>
    );
}
