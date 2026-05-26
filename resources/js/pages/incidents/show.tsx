import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import IncidentController from '@/actions/App/Http/Controllers/IncidentController';
import { MarkdownView } from '@/components/markdown-view';
import { SeverityBadge } from '@/components/severity-badge';
import type { Severity } from '@/components/severity-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { PageProps } from '@/types';

type Status = 'open' | 'investigating' | 'mitigated' | 'closed';

interface IncidentReport {
    id: number;
    generated_by: string | null;
    generated_at: string | null;
    report_markdown: string;
}

interface IncidentDevice {
    device_id: string;
    name: string;
    type: string;
    location: string | null;
}

interface Incident {
    id: number;
    title: string;
    severity: Severity;
    status: Status;
    affected_device_id: string | null;
    summary: string | null;
    root_cause: string | null;
    recommendation: string | null;
    created_at: string | null;
    updated_at: string | null;
    device: IncidentDevice | null;
    reports: IncidentReport[];
}

interface IncidentShowProps {
    incident: Incident;
}

const STATUS_TONE: Record<Status, string> = {
    open: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
    investigating:
        'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    mitigated: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    closed: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

export default function IncidentShow({ incident }: IncidentShowProps) {
    const form = useForm<{ status: Status }>({ status: incident.status });
    const reportForm = useForm({});
    const latestReport = incident.reports[0] ?? null;

    const { props } = usePage<PageProps>();
    const flashSuccess = props.flash?.success;
    const flashError = props.flash?.error;
    const lastFlashRef = useRef<{ success?: string; error?: string }>({});

    useEffect(() => {
        if (flashSuccess && flashSuccess !== lastFlashRef.current.success) {
            toast.success(flashSuccess);
            lastFlashRef.current.success = flashSuccess;
        }

        if (flashError && flashError !== lastFlashRef.current.error) {
            toast.error(flashError);
            lastFlashRef.current.error = flashError;
        }
    }, [flashSuccess, flashError]);

    const onStatusChange = (next: Status) => {
        form.setData('status', next);
        form.transform((data) => ({ status: data.status }));
        form.put(`/incidents/${incident.id}`);
    };

    const onGenerateReport = () => {
        reportForm.post(IncidentController.generateReport(incident.id).url, {
            onError: () => {
                toast.error('Could not generate report.');
            },
        });
    };

    return (
        <AppLayout>
            <Head title={`Incident — ${incident.title}`} />
            <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/incidents">
                                <ArrowLeft aria-hidden className="size-3" />
                                All incidents
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {incident.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <SeverityBadge severity={incident.severity} />
                            <Badge
                                variant="outline"
                                className={`border-transparent uppercase ${STATUS_TONE[incident.status]}`}
                            >
                                {incident.status}
                            </Badge>
                            <span>
                                Filed {formatRelative(incident.created_at)}
                            </span>
                            <span>·</span>
                            <span>
                                Updated {formatRelative(incident.updated_at)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            Status
                        </span>
                        <Select
                            value={form.data.status}
                            onValueChange={(v) => onStatusChange(v as Status)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="investigating">
                                    Investigating
                                </SelectItem>
                                <SelectItem value="mitigated">
                                    Mitigated
                                </SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="sentinel-surface border-border/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            {incident.summary ?? '—'}
                        </CardContent>
                    </Card>
                    <Card className="sentinel-surface border-border/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Root cause
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            {incident.root_cause ?? '—'}
                        </CardContent>
                    </Card>
                    <Card className="sentinel-surface border-border/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Recommendation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            {incident.recommendation ?? '—'}
                        </CardContent>
                    </Card>
                </div>

                {incident.device ? (
                    <Card className="sentinel-surface border-border/10">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                Affected device
                            </CardTitle>
                            <CardDescription>
                                {incident.device.type} ·{' '}
                                {incident.device.location ?? 'unknown location'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div>
                                <div className="font-mono text-sm">
                                    {incident.device.device_id}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {incident.device.name}
                                </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link
                                    href={`/devices/${incident.device.device_id}`}
                                >
                                    Open device
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : null}

                <Card className="sentinel-surface border-border/10">
                    <CardHeader className="flex-row items-start justify-between gap-2">
                        <div>
                            <CardTitle className="text-base font-semibold">
                                Incident report
                            </CardTitle>
                            <CardDescription>
                                {latestReport
                                    ? `Generated by ${latestReport.generated_by ?? 'agent'} · ${formatDateTime(latestReport.generated_at)}`
                                    : 'Run the AI analyst to draft a markdown report.'}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {latestReport ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        router.reload({ only: ['incident'] })
                                    }
                                >
                                    Refresh
                                </Button>
                            ) : null}
                            <Button
                                variant={latestReport ? 'outline' : 'default'}
                                size="sm"
                                onClick={onGenerateReport}
                                disabled={reportForm.processing}
                            >
                                {reportForm.processing ? (
                                    <Loader2
                                        aria-hidden
                                        className="size-3.5 animate-spin"
                                    />
                                ) : (
                                    <FileText
                                        aria-hidden
                                        className="size-3.5"
                                    />
                                )}
                                {latestReport
                                    ? 'Regenerate report'
                                    : 'Generate report'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {latestReport ? (
                            <MarkdownView
                                content={latestReport.report_markdown}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No report has been generated for this incident
                                yet. Click <strong>Generate report</strong> to
                                run the IncidentAnalyst agent.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
