import { Head, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import { formatNumber, formatRelative } from '@/lib/format';
import type { Paginated } from '@/types';

interface TelemetryRow {
    id: number;
    device_id: string;
    topic: string;
    temperature: number | null;
    humidity: number | null;
    battery: number | null;
    rssi: number | null;
    received_at: string | null;
}

interface TelemetryIndexProps {
    logs: Paginated<TelemetryRow>;
    devices: string[];
    filters: {
        device_id: string | null;
        from: string | null;
        to: string | null;
    };
}

const ALL_VALUE = '__all__';

const columns: ColumnDef<TelemetryRow>[] = [
    {
        accessorKey: 'device_id',
        header: 'Device',
        cell: ({ row }) => (
            <span className="font-mono text-xs">{row.original.device_id}</span>
        ),
    },
    {
        accessorKey: 'topic',
        header: 'Topic',
        cell: ({ row }) => (
            <span className="font-mono text-xs text-muted-foreground">
                {row.original.topic}
            </span>
        ),
    },
    {
        accessorKey: 'temperature',
        header: 'Temp',
        cell: ({ row }) => formatNumber(row.original.temperature, 1),
    },
    {
        accessorKey: 'humidity',
        header: 'Humidity',
        cell: ({ row }) => formatNumber(row.original.humidity, 1),
    },
    {
        accessorKey: 'battery',
        header: 'Battery',
        cell: ({ row }) => formatNumber(row.original.battery, 1),
    },
    {
        accessorKey: 'rssi',
        header: 'RSSI',
        cell: ({ row }) => formatNumber(row.original.rssi, 0),
    },
    {
        accessorKey: 'received_at',
        header: 'Received',
        cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
                {formatRelative(row.original.received_at)}
            </span>
        ),
    },
];

export default function TelemetryIndex({
    logs,
    devices,
    filters,
}: TelemetryIndexProps) {
    const form = useForm<{ device_id: string; from: string; to: string }>({
        device_id: filters.device_id ?? '',
        from: filters.from ?? '',
        to: filters.to ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.get('/telemetry', {
            preserveState: true,
        });
    };

    return (
        <AppLayout>
            <Head title="Telemetry" />
            <div className="flex flex-col gap-4 lg:gap-5">
                <PageHeader
                    title="Telemetry"
                    subtitle="Raw telemetry log · paginated by 50"
                />

                <Card className="sentinel-surface border-border/10">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Filter
                        </CardTitle>
                        <CardDescription>
                            Filter by device or time window
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submit}
                            className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                        >
                            <div className="space-y-1">
                                <Label htmlFor="device_id">Device</Label>
                                <Select
                                    value={form.data.device_id || ALL_VALUE}
                                    onValueChange={(v) =>
                                        form.setData(
                                            'device_id',
                                            v === ALL_VALUE ? '' : v,
                                        )
                                    }
                                >
                                    <SelectTrigger id="device_id">
                                        <SelectValue placeholder="All devices" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_VALUE}>
                                            All devices
                                        </SelectItem>
                                        {devices.map((id) => (
                                            <SelectItem key={id} value={id}>
                                                {id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="from">From</Label>
                                <Input
                                    id="from"
                                    type="datetime-local"
                                    value={form.data.from}
                                    onChange={(e) =>
                                        form.setData('from', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="to">To</Label>
                                <Input
                                    id="to"
                                    type="datetime-local"
                                    value={form.data.to}
                                    onChange={(e) =>
                                        form.setData('to', e.target.value)
                                    }
                                />
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

                <Card className="sentinel-surface border-border/10">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Logs
                        </CardTitle>
                        <CardDescription>
                            {logs.total} entries · page {logs.current_page} of{' '}
                            {logs.last_page}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={logs.data}
                            emptyMessage="No telemetry yet."
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
