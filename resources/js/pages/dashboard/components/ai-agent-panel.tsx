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
        <Card className="sentinel-surface relative overflow-hidden border-purple-400/30 lg:col-span-4">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent"
            />
            <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10 shadow-[0_0_12px_rgba(192,132,252,0.1)]">
                        <Bot aria-hidden className="size-5 text-purple-300" />
                    </div>
                    <div>
                        <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                            // ai agent
                        </CardTitle>
                        <div className="font-mono text-[10px] text-muted-foreground">
                            Sentinel AI Co-Pilot
                        </div>
                    </div>
                </div>
                <StatusPill status={agentStatus} />
            </CardHeader>
            <CardContent>
                <Link
                    href={agentIndex.url()}
                    className="group flex min-h-9 items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 font-mono text-xs text-primary transition-all hover:bg-primary/20 hover:shadow-[0_0_16px_rgba(31,230,208,0.1)]"
                >
                    Ask Sentinel AI anything...
                    <Send aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </CardContent>
        </Card>
    );
}
