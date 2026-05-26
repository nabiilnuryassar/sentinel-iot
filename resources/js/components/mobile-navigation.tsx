import { Link, usePage } from '@inertiajs/react';
import { mobileNavigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function MobileNavigation() {
    const { url } = usePage();
    const path = url.split('?')[0] ?? '/';

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-5 gap-1">
                {mobileNavigation.map((item) => {
                    const active = item.matches(path);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[0.68rem] font-medium text-muted-foreground transition-colors',
                                active &&
                                    'bg-primary/10 text-primary shadow-[0_0_18px_rgba(31,230,208,0.16)]',
                            )}
                        >
                            <Icon aria-hidden className="size-4" />
                            <span>{item.shortLabel}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
