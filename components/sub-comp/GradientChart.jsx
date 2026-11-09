"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
    { name: 'Sat', value: 5000 },
    { name: 'Sun', value: 3000 },
    { name: 'Mon', value: 4000 },
    { name: 'Tues', value: 10000 },
    { name: 'Wed', value: 9500 },
    { name: 'Thur', value: 6000 },
    { name: 'Fri', value: 8500 },
    { name: 'Sat', value: 9000 },
    { name: 'Sun', value: 7000 },
];

export default function GradientChart() {
    return (
        <div className='grid grid-cols-1 md:grid-cols-1 p-2'>
            <div className="bg-gray-800 w-full h-[220px] rounded-lg p-4">
                <h3 className='text-lg font-semibold text-white'>Career Trends Over Time</h3>
                <ResponsiveContainer width="100%" height="97%">
                    <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#C9F300" stopOpacity={0.8} />
                                <stop offset="60%" stopColor="#9EFF00" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#C9F300" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={true} horizontal={false} stroke="##fbffc5" strokeDasharray="4 4" />
                        <XAxis dataKey="name" tick={{ fill: "#C9F300", fontSize: 12 }} />
                        <YAxis tickFormatter={(val) => `${val / 1000}k`} tick={{ fill: "#C9F300", fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '##fbffc5', borderColor: '#C9F300' }} labelStyle={{ color: '#fff' }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#C9F300"
                            strokeWidth={2}
                            fill="url(#colorGreen)"
                            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: "#C9F300" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
