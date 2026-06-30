import { RadioTower } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill } from '@/components/status-pill';
import type { DeviceStatus } from '@/components/status-pill';
import type { ServiceHealth } from '../types';

interface MqttBrokerCardProps {
    health: ServiceHealth[];
}

const MQTT_ROWS = [
    ['Auth', 'enabled'],
    ['ACL', 'enabled'],
    ['Broker Logs', 'healthy'],
    ['Port 1883 (TCP)', 'open'],
    ['Port 8883 (TLS)', 'open'],
] as const;

function toDeviceStatus(raw: string): DeviceStatus {
    if (raw === 'error') return 'offline';
    if (raw === 'connected' || raw === 'online' || raw === 'healthy' || raw === 'enabled' || raw === 'open') {
        return raw;
    }
    return 'unknown';
}

export function MqttBrokerCard({ health }: MqttBrokerCardProps) {
    const mqttService = health.find((s) => s.name === 'Mosquitto MQTT Broker');
    const mqttStatus = toDeviceStatus(mqttService?.status ?? 'unknown');

    return (
        <Card className="sentinel-surface border-border/10 lg:col-span-4">
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
                {MQTT_ROWS.map(([label, status]) => (
                    <div
                        key={label}
                        className="flex items-center justify-between gap-3 border-b border-border/10 pb-2 font-mono text-xs last:border-0 last:pb-0"
                    >
                        <span className="text-muted-foreground">{label}</span>
                        <StatusPill status={status} className="shrink-0" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
