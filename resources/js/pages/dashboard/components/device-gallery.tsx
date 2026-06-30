import { Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatRelative } from '@/lib/format';
import { index as devicesIndex } from '@/routes/devices';
import type { DeviceRow } from '../types';

interface DeviceGalleryProps {
    devices: DeviceRow[];
}

function rssiToBars(rssi: number | null | undefined): number {
    if (rssi === null || rssi === undefined) return 0;
    if (rssi >= -50) return 4;
    if (rssi >= -60) return 3;
    if (rssi >= -70) return 2;
    return 1;
}

export function DeviceGallery({ devices }: DeviceGalleryProps) {
    if (devices.length === 0) {
        return (
            <Card className="sentinel-surface relative overflow-hidden border-border/10 lg:col-span-5">
                <CardHeader>
                    <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                        // monitored devices
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <ShieldCheck className="mb-2 size-8 text-muted-foreground" />
                    <div className="font-mono text-sm text-muted-foreground">No devices registered</div>
                    <Link
                        href={devicesIndex.url()}
                        className="mt-2 font-mono text-xs text-sentinel-teal hover:underline"
                    >
                        Add your first device →
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="sentinel-surface relative overflow-hidden border-border/10 lg:col-span-5">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentinel-teal/30 to-transparent"
            />
            <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    // monitored devices
                </CardTitle>
                <Link
                    href={devicesIndex.url()}
                    className="font-mono text-xs text-sentinel-teal hover:underline"
                >
                    fleet_view.sh →
                </Link>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {devices.map((device) => {
                    const isOnline = device.status === 'online';
                    const isWarning = device.status === 'warning';
                    const isOffline = device.status === 'offline';
                    const rssi = device.metadata_json?.rssi as number | undefined;
                    const signalBars = rssiToBars(rssi);

                    return (
                        <div
                            key={device.device_id}
                            className="group relative flex items-center justify-between gap-4 rounded-xl border border-border/10 bg-background/35 p-3 transition-all duration-300 hover:border-sentinel-teal/30 hover:shadow-[0_0_12px_rgba(31,230,208,0.06)] cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <span className="relative flex size-2 shrink-0">
                                    {isOnline && (
                                        <>
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                        </>
                                    )}
                                    {isWarning && (
                                        <>
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                            <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                                        </>
                                    )}
                                    {isOffline && (
                                        <span className="relative inline-flex size-2 rounded-full bg-red-500/60" />
                                    )}
                                </span>
                                <div>
                                    <div className="font-mono text-xs font-semibold text-foreground transition-colors group-hover:text-sentinel-teal">
                                        {device.device_id}
                                    </div>
                                    <div className="font-mono text-[10px] text-muted-foreground">
                                        {device.type} · batt: {(device.metadata_json?.battery as string) ?? '--'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex h-5 items-end gap-0.5">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                'w-1 rounded-full transition-colors',
                                                i <= signalBars
                                                    ? isOnline
                                                        ? 'bg-emerald-400'
                                                        : isWarning
                                                          ? 'bg-amber-400'
                                                          : 'bg-red-400'
                                                    : 'bg-border/30',
                                            )}
                                            style={{ height: `${i * 4 + 4}px` }}
                                        />
                                    ))}
                                </div>

                                <div className="shrink-0 text-right font-mono text-[10px]">
                                    <div className="text-foreground">
                                        {rssi !== undefined ? `${rssi} dBm` : '--'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {device.last_seen_at ? formatRelative(device.last_seen_at) : '--'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
