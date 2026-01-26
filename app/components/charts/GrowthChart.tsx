import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

import growthData from '../../data/precomputed/growth-stats.json';

export function GrowthChart() {
    const data = useMemo(() => {
        // Filter for 2025 since this is a 2025 Year in Review
        return growthData.filter(d => d.fullRequest.startsWith('2025'));
    }, []);

    return (
        <div className="w-full h-75 md:h-100">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5
                    }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        opacity={0.2}
                        vertical={false}
                    />
                    <XAxis
                        dataKey="month"
                        tick={{ fill: '#888888', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#888888', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={value => `${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                        contentStyle={{
                            backgroundColor: '#09090b', // zinc-950
                            border: '2px solid var(--primary)', // Green Border
                            borderRadius: '0px',
                            color: '#ffffff',
                            fontFamily: 'monospace'
                        }}
                    />
                    <Bar
                        dataKey="count"
                        fill="var(--primary)" // green-500
                        radius={[0, 0, 0, 0]}
                        name="Attendees"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
