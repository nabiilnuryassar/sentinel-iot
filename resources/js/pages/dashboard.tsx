import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { AppLayout } from '@/layouts/app-layout';
import { useDashboardHealth } from './dashboard/hooks/use-dashboard-health';
import { RISK_COPY, type DashboardProps } from './dashboard/types';
import { KpiRow } from './dashboard/components/kpi-row';
import { TelemetryPanel } from './dashboard/components/telemetry-panel';
import { DeviceHealthCard } from './dashboard/components/device-health-card';
import { SecurityScoreCard } from './dashboard/components/security-score-card';
import { MqttBrokerCard } from './dashboard/components/mqtt-broker-card';
import { AiAgentPanel } from './dashboard/components/ai-agent-panel';
import { DeviceGallery } from './dashboard/components/device-gallery';
import { ThreatFeed } from './dashboard/components/threat-feed';
import { IncidentPanel } from './dashboard/components/incident-panel';
import { ApiAuthPanel } from './dashboard/components/api-auth-panel';
import { OperatorSpotlight } from './dashboard/components/operator-spotlight';
import { ServiceHealthBar } from './dashboard/components/service-health-bar';
import { MobileDashboardHeader } from './dashboard/components/mobile-header';

export default function Dashboard(props: DashboardProps) {
    const risk = RISK_COPY[props.risk_level];
    const warningDevices = Math.max(
        props.total_devices - props.online_devices - props.offline_devices,
        0,
    );
    const { health } = useDashboardHealth();

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 lg:gap-5">
                <MobileDashboardHeader health={health} />
                <PageHeader
                    title="Sentinel-IoT Dashboard"
                    subtitle="IoT Security Operations Center"
                    className="hidden lg:flex"
                />

                {/* Row 1: KPI Summary */}
                <KpiRow
                    totalDevices={props.total_devices}
                    onlineDevices={props.online_devices}
                    openIncidents={props.open_incidents}
                    securityEventsToday={props.security_events_today}
                    riskLevel={risk}
                />

                {/* Row 2: Charts & Device Health */}
                <section className="grid gap-4 lg:grid-cols-10">
                    <TelemetryPanel data={props.recent_telemetry} />
                    <DeviceHealthCard
                        total={props.total_devices}
                        healthy={props.online_devices}
                        warning={warningDevices}
                        offline={props.offline_devices}
                    />
                </section>

                {/* Row 2.5: System Status */}
                <section className="grid gap-4 lg:grid-cols-12">
                    <SecurityScoreCard score={props.security_score} />
                    <MqttBrokerCard health={health} />
                    <AiAgentPanel health={health} />
                </section>

                {/* Row 3: Detail Panels */}
                <section className="grid gap-4 lg:grid-cols-12">
                    <DeviceGallery devices={props.devices} />
                    <ThreatFeed events={props.recent_events} />
                    <IncidentPanel incidents={props.incidents} />
                    <div className="grid gap-4 lg:col-span-3">
                        <ApiAuthPanel botToken={props.bot_token} />
                        <OperatorSpotlight operator={props.operator} />
                    </div>
                </section>

                {/* Row 4: Service Health Footer */}
                <ServiceHealthBar health={health} />
            </div>
        </AppLayout>
    );
}
