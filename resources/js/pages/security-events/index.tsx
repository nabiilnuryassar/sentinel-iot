import { Head, Link, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { FilePlus2 } from 'lucide-react';
import { useState } from 'react';
import IncidentController from '@/actions/App/Http/Controllers/IncidentController';
import { DataTable } from '@/components/data-table';
import { Pagination } from '@/components/pagination';
import { PageHeader } from '@/components/page-header';
import { SeverityBadge } from '@/components/severity-badge';
import type { Severity } from '@/components/severity-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/layouts/app-layout';
import { formatRelative } from '@/lib/format';
import { index as incidentsIndex } from '@/routes/incidents';
import { index as securityEventsIndex } from '@/routes/security-events';
import type { Paginated } from '@/types';

interface SecurityEventRow {
    id: number;
    event_type: string;
    severity: Severity;
    source_client_id: string | null;
    topic: string | null;
    description: string | null;
    detected_at: string | null;
}

interface SecurityEventsProps {
    events: Paginated<SecurityEventRow>;
    event_types: string[];
    filters: {
        severity: Severity | null;
        event_type: string | null;
    };
}

const ALL_VALUE = '__all__';

const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];

interface CreateForm {
    title: string;
    severity: Severity;
    affected_device_id: string;
    summary: string;
}

/**
 * Topic format is `iot/{building}/{room}/{device_id}/{telemetry|event}`
 * (PRD §12.1). Extract the device segment when present so a brand-new
 * incident lands pre-populated; fall back to the source_client_id, then
 * blank.
 */
function deriveAffectedDeviceId(event: SecurityEventRow): string {
    if (event.topic) {
        const parts = event.topic.split('/').filter(Boolean);

        if (parts.length >= 5) {
            return parts[3] ?? '';
        }
    }

    return event.source_client_id ?? '';
}

function buildIncidentTitle(event: SecurityEventRow): string {
    const tail = event.topic ?? event.source_client_id ?? `event-${event.id}`;
    const raw = `Investigate ${event.event_type} on ${tail}`;

    return raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;
}

function buildIncidentSummary(event: SecurityEventRow): string {
    const desc = event.description ?? '';
    const truncated = desc.length > 200 ? `${desc.slice(0, 200)}...` : desc;
    const ref = `Source: SecurityEvent #${event.id}`;

    return truncated ? `${truncated}\n\n${ref}` : ref;
}

interface CreateIncidentDialogProps {
    event: SecurityEventRow;
    open: boolean;
    onOpenChange: (next: boolean) => void;
}

function CreateIncidentDialog({
    event,
    open,
    onOpenChange,
}: CreateIncidentDialogProps) {
    const form = useForm<CreateForm>({
        title: buildIncidentTitle(event),
        severity: event.severity,
        affected_device_id: deriveAffectedDeviceId(event),
        summary: buildIncidentSummary(event),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(IncidentController.store().url, {
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create incident from event</DialogTitle>
                    <DialogDescription>
                        Pre-filled from security event #{event.id}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="space-y-1">
                        <Label htmlFor={`title-${event.id}`}>Title</Label>
                        <Input
                            id={`title-${event.id}`}
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            required
                        />
                        {form.errors.title && (
                            <p className="text-xs text-red-500">
                                {form.errors.title}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`severity-${event.id}`}>Severity</Label>
                        <Select
                            value={form.data.severity}
                            onValueChange={(v) =>
                                form.setData('severity', v as Severity)
                            }
                        >
                            <SelectTrigger id={`severity-${event.id}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">
                                    Critical
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`device-${event.id}`}>
                            Affected device ID
                        </Label>
                        <Input
                            id={`device-${event.id}`}
                            value={form.data.affected_device_id}
                            onChange={(e) =>
                                form.setData(
                                    'affected_device_id',
                                    e.target.value,
                                )
                            }
                            placeholder="optional"
                        />
                        {form.errors.affected_device_id && (
                            <p className="text-xs text-red-500">
                                {form.errors.affected_device_id}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`summary-${event.id}`}>Summary</Label>
                        <Textarea
                            id={`summary-${event.id}`}
                            value={form.data.summary}
                            onChange={(e) =>
                                form.setData('summary', e.target.value)
                            }
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Create incident
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CreateIncidentAction({ event }: { event: SecurityEventRow }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <FilePlus2 aria-hidden className="size-3.5" />
                Create incident
            </Button>
            {open ? (
                <CreateIncidentDialog
                    event={event}
                    open={open}
                    onOpenChange={setOpen}
                />
            ) : null}
        </>
    );
}

const columns: ColumnDef<SecurityEventRow>[] = [
    {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
    },
    {
        accessorKey: 'event_type',
        header: 'Event',
        cell: ({ row }) => (
            <span className="font-mono text-xs">{row.original.event_type}</span>
        ),
    },
    {
        accessorKey: 'source_client_id',
        header: 'Source',
        cell: ({ row }) => (
            <span className="font-mono text-xs text-muted-foreground">
                {row.original.source_client_id ?? '-'}
            </span>
        ),
    },
    {
        accessorKey: 'topic',
        header: 'Topic',
        cell: ({ row }) => (
            <span className="font-mono text-xs text-muted-foreground">
                {row.original.topic ?? '-'}
            </span>
        ),
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
            <span className="text-xs">{row.original.description ?? '-'}</span>
        ),
    },
    {
        accessorKey: 'detected_at',
        header: 'Detected',
        cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
                {formatRelative(row.original.detected_at)}
            </span>
        ),
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => <CreateIncidentAction event={row.original} />,
    },
];

export default function SecurityEventsIndex({
    events,
    event_types,
    filters,
}: SecurityEventsProps) {
    const form = useForm<{ severity: string; event_type: string }>({
        severity: filters.severity ?? '',
        event_type: filters.event_type ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.get(securityEventsIndex.url(), {
            preserveState: true,
        });
    };

    return (
        <AppLayout>
            <Head title="Security Events" />
            <div className="flex flex-col gap-6">
                <PageHeader
                    title="Incidents & Security"
                    subtitle="Monitor - Detect - Respond"
                    actions={<FilePlus2 aria-hidden className="size-5 text-muted-foreground" />}
                />

                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-background/25 p-1 md:hidden">
                    <span className="min-h-10 rounded-xl bg-primary/15 px-3 py-2 text-center text-sm font-semibold text-primary">
                        Security Events
                    </span>
                    <Link
                        href={incidentsIndex.url()}
                        className="min-h-10 rounded-xl px-3 py-2 text-center text-sm font-medium text-muted-foreground"
                    >
                        Incidents
                    </Link>
                </div>

                <Card className="sentinel-surface border border-border/10 hidden md:flex">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Filter
                        </CardTitle>
                        <CardDescription>
                            Filter by severity or event type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submit}
                            className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                        >
                            <div className="space-y-1">
                                <Label htmlFor="severity">Severity</Label>
                                <Select
                                    value={form.data.severity || ALL_VALUE}
                                    onValueChange={(v) =>
                                        form.setData(
                                            'severity',
                                            v === ALL_VALUE ? '' : v,
                                        )
                                    }
                                >
                                    <SelectTrigger id="severity">
                                        <SelectValue placeholder="All severities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_VALUE}>
                                            All severities
                                        </SelectItem>
                                        {SEVERITIES.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="event_type">Event type</Label>
                                <Select
                                    value={form.data.event_type || ALL_VALUE}
                                    onValueChange={(v) =>
                                        form.setData(
                                            'event_type',
                                            v === ALL_VALUE ? '' : v,
                                        )
                                    }
                                >
                                    <SelectTrigger id="event_type">
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_VALUE}>
                                            All types
                                        </SelectItem>
                                        {event_types.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    Apply
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid gap-3 md:hidden">
                    {events.data.length === 0 ? (
                        <Card className="sentinel-surface border border-border/10">
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                No security events yet.
                            </CardContent>
                        </Card>
                    ) : (
                        events.data.map((event) => (
                            <Card key={event.id} className="sentinel-surface border border-border/10 hover:border-sentinel-teal/30 transition-all duration-300">
                                <CardContent className="space-y-3 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold">
                                                {event.event_type.replaceAll('_', ' ')}
                                            </div>
                                            <div className="truncate font-mono text-xs text-muted-foreground">
                                                {event.source_client_id ??
                                                    event.topic ??
                                                    'unknown'}
                                            </div>
                                        </div>
                                        <SeverityBadge severity={event.severity} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{formatRelative(event.detected_at)}</span>
                                        <CreateIncidentAction event={event} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <Card className="sentinel-surface border border-border/10 hidden md:flex">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Events
                        </CardTitle>
                        <CardDescription>
                            {events.total} entries
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={events.data}
                            emptyMessage="No security events yet."
                        />
                        <Pagination
                            links={events.links}
                            from={events.from}
                            to={events.to}
                            total={events.total}
                            currentPage={events.current_page}
                            lastPage={events.last_page}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
