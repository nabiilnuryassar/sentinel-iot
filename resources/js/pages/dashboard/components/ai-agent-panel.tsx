import { Link } from '@inertiajs/react';
import { Bot, Send } from 'lucide-react';
import { StatusPill } from '@/components/status-pill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { index as agentIndex } from '@/routes/agent';
import type { ServiceHealth } from '../types';

interface AiAgentPanelProps {
    health: ServiceHealth[];
}

export function AiAgentPanel({ health }: AiAgentPanelProps) {
    const agentService = health.find((s) => s.name === 'AI Agent Service');
    const agentStatus = agentService?.status === 'online' ? 'online' : 'unknown';

    return (
        <Card className="sentinel-surface border-purple-400/30 lg:col-span-4">
            <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Bot aria-hidden className="size-7 text-purple-300" />
                    <div>
                        <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                            // ai agent
                        </CardTitle>
                        <div className="font-mono text-[10px] text-muted-foreground">
                            OpenClaw/Hermes Co-Pilot
                        </div>
                    </div>
                </div>
                <StatusPill status={agentStatus} />
            </CardHeader>
            <CardContent>
                <Link
                    href={agentIndex.url()}
                    className="flex min-h-9 items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 font-mono text-xs text-primary transition-colors hover:bg-primary/20"
                >
                    Ask OpenClaw anything...
                    <Send aria-hidden className="size-4" />
                </Link>
            </CardContent>
        </Card>
    );
}
