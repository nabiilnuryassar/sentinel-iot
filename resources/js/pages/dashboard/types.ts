import type { Severity } from '@/components/severity-badge';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RecentEvent {
    id: number;
    severity: Severity;
    event_type: string;
    topic: string | null;
    detected_at: string | null;
}

export interface IncidentRow {
    id: number;
    title: string;
    severity: Severity;
    status: string;
    device_id: string | null;
    created_at: string;
}

export interface DeviceRow {
    device_id: string;
    name: string;
    type: string;
    status: string;
    last_seen_at: string | null;
    metadata_json: Record<string, unknown> | null;
}

export interface SecurityScore {
    overall: number;
    sub_scores: Array<{ label: string; value: number }>;
    label: string;
}

export interface OperatorData {
    name: string;
    email: string;
    resolved_this_week: number;
}

export interface BotTokenData {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string | null;
    expires_at: string | null;
}

export interface ServiceHealth {
    name: string;
    version: string;
    status: string;
    icon: string;
}

export interface DashboardProps {
    total_devices: number;
    online_devices: number;
    offline_devices: number;
    security_events_today: number;
    open_incidents: number;
    risk_level: RiskLevel;
    recent_telemetry: Array<{
        minute: string;
        temperature: number;
        humidity: number;
        battery: number;
    }>;
    recent_events: RecentEvent[];
    bot_token: BotTokenData | null;
    incidents: IncidentRow[];
    devices: DeviceRow[];
    security_score: SecurityScore;
    operator: OperatorData;
}

export const RISK_COPY: Record<RiskLevel, { label: string; hint: string; score: number }> = {
    low: { label: 'Low', hint: 'Quiet monitoring window', score: 92 },
    medium: { label: 'Medium', hint: 'Security activity needs review', score: 78 },
    high: { label: 'High', hint: 'Open incidents require action', score: 62 },
    critical: { label: 'Critical', hint: 'Critical incident active', score: 36 },
};
