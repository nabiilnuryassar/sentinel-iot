import { Head, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { SeverityBadge } from '@/components/severity-badge';
import type { Severity } from '@/components/severity-badge';
import { StatusPill } from '@/components/status-pill';
import type { DeviceStatus } from '@/components/status-pill';
import { TelemetryChart } from '@/components/telemetry-chart';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AppLayout } from '@/layouts/app-layout';
import { formatDateTime, formatNumber, formatRelative } from '@/lib/format';
import { quarantine as quarantineDevice } from '@/routes/devices';

interface TelemetryRow {
    id: number;
    topic: string;
    temperature: number | null;
    humidity: number | null;
    battery: number | null;
    rssi: number | null;
    received_at: string | null;
}

interface DeviceEvent {
    id: number;
    severity: Severity;
    event_type: string;
    topic: string | null;
    detected_at: string | null;
}

interface DeviceShowProps {
    device: {
        id: number;
        device_id: string;
        name: string;
        type: string;
        location: string | null;
        status: DeviceStatus;
        last_seen_at: string | null;
        metadata_json: Record<string, unknown> | null;
        is_online: boolean;
    };
    telemetry: TelemetryRow[];
    events: DeviceEvent[];
}

function pickChartKey(type: string): {
    dataKey: keyof TelemetryRow;
    label: string;
} {
    if (type.includes('temperature') || type.includes('air_quality')) {
        return { dataKey: 'temperature', label: 'Temperature' };
    }

    if (type.includes('water') || type.includes('humidity')) {
        return { dataKey: 'humidity', label: 'Humidity' };
    }

    return { dataKey: 'battery', label: 'Battery' };
}

const eventColumns: ColumnDef<DeviceEvent>[] = [
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
        accessorKey: 'topic',
        header: 'Topic',
        cell: ({ row }) => (
            <span className="font-mono text-xs text-muted-foreground">
                {row.original.topic ?? '—'}
            </span>
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
];

export default function DeviceShow({
    device,
    telemetry,
    events,
}: DeviceShowProps) {
    const { post, processing } = useForm({});
    const { dataKey, label } = pickChartKey(device.type);
    const chartData = telemetry.map((row) => ({
        ...row,
        received_short: row.received_at?.slice(11, 19) ?? '',
    }));

    const latest = telemetry.at(-1);

    const handleQuarantine = () => {
        post(quarantineDevice.url(device.device_id));
    };

    return (
        <AppLayout>
            <Head title={`Device — ${device.device_id}`} />
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/10 pb-4">
                    <div>
                        <h1 className="font-mono text-xl font-semibold tracking-tight text-foreground">
                            {device.device_id}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {device.name}
                        </p>
                    </div>
                    <div>
                        <Button
                            variant={device.status === 'quarantined' ? 'default' : 'destructive'}
                            disabled={processing}
                            onClick={handleQuarantine}
                            className="font-mono text-xs uppercase tracking-wider cursor-pointer h-10 px-4 flex items-center gap-2"
                        >
                            {device.status === 'quarantined' ? (
                                <>
                                    <ShieldCheck className="size-4" />
                                    Unquarantine Device
                                </>
                            ) : (
                                <>
                                    <ShieldAlert className="size-4" />
                                    Quarantine Device
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="sentinel-surface border-border/10">
                        <CardHeader>
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StatusPill
                                status={
                                    device.is_online ? 'online' : device.status
                                }
                            />
                        </CardContent>
                    </Card>
                    <Card className="sentinel-surface border-border/10">
                        <CardHeader>
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Type
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm font-medium">
                            {device.type}
                        </CardContent>
                    </Card>
                    <Card className="sentinel-surface border-border/10">
                        <CardHeader>
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm font-medium">
                            {device.location ?? '—'}
                        </CardContent>
                    </Card>
                    <Card className="sentinel-surface border-border/10">
                        <CardHeader>
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Last seen
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0.5 text-sm">
                            <div className="font-medium">
                                {formatRelative(device.last_seen_at)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {formatDateTime(device.last_seen_at)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="sentinel-surface border-border/10">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            {label} — last {telemetry.length} samples
                        </CardTitle>
                        <CardDescription>
                            Latest reading:{' '}
                            {formatNumber(latest?.[dataKey] as number | null)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TelemetryChart
                            data={chartData}
                            dataKey={dataKey as string}
                            xKey="received_short"
                            height={240}
                        />
                    </CardContent>
                </Card>

                <Card className="sentinel-surface border-border/10">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Recent security events
                        </CardTitle>
                        <CardDescription>
                            Events with `source_client_id == {device.device_id}`
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={eventColumns}
                            data={events}
                            emptyMessage="No events for this device."
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
