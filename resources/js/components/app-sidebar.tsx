import { Link, router, usePage } from '@inertiajs/react';
import {
    Clock3,
    FileText,
    LogOut,
    Settings,
    ShieldCheck,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { primaryNavigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const secondaryNavigation = [
    { label: 'Policy Center', icon: ShieldCheck },
    { label: 'Reports', icon: FileText },
    { label: 'Settings', icon: Settings },
];

export function AppSidebar() {
    const { url } = usePage();
    const path = url.split('?')[0] ?? '/';

    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16.25rem] flex-col border-r border-border bg-sidebar/95 lg:flex">
            <div className="flex h-24 items-center gap-3 border-b border-border px-5">
                <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 shadow-[0_0_24px_rgba(31,230,208,0.18)]">
                    <img src="/images/sentinel-logo.svg" alt="Sentinel-IoT" className="size-13 object-contain" />
                </div>
                <div>
                    <span className="block text-xl font-semibold tracking-tight text-foreground">
                        Sentinel-IoT
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Security Operations
                    </span>
                </div>
            </div>
            <ScrollArea className="flex-1">
                <nav className="flex flex-col gap-2 p-4">
                    {primaryNavigation.map((item) => {
                        const active = item.matches(path);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium text-sidebar-foreground transition-colors',
                                    active
                                        ? 'sentinel-surface-active text-primary'
                                        : 'hover:border-border hover:bg-primary/5 hover:text-foreground',
                                )}
                            >
                                <Icon aria-hidden className="size-5 shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                    <div className="mt-4 border-t border-border pt-4">
                        {secondaryNavigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.label}
                                    className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground"
                                >
                                    <Icon aria-hidden className="size-5" />
                                    <span>{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </nav>
            </ScrollArea>
            <div className="m-4 rounded-2xl border border-border bg-background/35 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Clock3 aria-hidden className="size-5" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">
                            System Time
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                            UTC+7
                        </div>
                    </div>
                </div>
            </div>
            <button
                type="button"
                onClick={() => router.post('/logout')}
                className="mx-4 mb-4 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-rose-500/10 hover:text-rose-400"
            >
                <LogOut aria-hidden className="size-5" />
                <span>Log Out</span>
            </button>
        </aside>
    );
}
