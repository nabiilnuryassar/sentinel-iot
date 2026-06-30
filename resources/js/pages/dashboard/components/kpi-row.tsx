import { AlertTriangle, Bot, Gauge, ShieldCheck, Smartphone, Wifi } from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { AnimatedCounter } from './animated-counter';
import type { RiskLevel } from '../types';

interface KpiRowProps {
    totalDevices: number;
    onlineDevices: number;
    openIncidents: number;
    securityEventsToday: number;
    riskLevel: { label: string; hint: string; score: number };
}

export function KpiRow({
    totalDevices,
    onlineDevices,
    openIncidents,
    securityEventsToday,
    riskLevel,
}: KpiRowProps) {
    return (
        <section
            aria-label="Operational summary"
            className="grid grid-cols-2 gap-3 lg:grid-cols-6 lg:gap-4"
        >
            <StatCard
                title="Total Devices"
                value={<AnimatedCounter value={totalDevices} />}
                trend="up"
                variant="info"
                icon={Smartphone}
                className="sentinel-surface"
            />
            <StatCard
                title="Online Devices"
                value={<AnimatedCounter value={onlineDevices} />}
                variant="success"
                icon={Wifi}
                className="sentinel-surface"
            />
            <StatCard
                title="Open Incidents"
                value={<AnimatedCounter value={openIncidents} />}
                variant="danger"
                icon={AlertTriangle}
                className="sentinel-surface"
            />
            <StatCard
                title="Security Events Today"
                value={<AnimatedCounter value={securityEventsToday} />}
                variant="info"
                icon={ShieldCheck}
                className="sentinel-surface"
            />
            <StatCard
                title="Risk Level"
                value={riskLevel.label}
                variant="risk"
                icon={Gauge}
                className="sentinel-surface"
            />
            <StatCard
                title="AI Recommendations"
                value={<AnimatedCounter value={12} />}
                variant="ai"
                icon={Bot}
                className="sentinel-surface"
            />
        </section>
    );
}
