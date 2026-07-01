import { Head, Link, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { Pagination } from '@/components/pagination';
import { PageHeader } from '@/components/page-header';
import { SeverityBadge } from '@/components/severity-badge';
import type { Severity } from '@/components/severity-badge';
import { StatusPill } from '@/components/status-pill';
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
    DialogTrigger,
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
import { show as incidentShow, store as incidentStore } from '@/routes/incidents';
import { index as securityEventsIndex } from '@/routes/security-events';
import type { Paginated } from '@/types';

type Status = 'open' | 'investigating' | 'mitigated' | 'closed';

interface IncidentRow {
    id: number;
    title: string;
    severity: Severity;
    status: Status;
    affected_device_id: string | null;
    created_at: string | null;
}

interface IncidentsIndexProps {
    incidents: Paginated<IncidentRow>;
}

const columns: ColumnDef<IncidentRow>[] = [
    {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
            <span className="text-sm font-medium">{row.original.title}</span>
        ),
    },
    {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusPill status={row.original.status} />,
    },
    {
        accessorKey: 'affected_device_id',
        header: 'Device',
        cell: ({ row }) => (
            <span className="font-mono text-xs text-muted-foreground">
                {row.original.affected_device_id ?? '-'}
            </span>
        ),
    },
    {
        accessorKey: 'created_at',
        header: 'Filed',
        cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
                {formatRelative(row.original.created_at)}
            </span>
        ),
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
            <Button asChild variant="ghost" size="sm">
                <Link href={incidentShow.url(row.original.id)}>
                    View
                    <ChevronRight aria-hidden className="size-3" />
                </Link>
            </Button>
        ),
    },
];

interface CreateForm {
    title: string;
    severity: Severity;
    affected_device_id: string;
    summary: string;
}

function NewIncidentDialog() {
    const [open, setOpen] = useState(false);
    const form = useForm<CreateForm>({
        title: '',
        severity: 'medium',
        affected_device_id: '',
        summary: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(incidentStore.url(), {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus aria-hidden className="size-3.5" />
                    New incident
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>File a new incident</DialogTitle>
                    <DialogDescription>
                        Capture an issue for review and follow-up.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
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
                        <Label htmlFor="severity">Severity</Label>
                        <Select
                            value={form.data.severity}
                            onValueChange={(v) =>
                                form.setData('severity', v as Severity)
                            }
                        >
                            <SelectTrigger id="severity">
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
                        <Label htmlFor="affected_device_id">
                            Affected device ID
                        </Label>
                        <Input
                            id="affected_device_id"
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
                        <Label htmlFor="summary">Summary</Label>
                        <Textarea
                            id="summary"
                            value={form.data.summary}
                            onChange={(e) =>
                                form.setData('summary', e.target.value)
                            }
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function IncidentsIndex({ incidents }: IncidentsIndexProps) {
    return (
        <AppLayout>
            <Head title="Incidents" />
            <div className="flex flex-col gap-6">
                <PageHeader
                    title="Incidents & Security"
                    subtitle="Monitor - Detect - Respond"
                    actions={<NewIncidentDialog />}
                />
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-background/25 p-1 md:hidden">
                    <Link
                        href={securityEventsIndex.url()}
                        className="min-h-10 rounded-xl px-3 py-2 text-center text-sm font-medium text-muted-foreground"
                    >
                        Security Events
                    </Link>
                    <span className="min-h-10 rounded-xl bg-primary/15 px-3 py-2 text-center text-sm font-semibold text-primary">
                        Incidents
                    </span>
                </div>
                <div className="flex gap-2 overflow-x-auto md:hidden">
                    {['All', 'High', 'Medium', 'Low'].map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            className="min-h-10 rounded-xl border border-border bg-background/35 px-4 text-sm text-muted-foreground first:border-primary/40 first:bg-primary/10 first:text-primary"
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="grid gap-3 md:hidden">
                    {incidents.data.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                No incidents filed.
                            </CardContent>
                        </Card>
                    ) : (
                        incidents.data.map((incident) => (
                            <Link
                                key={incident.id}
                                href={incidentShow.url(incident.id)}
                                className="sentinel-surface block rounded-2xl p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="font-mono text-sm font-semibold text-red-300">
                                            INC-{String(incident.id).padStart(4, '0')}
                                        </div>
                                        <div className="mt-1 truncate text-sm font-semibold">
                                            {incident.title}
                                        </div>
                                        <div className="mt-1 truncate text-xs text-muted-foreground">
                                            {incident.affected_device_id ?? 'unknown entity'}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatRelative(incident.created_at)}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <StatusPill status={incident.status} />
                                    <SeverityBadge severity={incident.severity} />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                <Card className="hidden md:flex sentinel-surface border-border/10">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            All incidents
                        </CardTitle>
                        <CardDescription>
                            {incidents.total} entries
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={incidents.data}
                            emptyMessage="No incidents filed."
                        />
                        <Pagination
                            links={incidents.links}
                            from={incidents.from}
                            to={incidents.to}
                            total={incidents.total}
                            currentPage={incidents.current_page}
                            lastPage={incidents.last_page}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
