import type { PropsWithChildren } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { MobileNavigation } from '@/components/mobile-navigation';
import { Toaster } from '@/components/ui/sonner';

export function AppLayout({ children }: PropsWithChildren) {
    return (
        <div className="sentinel-grid-bg min-h-screen bg-background text-foreground">
            <AppSidebar />
            <main className="min-h-screen overflow-x-hidden pb-24 lg:ml-[16.25rem] lg:pb-0">
                <div className="mx-auto w-full max-w-[92rem] px-3 py-4 sm:px-5 lg:px-6 lg:py-5 xl:max-w-[100rem]">
                    {children}
                </div>
            </main>
            <MobileNavigation />
            <Toaster position="top-right" richColors closeButton />
        </div>
    );
}
