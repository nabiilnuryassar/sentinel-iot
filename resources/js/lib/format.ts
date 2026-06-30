import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) {
        return '-';
    }

    try {
        return format(parseISO(iso), 'yyyy-MM-dd HH:mm:ss');
    } catch {
        return iso;
    }
}

export function formatRelative(iso: string | null | undefined): string {
    if (!iso) {
        return '-';
    }

    try {
        return formatDistanceToNow(parseISO(iso), { addSuffix: true });
    } catch {
        return iso;
    }
}

export function formatNumber(
    value: number | null | undefined,
    fractionDigits = 2,
): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '-';
    }

    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: fractionDigits,
    });
}
