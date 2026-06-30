import { cn } from '@/lib/utils';

interface LegendProps {
    color: string;
    label: string;
}

export function Legend({ color, label }: LegendProps) {
    return (
        <span className="flex items-center gap-1.5 font-mono text-[10px]">
            <span aria-hidden className={cn('size-2 rounded-full', color)} />
            {label}
        </span>
    );
}
