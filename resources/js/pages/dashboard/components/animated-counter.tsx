import { useState, useEffect, useMemo } from 'react';

interface AnimatedCounterProps {
    value: number | string;
    duration?: number;
}

export function AnimatedCounter({ value, duration = 800 }: AnimatedCounterProps) {
    const numericValue = useMemo(() => {
        return typeof value === 'number'
            ? value
            : parseInt(String(value).replace(/[^0-9]/g, ''), 10);
    }, [value]);

    const isPercent = typeof value === 'string' && value.includes('%');
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (isNaN(numericValue) || numericValue <= 0) {
            setCount(0);
            return;
        }

        let start = 0;
        const end = numericValue;
        const stepMs = Math.max(Math.floor(duration / end), 10);
        const increment = Math.max(Math.ceil(end / (duration / stepMs)), 1);

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                clearInterval(timer);
                setCount(end);
            } else {
                setCount(start);
            }
        }, stepMs);

        return () => clearInterval(timer);
    }, [numericValue, duration]);

    if (isNaN(numericValue)) {
        return <span>{value}</span>;
    }

    return (
        <span>
            {count.toLocaleString()}
            {isPercent ? '%' : ''}
        </span>
    );
}
