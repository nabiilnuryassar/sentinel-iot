import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    label?: string;
    title?: string;
    value: ReactNode;
    hint?: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    variant?: 'info' | 'success' | 'warning' | 'danger' | 'ai' | 'risk';
    icon?: LucideIcon;
    className?: string;
}

const VARIANT_CLASS: Record<NonNullable<StatCardProps['variant']>, string> = {
    info: 'border-cyan-400/35 from-cyan-500/12',
    success: 'border-emerald-400/35 from-emerald-500/12',
    warning: 'border-amber-400/35 from-amber-500/12',
    danger: 'border-red-400/40 from-red-500/14',
    ai: 'border-purple-400/40 from-purple-500/14',
    risk: 'border-orange-400/40 from-orange-500/14',
};

const ICON_CLASS: Record<NonNullable<StatCardProps['variant']>, string> = {
    info: 'bg-cyan-500/12 text-cyan-300',
    success: 'bg-emerald-500/12 text-emerald-300',
    warning: 'bg-amber-500/12 text-amber-300',
    danger: 'bg-red-500/12 text-red-300',
    ai: 'bg-purple-500/12 text-purple-300',
    risk: 'bg-orange-500/12 text-orange-300',
};

export function StatCard({
    label,
    title,
    value,
    hint,
    subtitle,
    trend = 'neutral',
    variant = 'info',
    icon: Icon,
    className,
}: StatCardProps) {
    const heading = title ?? label;
    const detail = subtitle ?? hint;
    const TrendIcon =
        trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : ArrowRight;

    return (
        <Card
            className={cn(
                'gap-2 bg-linear-to-br to-transparent',
                VARIANT_CLASS[variant],
                className,
            )}
        >
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {heading}
                </CardTitle>
                {Icon ? (
                    <CardAction>
                        <span
                            className={cn(
                                'flex size-10 items-center justify-center rounded-full',
                                ICON_CLASS[variant],
                            )}
                        >
                            <Icon aria-hidden className="size-5 shrink-0" />
                        </span>
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-1">
                <div className="text-2xl font-semibold tracking-tight">
                    {value}
                </div>
                {detail ? (
                    <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendIcon
                            aria-hidden
                            className={cn(
                                'size-3.5',
                                trend === 'up' && 'text-emerald-300',
                                trend === 'down' && 'text-red-300',
                            )}
                        />
                        {detail}
                    </CardDescription>
                ) : null}
            </CardContent>
        </Card>
    );
}
