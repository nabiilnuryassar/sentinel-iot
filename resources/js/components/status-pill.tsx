import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DeviceStatus =
    | 'online'
    | 'healthy'
    | 'warning'
    | 'offline'
    | 'quarantined'
    | 'unknown'
    | 'connected'
    | 'enabled'
    | 'open'
    | 'investigating'
    | 'mitigated'
    | 'resolved'
    | 'closed';

const STATUS_LABEL: Record<DeviceStatus, string> = {
    online: 'Online',
    healthy: 'Healthy',
    warning: 'Warning',
    offline: 'Offline',
    quarantined: 'Quarantined',
    unknown: 'Unknown',
    connected: 'Connected',
    enabled: 'Enabled',
    open: 'Open',
    investigating: 'Investigating',
    mitigated: 'Mitigated',
    resolved: 'Resolved',
    closed: 'Closed',
};

const DOT_CLASS: Record<DeviceStatus, string> = {
    online: 'bg-emerald-500',
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    offline: 'bg-red-500',
    quarantined: 'bg-rose-500',
    unknown: 'bg-slate-400',
    connected: 'bg-emerald-500',
    enabled: 'bg-emerald-500',
    open: 'bg-red-500',
    investigating: 'bg-amber-500',
    mitigated: 'bg-cyan-500',
    resolved: 'bg-emerald-500',
    closed: 'bg-slate-400',
};

const PILL_CLASS: Record<DeviceStatus, string> = {
    online: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    healthy: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    warning: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
    offline: 'border-red-400/40 bg-red-500/10 text-red-300',
    quarantined: 'border-rose-400/40 bg-rose-500/10 text-rose-300',
    unknown:
        'border-slate-400/30 bg-slate-500/10 text-slate-300',
    connected: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    enabled: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    open: 'border-red-400/40 bg-red-500/10 text-red-300',
    investigating: 'border-amber-400/35 bg-amber-500/10 text-amber-300',
    mitigated: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-300',
    resolved: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    closed: 'border-slate-400/30 bg-slate-500/10 text-slate-300',
};

interface StatusPillProps {
    status: DeviceStatus;
    className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1.5 border-transparent font-medium',
                PILL_CLASS[status],
                className,
            )}
        >
            <span
                aria-hidden
                className={cn('size-2 rounded-full', DOT_CLASS[status])}
            />
            {STATUS_LABEL[status]}
        </Badge>
    );
}
