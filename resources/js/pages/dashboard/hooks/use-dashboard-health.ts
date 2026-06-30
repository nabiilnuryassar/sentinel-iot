import { useState, useEffect } from 'react';
import type { ServiceHealth } from '../types';
import { health } from '@/routes/api/dashboard';

export function useDashboardHealth(intervalMs = 10_000) {
    const [healthData, setHealthData] = useState<ServiceHealth[]>([]);
    const [stale, setStale] = useState(false);

    useEffect(() => {
        let active = true;

        const poll = async () => {
            try {
                const res = await fetch(health.url());
                if (!active) return;
                if (res.ok) {
                    setHealthData(await res.json());
                    setStale(false);
                } else {
                    setStale(true);
                }
            } catch {
                if (active) setStale(true);
            }
        };

        poll();
        const id = setInterval(poll, intervalMs);

        return () => {
            active = false;
            clearInterval(id);
        };
    }, [intervalMs]);

    return { health: healthData, stale };
}
