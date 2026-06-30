import { Search, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceHealth } from '../types';

interface MobileDashboardHeaderProps {
    health: ServiceHealth[];
}

const SHORT_NAMES: Record<string, string> = {
    'Laravel App': 'API',
    'Mosquitto MQTT Broker': 'MQTT',
    'PostgreSQL': 'DB',
    'AI Agent Service': 'AI',
    'Telegram Bot Gateway': 'TG',
    'InfluxDB': 'TSDB',
};

function shortName(name: string): string {
    return SHORT_NAMES[name] ?? name.slice(0, 4);
}

function statusColor(status: string): string {
    return status === 'healthy' || status === 'online' || status === 'connected'
        ? 'bg-emerald-400'
        : 'bg-red-400';
}

export function MobileDashboardHeader({ health }: MobileDashboardHeaderProps) {
    return (
        <div className="lg:hidden">
            <header className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary">
                        <ShieldAlert aria-hidden className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Sentinel-IoT</h1>
                        <p className="text-xs text-muted-foreground">
                            IoT Security Operations Center
                        </p>
                    </div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-full border border-border bg-background/40">
                    <Search aria-hidden className="size-5 text-muted-foreground" />
                </div>
            </header>
            {health.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-3 px-1">
                    {health.map((s) => (
                        <div key={s.name} className="flex items-center gap-1.5">
                            <span
                                className={cn(
                                    'size-1.5 rounded-full',
                                    statusColor(s.status),
                                )}
                            />
                            <span className="font-mono text-[10px] text-muted-foreground">
                                {shortName(s.name)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
