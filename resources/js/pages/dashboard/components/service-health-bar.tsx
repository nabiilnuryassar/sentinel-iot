import { Bot, Database, HardDrive, RadioTower, Send, Server } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatusPill } from '@/components/status-pill';
import type { DeviceStatus } from '@/components/status-pill';
import { cn } from '@/lib/utils';
import type { ServiceHealth } from '../types';

interface ServiceHealthBarProps {
    health: ServiceHealth[];
}

const ICON_MAP: Record<string, LucideIcon> = {
    Server,
    HardDrive,
    RadioTower,
    Bot,
    Send,
    Database,
};

function toDeviceStatus(raw: string): DeviceStatus {
    if (raw === 'error') return 'offline';
    if (raw === 'connected' || raw === 'online' || raw === 'healthy' || raw === 'enabled') {
        return raw;
    }
    return 'unknown';
}

export function ServiceHealthBar({ health }: ServiceHealthBarProps) {
    return (
        <div
            aria-label="Service health"
            className="grid gap-3 rounded-2xl border border-border/10 p-3 shadow-lg sentinel-surface lg:grid-cols-6"
        >
            {health.map((service) => {
                const Icon = ICON_MAP[service.icon] ?? Server;

                return (
                    <div
                        key={service.name}
                        className="flex items-center gap-3 rounded-xl bg-background/25 p-3"
                    >
                        <div className="flex size-10 items-center justify-center rounded-xl border border-border/10 bg-background/35 text-primary">
                            <Icon aria-hidden className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="truncate font-mono text-xs font-semibold">{service.name}</div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-muted-foreground">
                                    {service.version}
                                </span>
                                <StatusPill status={toDeviceStatus(service.status)} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
