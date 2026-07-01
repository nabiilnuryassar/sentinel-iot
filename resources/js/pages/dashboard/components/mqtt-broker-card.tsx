import { Lock, Network, RadioTower, ScrollText, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill } from '@/components/status-pill';
import type { DeviceStatus } from '@/components/status-pill';
import type { ServiceHealth } from '../types';

interface MqttBrokerCardProps {
    health: ServiceHealth[];
}

const MQTT_ROWS: Array<[string, DeviceStatus, LucideIcon]> = [
    ['Auth', 'enabled', Lock],
    ['ACL', 'enabled', Shield],
    ['Broker Logs', 'healthy', ScrollText],
    ['Port 1883 (TCP)', 'open', Network],
    ['Port 8883 (TLS)', 'open', Network],
];

function toDeviceStatus(raw: string): DeviceStatus {
    if (raw === 'error') {
        return 'offline';
    }

    if (raw === 'connected' || raw === 'online' || raw === 'healthy' || raw === 'enabled' || raw === 'open') {
        return raw;
    }

    return 'unknown';
}

export function MqttBrokerCard({ health }: MqttBrokerCardProps) {
    const mqttService = health.find((s) => s.name === 'Mosquitto MQTT Broker');
    const mqttStatus = toDeviceStatus(mqttService?.status ?? 'unknown');

    return (
        <Card className="sentinel-surface relative overflow-hidden border-border/10 lg:col-span-4">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
            />
            <CardHeader className="flex-row items-center gap-3">
                <RadioTower aria-hidden className="size-5 text-muted-foreground" />
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    // mqtt broker
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-3 border-b border-border/10 pb-2 font-mono text-xs">
                    <span className="text-muted-foreground">Broker Status</span>
                    <StatusPill status={mqttStatus} className="shrink-0" />
                </div>
                {MQTT_ROWS.map(([label, status, Icon]) => (
                    <div
                        key={label}
                        className="flex items-center justify-between gap-3 border-b border-border/10 pb-2 font-mono text-xs last:border-0 last:pb-0"
                    >
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <Icon aria-hidden className="size-3 shrink-0 text-muted-foreground/60" />
                            {label}
                        </span>
                        <StatusPill status={status} className="shrink-0" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
