import {
    Activity,
    AlertTriangle,
    Bot,
    Cpu,
    Home,
    LayoutDashboard,
    ShieldAlert,
    User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { dashboard } from '@/routes';
import { index as agentIndex } from '@/routes/agent';
import { index as devicesIndex } from '@/routes/devices';
import { index as incidentsIndex } from '@/routes/incidents';
import { index as securityEventsIndex } from '@/routes/security-events';
import { index as telemetryIndex } from '@/routes/telemetry';

export interface NavigationItem {
    label: string;
    shortLabel: string;
    href: string;
    icon: LucideIcon;
    matches: (path: string) => boolean;
}

export const primaryNavigation: NavigationItem[] = [
    {
        label: 'Dashboard',
        shortLabel: 'Home',
        href: dashboard.url(),
        icon: LayoutDashboard,
        matches: (path) => path === dashboard.url(),
    },
    {
        label: 'Devices',
        shortLabel: 'Devices',
        href: devicesIndex.url(),
        icon: Cpu,
        matches: (path) => path.startsWith(devicesIndex.url()),
    },
    {
        label: 'Telemetry',
        shortLabel: 'Telemetry',
        href: telemetryIndex.url(),
        icon: Activity,
        matches: (path) => path.startsWith(telemetryIndex.url()),
    },
    {
        label: 'Security Events',
        shortLabel: 'Events',
        href: securityEventsIndex.url(),
        icon: ShieldAlert,
        matches: (path) => path.startsWith(securityEventsIndex.url()),
    },
    {
        label: 'Incidents',
        shortLabel: 'Incidents',
        href: incidentsIndex.url(),
        icon: AlertTriangle,
        matches: (path) => path.startsWith(incidentsIndex.url()),
    },
    {
        label: 'AI Agent Console',
        shortLabel: 'Agent',
        href: agentIndex.url(),
        icon: Bot,
        matches: (path) => path.startsWith(agentIndex.url()),
    },
];

export const mobileNavigation: NavigationItem[] = [
    {
        label: 'Dashboard',
        shortLabel: 'Home',
        href: dashboard.url(),
        icon: Home,
        matches: (path) => path === dashboard.url(),
    },
    {
        label: 'Devices',
        shortLabel: 'Devices',
        href: devicesIndex.url(),
        icon: Cpu,
        matches: (path) => path.startsWith(devicesIndex.url()),
    },
    {
        label: 'Incidents',
        shortLabel: 'Incidents',
        href: incidentsIndex.url(),
        icon: AlertTriangle,
        matches: (path) =>
            path.startsWith(incidentsIndex.url()) ||
            path.startsWith(securityEventsIndex.url()),
    },
    {
        label: 'AI Agent Console',
        shortLabel: 'Agent',
        href: agentIndex.url(),
        icon: Bot,
        matches: (path) => path.startsWith(agentIndex.url()),
    },
    {
        label: 'Profile',
        shortLabel: 'Profile',
        href: dashboard.url(),
        icon: User,
        matches: () => false,
    },
];
