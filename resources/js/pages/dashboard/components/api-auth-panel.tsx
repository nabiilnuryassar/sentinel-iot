import { useForm, usePage } from '@inertiajs/react';
import { Check, Copy, Key } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { rotate as rotateToken } from '@/routes/tokens';
import type { PageProps } from '@/types';
import type { BotTokenData } from '../types';

interface ApiAuthPanelProps {
    botToken: BotTokenData | null;
}

export function ApiAuthPanel({ botToken }: ApiAuthPanelProps) {
    const { props } = usePage<PageProps>();
    const flash = props.flash;
    const [copied, setCopied] = useState(false);
    const { post, processing } = useForm();

    const handleRotate = (e: React.FormEvent) => {
        e.preventDefault();
        post(rotateToken.url());
    };

    const handleCopy = () => {
        if (flash?.new_bot_token) {
            navigator.clipboard.writeText(flash.new_bot_token);
            setCopied(true);
            toast.success('Token copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Card className="sentinel-surface relative overflow-hidden border-border/10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentinel-cyan/30 to-transparent"
            />
            <CardHeader className="flex-row items-center gap-3">
                <Key aria-hidden className="size-5 text-sentinel-cyan" />
                <div>
                    <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                        // api auth keys
                    </CardTitle>
                    <p className="font-mono text-[10px] text-muted-foreground">Active Bot Token Management</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2 rounded-xl border border-border/10 bg-background/20 p-3 font-mono text-xs">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Token Identity:</span>
                        <span className="text-foreground">bot-service</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Used:</span>
                        <span className="text-foreground">{botToken?.last_used_at ?? 'Never'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Scopes:</span>
                        <span className="text-sentinel-teal">ingest, query, triage</span>
                    </div>
                </div>

                {flash?.new_bot_token && (
                    <div className="relative space-y-2 rounded-xl border border-sentinel-teal/30 bg-sentinel-teal/5 p-3">
                        <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-sentinel-teal">
                            ⚠️ New Bot Token Generated
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-border/10 bg-background/50 p-2">
                            <span className="flex-1 truncate select-all font-mono text-xs text-foreground">
                                {flash.new_bot_token}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="cursor-pointer rounded p-1 text-sentinel-teal transition-colors hover:bg-border/20"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                            </button>
                        </div>
                        <p className="text-[9px] leading-normal text-muted-foreground">
                            Store this securely. It will not be shown again.
                        </p>
                    </div>
                )}

                <form onSubmit={handleRotate}>
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex min-h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-sentinel-cyan/30 bg-sentinel-cyan/10 px-3 font-mono text-xs font-semibold text-sentinel-cyan transition-colors hover:bg-sentinel-cyan/20"
                    >
                        {processing ? 'ROTATING...' : 'ROTATE BOT TOKEN'}
                    </button>
                </form>
            </CardContent>
        </Card>
    );
}
