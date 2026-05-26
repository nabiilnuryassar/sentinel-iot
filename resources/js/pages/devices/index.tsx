import { Head, Link } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusPill } from '@/components/status-pill';
import type { DeviceStatus } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AppLayout } from '@/layouts/app-layout';
import { formatRelative } from '@/lib/format';
import { show as showDevice } from '@/routes/devices';
import type { Paginated } from '@/types';

interface DeviceRow {
    id: number;
    device_id: string;
    name: string;
    type: string;
    location: string | null;
    status: DeviceStatus;
    last_seen_at: string | null;
    is_online: boolean;
}

interface DevicesIndexProps {
    devices: Paginated<DeviceRow>;
}

const columns: ColumnDef<DeviceRow>[] = [
    {
        accessorKey: 'device_id',
        header: 'Device ID',
        cell: ({ row }) => (
            <span className="font-mono text-xs">{row.original.device_id}</span>
        ),
    },
    {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <span className="text-xs">{row.original.type}</span>,
    },
    {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
                {row.original.location ?? '—'}
            </span>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
            <StatusPill
                status={row.original.is_online ? 'online' : row.original.status}
            />
        ),
    },
    {
        accessorKey: 'last_seen_at',
        header: 'Last seen',
        cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
                {formatRelative(row.original.last_seen_at)}
            </span>
        ),
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
            <Button asChild variant="ghost" size="sm" className="cursor-pointer">
                <Link href={showDevice.url(row.original.device_id)}>
                    View
                    <ChevronRight aria-hidden className="size-3" />
                </Link>
            </Button>
        ),
    },
];

export default function DevicesIndex({ devices }: DevicesIndexProps) {
    return (
        <AppLayout>
            <Head title="Devices" />
            <div className="flex flex-col gap-4 lg:gap-5">
                <PageHeader
                    title="Devices"
                    subtitle="Registered IoT fleet · last seen status"
                />
                <Card className="sentinel-surface border-border/10">
                    <CardHeader>
                        <CardTitle className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            // inventory
                        </CardTitle>
                        <CardDescription>
                            {devices.total} total devices · page{' '}
                            {devices.current_page} of {devices.last_page}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={devices.data}
                            emptyMessage="No devices registered."
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
