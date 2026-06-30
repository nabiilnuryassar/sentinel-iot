import { Link } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { index as incidentsIndex } from '@/routes/incidents';
import type { IncidentRow } from '../types';

interface IncidentPanelProps {
    incidents: IncidentRow[];
}

const SEVERITY_BORDER: Record<string, string> = {
    critical: 'border-rose-400/30 hover:border-rose-400/50',
    high: 'border-red-400/30 hover:border-red-400/50',
    medium: 'border-amber-400/30 hover:border-amber-400/50',
    low: 'border-blue-400/30 hover:border-blue-400/50',
};

export function IncidentPanel({ incidents }: IncidentPanelProps) {
    if (incidents.length === 0) {
        return (
            <Card className="sentinel-surface border-emerald-400/30 lg:col-span-2">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle className="mb-2 size-8 text-emerald-400" />
                    <div className="font-mono text-sm text-emerald-300">No active incidents</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="sentinel-surface border-border/10 lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    // active incidents
                </CardTitle>
                <Link
                    href={incidentsIndex.url()}
                    className="font-mono text-xs text-sentinel-teal hover:underline"
                >
                    incident.db →
                </Link>
            </CardHeader>
            <CardContent className="space-y-3">
                {incidents.map((incident) => (
                    <div
                        key={incident.id}
                        className={cn(
                            'rounded-xl border bg-background/35 p-3 font-mono transition-colors',
                            SEVERITY_BORDER[incident.severity] ?? 'border-border/10',
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="text-xs font-semibold text-red-300">
                                    INC-{String(incident.id).padStart(6, '0')}
                                </div>
                                <div className="mt-1 truncate text-xs text-foreground">{incident.title}</div>
                                <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                    {incident.device_id ?? 'unknown'} · {incident.status}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
