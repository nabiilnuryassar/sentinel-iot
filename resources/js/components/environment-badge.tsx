import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Environment = 'production' | 'development' | 'testing';

interface EnvironmentBadgeProps {
    environment?: Environment | string;
    className?: string;
}

export function EnvironmentBadge({
    environment = 'production',
    className,
}: EnvironmentBadgeProps) {
    const normalized = environment.toLowerCase();
    const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

    return (
        <Badge
            variant="outline"
            className={cn(
                'h-9 gap-2 rounded-lg border-emerald-400/30 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-300',
                className,
            )}
        >
            <CheckCircle2 aria-hidden className="size-3.5" />
            {label}
        </Badge>
    );
}
