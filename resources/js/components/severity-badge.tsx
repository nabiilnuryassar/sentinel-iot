import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

const SEVERITY_LABEL: Record<Severity, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
};

const SEVERITY_CLASS: Record<Severity, string> = {
    low: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-300',
    medium: 'border-amber-400/35 bg-amber-400/10 text-amber-300',
    high: 'border-red-400/40 bg-red-400/15 text-red-300',
    critical:
        'border-rose-400/50 bg-rose-400/20 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.18)]',
};

interface SeverityBadgeProps {
    severity: Severity;
    className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'font-semibold tracking-wide uppercase',
                SEVERITY_CLASS[severity],
                className,
            )}
        >
            {SEVERITY_LABEL[severity]}
        </Badge>
    );
}
