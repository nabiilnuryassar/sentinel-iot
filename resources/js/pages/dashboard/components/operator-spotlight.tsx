import { UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OperatorData } from '../types';

interface OperatorSpotlightProps {
    operator: OperatorData;
}

export function OperatorSpotlight({ operator }: OperatorSpotlightProps) {
    return (
        <Card className="sentinel-surface relative overflow-hidden border-border/10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentinel-purple/30 to-transparent"
            />
            <CardHeader className="flex-row items-center gap-3">
                <UserCheck aria-hidden className="size-5 text-sentinel-purple" />
                <div>
                    <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                        // operator spotlight
                    </CardTitle>
                    <p className="font-mono text-[10px] text-muted-foreground">Active Security Analyst</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
                <div className="flex items-center gap-3 rounded-xl border border-border/10 bg-background/25 p-3">
                    <div className="flex size-9 items-center justify-center rounded-xl border border-sentinel-purple/20 bg-sentinel-purple/10 font-mono text-sm font-bold text-sentinel-purple">
                        {operator.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-foreground">{operator.name}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{operator.email}</div>
                    </div>
                </div>

                <div className="space-y-2 border-t border-border/10 pt-3">
                    <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">INCIDENTS RESOLVED WEEK:</span>
                        <span className="font-semibold text-foreground">{operator.resolved_this_week} incidents</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
