import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SecurityScore } from '../types';

interface SecurityScoreCardProps {
    score: SecurityScore;
}

export function SecurityScoreCard({ score }: SecurityScoreCardProps) {
    const scoreColor =
        score.overall >= 80
            ? 'text-sentinel-teal'
            : score.overall >= 50
              ? 'text-amber-400'
              : 'text-red-400';

    return (
        <Card className="sentinel-surface relative overflow-hidden border-border/10 lg:col-span-4">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentinel-teal/40 to-transparent"
            />
            <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    // security score
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    className="mx-auto grid size-40 place-items-center rounded-full p-3 shadow-[0_0_24px_rgba(31,230,208,0.06)]"
                    style={{
                        background: `conic-gradient(var(--sentinel-teal) 0 ${score.overall}%, rgba(28,51,79,0.9) ${score.overall}% 100%)`,
                    }}
                >
                    <div className="grid size-full place-items-center rounded-full border border-border/10 bg-[#050b16] text-center shadow-inner shadow-black/40">
                        <div>
                            <div className={`font-mono text-4xl font-semibold ${scoreColor}`}>
                                {score.overall}
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground">/100</div>
                            <div className="mt-1 font-mono text-xs font-semibold text-sentinel-teal">
                                {score.label}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/10 pt-4">
                    {score.sub_scores.map((sub) => (
                        <div
                            key={sub.label}
                            className="rounded-lg border border-border/10 bg-background/25 px-3 py-2 text-center font-mono"
                        >
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {sub.label}
                            </div>
                            <div className="mt-0.5 text-sm font-semibold text-foreground">
                                {sub.value}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
