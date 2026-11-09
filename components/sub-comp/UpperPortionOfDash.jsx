'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { motion } from "motion/react";
import { useEffect, useState } from 'react';

const fullData = [
    { name: 'JavaScript', value: 50, fill: '#C9F300' },
    { name: 'Python', value: 70, fill: '#FF4F4F' },
    { name: 'React', value: 85, fill: '#C9F300' },
    { name: 'SQL', value: 100, fill: '#FF4F4F' },
];

export default function UpperPortionOfDash() {
    const skills = [
        { name: 'Ramim Zaman', time: 'Today, 10:34', amount: '$59', img: '/people/ramim.jpg' },
        { name: 'Ahnaf Tahmid', time: 'Today, 10:35', amount: '$71', img: '/people/ahnaf.jpg' },
        { name: 'Ashraf Hossain', time: 'Today, 10:36', amount: '$66', img: '/people/ashraf.jpg' },
        { name: 'Sadat Ul Haque', time: 'Today, 10:37', amount: '$45', img: '/people/sadat.jpg' },
        { name: 'Abtahi Arifeen', time: 'Today, 10:38', amount: '$38', img: '/people/abtahi.jpg' },
    ];

    const [barValues, setBarValues] = useState(fullData.map(d => ({ ...d, value: 0 })));

    useEffect(() => {
        const interval = setInterval(() => {
            setBarValues(prev =>
                prev.map((bar, idx) => {
                    const target = fullData[idx].value;
                    const current = bar.value;
                    if (current < target) {
                        return { ...bar, value: Math.min(current + 5, target) };
                    }
                    return bar;
                })
            );
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
            {/* Bar Chart */}
            <div className="h-44 bg-gray-800 rounded-xl p-3 shadow-md flex flex-col justify-between">
                <div className="flex items-start justify-between mb-1">
                    <h3 className="text-lg font-semibold text-white mb-1">Top Skills in Demand</h3>
                    {/* <div className="text-sm font-semibold text-white">
                        924,862 <span className="text-xs text-gray-400">USD</span>
                    </div> */}
                </div>
                <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={barValues}>
                        <XAxis
                            dataKey="name"
                            tick={{ fill: '#C9F300', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#C9F300' }}
                        />
                        <Bar
                            dataKey="value"
                            radius={[8, 8, 0, 0]}
                            isAnimationActive={false}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Scrollable List */}
            <div className="h-44 bg-gray-800 rounded-xl p-3 shadow-md flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-1">Featured Job Seekers</h2>
                <ul
                    className="space-y-2 overflow-y-auto show-scrollbar scrollbar-thin scrollbar-thumb-[#C9F300] scrollbar-track-[#1f1f3a] pr-2"
                    style={{ maxHeight: '112px' }}
                >
                    {skills.map((sale, idx) => (
                        <li
                            key={idx}
                            className="flex items-center justify-between border border-[#2f2f4f] px-2 py-1 rounded-xl hover:bg-[#1f1f3a] transition"
                        >
                            <div className="flex items-center space-x-3">
                                <img
                                    src={sale.img}
                                    alt={sale.name}
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                                <div className="text-sm">
                                    <div className="font-medium text-white">{sale.name}</div>
                                    <div className="text-gray-400">{sale.time}</div>
                                </div>
                            </div>
                            <div className="text-sm font-semibold text-white">{sale.amount}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
