import { TelemetryChart } from '@/components/telemetry-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Legend } from './legend';

interface TelemetryPanelProps {
    data: Array<{
        minute: string;
        temperature: number;
        humidity: number;
        battery: number;
    }>;
}

export function TelemetryPanel({ data }: TelemetryPanelProps) {
    const noData = data.length === 0 || data.every((d) => d.temperature === 0 && d.humidity === 0 && d.battery === 0);

    return (
        <Card className="sentinel-surface sentinel-grid-bg relative overflow-hidden lg:col-span-6 border-border/10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />
            <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                    <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                        // realtime telemetry
                    </CardTitle>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <Legend color="bg-primary" label="Temperature (C)" />
                        <Legend color="bg-blue-400" label="Humidity (%)" />
                        <Legend color="bg-purple-400" label="Battery (%)" />
                    </div>
                </div>
                <span className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-primary">
                    Last 1h
                </span>
            </CardHeader>
            <CardContent>
                {noData ? (
                    <div className="flex h-[220px] items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-2 size-3 animate-pulse rounded-full bg-primary/40" />
                            <p className="font-mono text-xs text-muted-foreground">
                                Waiting for sensor data...
                            </p>
                        </div>
                    </div>
                ) : (
                    <TelemetryChart
                        data={data}
                        xKey="minute"
                        lines={[
                            { dataKey: 'temperature', name: 'Temperature', color: 'var(--sentinel-teal)' },
                            { dataKey: 'humidity', name: 'Humidity', color: 'var(--sentinel-blue)' },
                            { dataKey: 'battery', name: 'Battery', color: 'var(--sentinel-purple)' },
                        ]}
                        height={220}
                    />
                )}
            </CardContent>
        </Card>
    );
}
