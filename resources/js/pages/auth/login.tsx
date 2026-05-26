import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2, ShieldCheck, Terminal } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


export default function Login() {
    const form = useForm({
        email: 'admin@sentinel.local',
        password: 'password',
        remember: false,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/login', {
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <>
            <Head title="Sign in — Sentinel-IoT" />
            <div className="sentinel-grid-bg relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6 text-foreground">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -left-32 top-12 size-72 rounded-full bg-primary/15 blur-[120px]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute right-0 top-1/3 size-96 rounded-full bg-purple-500/10 blur-[140px]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent motion-safe:animate-pulse"
                />

                <main className="relative w-full max-w-md">
                    <div
                        aria-hidden
                        className="absolute -inset-4 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(31,230,208,0.18),_transparent_70%)] blur-2xl"
                    />
                    <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card/85 shadow-[0_28px_60px_rgba(0,0,0,0.55)] backdrop-blur">
                        <div className="flex items-center justify-between border-b border-border/70 bg-background/40 px-5 py-3">
                            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
                                <Terminal aria-hidden className="size-3.5 text-primary" />
                                sentinel-soc · /auth
                            </div>
                            <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-emerald-300">
                                ●  secure
                            </span>
                        </div>

                        <div className="space-y-6 p-7">
                            <div className="flex items-center gap-3">
                                <span className="grid size-11 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_24px_rgba(31,230,208,0.18)]">
                                    <ShieldCheck aria-hidden className="size-6" />
                                </span>
                                <div>
                                    <h1 className="font-mono text-base uppercase tracking-[0.22em]">
                                        Sentinel<span className="text-primary">/IoT</span>
                                    </h1>
                                    <p className="text-xs text-muted-foreground">
                                        Authenticate to enter the operations console.
                                    </p>
                                </div>
                            </div>

                            <form className="space-y-4" onSubmit={submit}>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="email"
                                        className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground"
                                    >
                                        $ email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        autoFocus
                                        spellCheck={false}
                                        value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)}
                                        className="border-border/70 bg-background/60 font-mono text-sm focus-visible:border-primary/40"
                                    />
                                    {form.errors.email && (
                                        <p className="text-xs text-rose-300">{form.errors.email}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="password"
                                        className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground"
                                    >
                                        $ password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="current-password"
                                        value={form.data.password}
                                        onChange={(e) => form.setData('password', e.target.value)}
                                        className="border-border/70 bg-background/60 font-mono text-sm focus-visible:border-primary/40"
                                    />
                                    {form.errors.password && (
                                        <p className="text-xs text-rose-300">{form.errors.password}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="w-full font-mono uppercase tracking-widest"
                                >
                                    {form.processing && (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    )}
                                    Authenticate
                                </Button>
                                <p className="rounded-xl border border-border/70 bg-background/40 p-3 text-center text-xs text-muted-foreground">
                                    demo:{' '}
                                    <code className="font-mono text-foreground">
                                        admin@sentinel.local
                                    </code>{' '}
                                    /{' '}
                                    <code className="font-mono text-foreground">password</code>
                                </p>
                                <p className="text-center text-sm">
                                    <Link
                                        href="/"
                                        className="font-mono text-xs uppercase tracking-[0.18em] text-primary hover:underline"
                                    >
                                        ← back to landing
                                    </Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
