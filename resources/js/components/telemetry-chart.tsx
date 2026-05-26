import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface TelemetryChartProps<TData extends Record<string, unknown>> {
    data: TData[];
    dataKey?: string;
    lines?: Array<{ dataKey: string; name: string; color: string }>;
    xKey: string;
    height?: number;
}

export function TelemetryChart<TData extends Record<string, unknown>>({
    data,
    dataKey,
    lines,
    xKey,
    height = 240,
}: TelemetryChartProps<TData>) {
    const chartLines =
        lines ??
        (dataKey
            ? [{ dataKey, name: dataKey, color: 'var(--sentinel-teal)' }]
            : []);

    return (
        <div className="w-full text-foreground" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        strokeOpacity={0.15}
                    />
                    <XAxis
                        dataKey={xKey}
                        stroke="rgba(148,163,184,0.35)"
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{
                            stroke: 'rgba(148,163,184,0.22)',
                        }}
                        minTickGap={32}
                    />
                    <YAxis
                        stroke="rgba(148,163,184,0.35)"
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{
                            stroke: 'rgba(148,163,184,0.22)',
                        }}
                        width={40}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#071426',
                            color: 'var(--popover-foreground)',
                            border: '1px solid rgba(31,230,208,0.24)',
                            borderRadius: '0.75rem',
                            fontSize: '0.75rem',
                        }}
                        labelStyle={{ color: 'var(--muted-foreground)' }}
                    />
                    {chartLines.map((line) => (
                        <Line
                            key={line.dataKey}
                            type="monotone"
                            dataKey={line.dataKey}
                            name={line.name}
                            stroke={line.color}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
