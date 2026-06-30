import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SecurityScore } from '../types';

interface SecurityScoreCardProps {
    score: SecurityScore;
}

export function SecurityScoreCard({ score }: SecurityScoreCardProps) {
    return (
        <Card className="sentinel-surface border-border/10 lg:col-span-4">
            <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    // security score
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    className="mx-auto grid size-36 place-items-center rounded-full p-3"
                    style={{
                        background: `conic-gradient(var(--sentinel-teal) 0 ${score.overall}%, rgba(28,51,79,0.9) ${score.overall}% 100%)`,
                    }}
                >
                    <div className="grid size-full place-items-center rounded-full border border-border/10 bg-[#050b16] text-center shadow-inner shadow-black/40">
                        <div>
                            <div className="font-mono text-4xl font-semibold">{score.overall}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">/100</div>
                            <div className="mt-1 font-mono text-xs font-semibold text-sentinel-teal">
                                {score.label}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border/10 pt-3 text-center font-mono text-[10px]">
                    {score.sub_scores.map((sub) => (
                        <div key={sub.label}>
                            <div className="text-muted-foreground">{sub.label}</div>
                            <div className="font-semibold text-foreground">{sub.value}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
