"use client";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const PerformanceChart = ({ assesments }) => {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        if (assesments) {
            const formattedData = assesments.map((assessment) => ({
                date: format(new Date(assessment.createdAt), "MMM dd"),
                score: assessment.quizScore
            }));

            setChartData(formattedData);
        }
    }, [assesments]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-1 p-2">
            <div className="bg-[#1A1A1A] w-full h-[240px] rounded-xl border border-[#2A2A2A] shadow-md p-4 transition-all hover:shadow-[#9EFF00]/10">
                <h3 className="text-lg font-semibold text-white mb-2">
                    Performance Trend
                </h3>

                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#C9F300" stopOpacity={0.8} />
                                <stop offset="60%" stopColor="#9EFF00" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#C9F300" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            vertical={true}
                            horizontal={false}
                            stroke="#2A2A2A"
                            strokeDasharray="4 4"
                        />

                        <XAxis
                            dataKey="date"
                            tick={{ fill: "#C9F300", fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: "#C9F300", fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `${val}%`}
                        />

                        <Tooltip
                            contentStyle={{ backgroundColor: "#1F1F1F", borderColor: "#C9F300" }}
                            labelStyle={{ color: "#fff" }}
                            cursor={{ stroke: "#C9F300", strokeDasharray: "3 3" }}
                        />

                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#C9F300"
                            strokeWidth={2}
                            fill="url(#colorGreen)"
                            activeDot={{
                                r: 6,
                                stroke: "#fff",
                                strokeWidth: 2,
                                fill: "#C9F300"
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PerformanceChart;
