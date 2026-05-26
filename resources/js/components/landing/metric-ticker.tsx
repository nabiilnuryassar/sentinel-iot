import { useEffect, useState } from 'react';

interface MetricTickerProps {
    label: string;
    target: number;
    suffix?: string;
    duration?: number;
}

/**
 * MetricTicker.
 *
 * Animates a numeric counter from 0 to {@link target} on mount using an
 * easeOutCubic curve. Honors `prefers-reduced-motion` by jumping straight
 * to the target. SSR-safe: server renders 0, client may seed differently
 * via the lazy `useState` initializer.
 */
export function MetricTicker({
    label,
    target,
    suffix = '',
    duration = 1800,
}: MetricTickerProps) {
    const [value, setValue] = useState(() => {
        if (typeof window === 'undefined') {
            return 0;
        }

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? target
            : 0;
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        let raf = 0;
        const start = performance.now();
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(target * eased));

            if (t < 1) {
                raf = requestAnimationFrame(step);
            }
        };

        raf = requestAnimationFrame(step);

        return () => cancelAnimationFrame(raf);
    }, [target, duration]);

    return (
        <div className="flex flex-col items-center sm:items-start">
            <div className="font-mono text-3xl font-semibold tabular-nums text-sentinel-teal sm:text-4xl">
                {value.toLocaleString()}
                {suffix}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </div>
        </div>
    );
}
