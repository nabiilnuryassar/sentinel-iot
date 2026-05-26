import type { LucideIcon } from 'lucide-react';
import { Bot, RadioTower, Search, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import { EnvironmentBadge } from '@/components/environment-badge';
import { StatusPill } from '@/components/status-pill';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    subtitle: string;
    actions?: ReactNode;
    compact?: boolean;
    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    actions,
    compact = false,
    className,
}: PageHeaderProps) {
    return (
        <header
            className={cn(
                'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between',
                className,
            )}
        >
            <div className="min-w-0">
                <h1
                    className={cn(
                        'truncate font-semibold tracking-tight text-foreground',
                        compact ? 'text-xl' : 'text-2xl lg:text-3xl',
                    )}
                >
                    {title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {subtitle}
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {actions ?? (
                    <>
                        <div className="hidden min-w-[280px] items-center gap-2 rounded-xl border border-border bg-background/35 px-3 py-2 text-sm text-muted-foreground shadow-inner shadow-black/20 md:flex xl:min-w-[380px]">
                            <Search aria-hidden className="size-4" />
                            <span>Search devices, topics, incidents...</span>
                        </div>
                        <EnvironmentBadge />
                        <div className="hidden items-center gap-3 lg:flex">
                            <HeaderStatus
                                icon={RadioTower}
                                label="MQTT Broker"
                                status="healthy"
                            />
                            <HeaderStatus
                                icon={Bot}
                                label="AI Agent"
                                status="online"
                            />
                            <HeaderStatus
                                icon={Send}
                                label="Telegram Bot"
                                status="connected"
                            />
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}

interface HeaderStatusProps {
    icon: LucideIcon;
    label: string;
    status: 'healthy' | 'online' | 'connected';
}

function HeaderStatus({ icon: Icon, label, status }: HeaderStatusProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon aria-hidden className="size-4" />
            </div>
            <div className="leading-tight">
                <div className="text-xs text-muted-foreground">{label}</div>
                <StatusPill status={status} className="h-5 px-0 text-xs" />
            </div>
        </div>
    );
}
