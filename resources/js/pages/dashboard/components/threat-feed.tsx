import { Link, router } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SeverityBadge } from '@/components/severity-badge';
import type { Severity } from '@/components/severity-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelative } from '@/lib/format';
import { index as securityEventsIndex } from '@/routes/security-events';
import { store as storeIncident } from '@/routes/incidents';
import type { RecentEvent } from '../types';

interface ThreatFeedProps {
    events: RecentEvent[];
}

export function ThreatFeed({ events: initialEvents }: ThreatFeedProps) {
    const [events, setEvents] = useState(initialEvents);
    const [processing, setProcessing] = useState(false);

    const handleTriage = (event: RecentEvent) => {
        const title = `Triage: ${event.event_type.replaceAll('_', ' ')} on ${event.topic ?? 'unknown'}`;
        const deviceId = event.topic && event.topic !== 'unknown' ? event.topic : undefined;

        setProcessing(true);
        router.post(
            storeIncident.url(),
            {
                title,
                severity: event.severity,
                affected_device_id: deviceId,
                summary: `Auto-triaged from rolling security event threat feed. Type: ${event.event_type}.`,
            },
            {
                onSuccess: () => {
                    toast.success(`Incident created from ${event.event_type}`);
                    setEvents((prev) => prev.filter((e) => e.id !== event.id));
                },
                onError: () => {
                    toast.error('Failed to create incident — try again');
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    if (events.length === 0) {
        return (
            <Card className="sentinel-surface border-emerald-400/30 lg:col-span-2">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <ShieldCheck className="mb-2 size-8 text-emerald-400" />
                    <div className="font-mono text-sm text-emerald-300">No threats detected</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">System nominal</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="sentinel-surface relative overflow-hidden border-border/10 lg:col-span-2">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentinel-red/30 to-transparent"
            />
            <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    // threat feed
                </CardTitle>
                <Link
                    href={securityEventsIndex.url()}
                    className="font-mono text-xs text-sentinel-red hover:underline"
                >
                    feed.log →
                </Link>
            </CardHeader>
            <CardContent className="space-y-3">
                {events.slice(0, 5).map((event) => (
                    <div
                        key={event.id}
                        className="group flex flex-col justify-between gap-2 rounded-xl border border-border/10 bg-background/25 p-3 transition-all duration-300 hover:border-sentinel-red/30 hover:shadow-[0_0_12px_rgba(239,68,68,0.05)]"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="truncate font-mono text-xs font-semibold text-foreground transition-colors group-hover:text-sentinel-red">
                                    {event.event_type.replaceAll('_', ' ').toUpperCase()}
                                </div>
                                <div className="truncate font-mono text-[10px] text-muted-foreground">
                                    SRC: {event.topic ?? 'unknown'}
                                </div>
                            </div>
                            <SeverityBadge severity={event.severity as Severity} />
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground">
                                {formatRelative(event.detected_at)}
                            </span>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleTriage(event)}
                                className="cursor-pointer rounded border border-sentinel-red/35 bg-sentinel-red/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-sentinel-red transition-all hover:bg-sentinel-red/20 disabled:opacity-50"
                            >
                                triage_event
                            </button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
