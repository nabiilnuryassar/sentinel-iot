import type { LucideIcon } from 'lucide-react';

export type FeatureAccent =
    | 'teal'
    | 'cyan'
    | 'purple'
    | 'amber'
    | 'red'
    | 'emerald';

export type FeatureSpan = 'col-span-1' | 'sm:col-span-2' | 'lg:col-span-2';

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    desc: string;
    accent: FeatureAccent;
    span?: FeatureSpan;
}

const ACCENT_RING: Record<FeatureAccent, string> = {
    teal: 'border-sentinel-teal/30 hover:border-sentinel-teal/70 hover:shadow-[0_0_28px_rgba(31,230,208,0.18)]',
    cyan: 'border-sentinel-cyan/30 hover:border-sentinel-cyan/70 hover:shadow-[0_0_28px_rgba(56,189,248,0.18)]',
    purple: 'border-sentinel-purple/30 hover:border-sentinel-purple/70 hover:shadow-[0_0_28px_rgba(168,85,247,0.18)]',
    amber: 'border-sentinel-amber/30 hover:border-sentinel-amber/70 hover:shadow-[0_0_28px_rgba(245,158,11,0.18)]',
    red: 'border-sentinel-red/30 hover:border-sentinel-red/70 hover:shadow-[0_0_28px_rgba(239,68,68,0.18)]',
    emerald:
        'border-sentinel-emerald/30 hover:border-sentinel-emerald/70 hover:shadow-[0_0_28px_rgba(16,185,129,0.18)]',
};

const ACCENT_TEXT: Record<FeatureAccent, string> = {
    teal: 'text-sentinel-teal',
    cyan: 'text-sentinel-cyan',
    purple: 'text-sentinel-purple',
    amber: 'text-sentinel-amber',
    red: 'text-sentinel-red',
    emerald: 'text-sentinel-emerald',
};

/**
 * FeatureCard.
 *
 * Bento-style capability tile used on the landing page. Pure
 * presentation — accent + span are caller controlled so the same
 * component can render both small cards and the wide hero tile.
 */
export function FeatureCard({
    icon: Icon,
    title,
    desc,
    accent,
    span = 'col-span-1',
}: FeatureCardProps) {
    return (
        <div
            className={`sentinel-surface group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${ACCENT_RING[accent]} ${span}`}
        >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
            <div
                className={`mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-white/5 ${ACCENT_TEXT[accent]}`}
            >
                <Icon aria-hidden className="size-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground sm:text-lg">
                {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {desc}
            </p>
        </div>
    );
}
