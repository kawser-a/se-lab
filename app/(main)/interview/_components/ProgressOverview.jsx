"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CartesianGrid, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

// A change between two sessions is only worth calling a trend once there
// are a few of them; before that it mostly reflects one odd session.
const TREND_AFTER = 3;

const average = (values) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null);

function Stat({ label, value, note }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>
        </div>
    );
}

function change(latest, previous) {
    const difference = latest - previous;
    if (difference > 0) return `up ${difference} on the one before`;
    if (difference < 0) return `down ${Math.abs(difference)} on the one before`;
    return "the same as the one before";
}

const KINDS = {
    voice: { label: "Voice interviews", noun: "Interview", color: "#9EFF00", unit: "" },
    quiz: { label: "Quizzes", noun: "Quiz", color: "#7DD3FC", unit: "%" },
};

function AttemptTooltip({ active, payload, kind }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    const { noun, unit } = KINDS[kind];
    return (
        <div className="rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs shadow-lg">
            <p className="font-semibold">
                {noun} {point.attempt}
                {point.role && <span className="font-normal text-muted-foreground"> · {point.role}</span>}
            </p>
            <p className="text-muted-foreground">{format(point.at, "d MMM yyyy, HH:mm")}</p>
            <p className="mt-1">
                Score{" "}
                <strong>
                    {point.score}
                    {unit}
                </strong>
            </p>
        </div>
    );
}

// One kind of practice at a time, plotted in the order the attempts were
// made. Each point is labelled with its score, and the dashed line is the
// average, so the chart reads without hovering.
function AttemptChart({ kind, points }) {
    const { color, noun, unit } = KINDS[kind];
    const mean = average(points.map((point) => point.score));

    if (points.length < 2) {
        return (
            <p className="flex h-56 items-center justify-center rounded-xl border border-dashed border-white/10 px-6 text-center text-sm text-muted-foreground">
                {points.length === 0
                    ? `No ${noun.toLowerCase()} scores yet.`
                    : `One ${noun.toLowerCase()} so far, scoring ${points[0].score}${unit}. Do another and you'll see how your scores change here.`}
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full" style={{ background: color }} /> Your score
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-4 border-t border-dashed border-zinc-500" /> Your average, {mean}
                    {unit}
                </span>
            </div>
            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points} margin={{ top: 24, right: 16, left: -16, bottom: 4 }}>
                        <CartesianGrid vertical={false} stroke="#2A2A2A" strokeDasharray="4 4" />
                        <XAxis
                            dataKey="attempt"
                            tickFormatter={(attempt) => `#${attempt}`}
                            tick={{ fill: "#A1A1AA", fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                            padding={{ left: 16, right: 16 }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            tickFormatter={(value) => `${value}${unit}`}
                            tick={{ fill: "#A1A1AA", fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <ReferenceLine y={mean} stroke="#71717A" strokeDasharray="4 4" />
                        <Tooltip content={<AttemptTooltip kind={kind} />} cursor={{ stroke: "#3F3F46" }} />
                        <Line
                            type="linear"
                            dataKey="score"
                            stroke={color}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: color, strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={false}
                        >
                            <LabelList dataKey="score" position="top" offset={10} fill="#E4E4E7" fontSize={12} formatter={(value) => `${value}${unit}`} />
                        </Line>
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// Progress from what's actually been done; nothing here is estimated.
const ProgressOverview = ({ interviews, quizzes }) => {
    const byDate = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
    const voicePoints = interviews
        .filter((interview) => interview.hasFeedback && interview.score != null)
        .sort(byDate)
        .map((interview, index) => ({ attempt: index + 1, score: Math.round(interview.score), at: new Date(interview.createdAt), role: interview.role }));
    const quizPoints = [...quizzes].sort(byDate).map((quiz, index) => ({ attempt: index + 1, score: Math.round(quiz.quizScore), at: new Date(quiz.createdAt) }));

    const available = Object.keys(KINDS).filter((kind) => (kind === "voice" ? voicePoints : quizPoints).length > 0);
    // Open on whichever has enough attempts to draw a line, voice first.
    const [kind, setKind] = useState(available.find((option) => (option === "voice" ? voicePoints : quizPoints).length > 1) ?? available[0] ?? "voice");
    const shown = available.includes(kind) ? kind : available[0];

    if (available.length === 0) {
        return (
            <section aria-labelledby="progress-heading" className="space-y-4">
                <h2 id="progress-heading" className="text-xl font-semibold">
                    Your progress
                </h2>
                <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">
                    Your scores and how they change over time will show here after your first interview or quiz.
                </p>
            </section>
        );
    }

    const voiceScores = voicePoints.map((point) => point.score);
    const quizScores = quizPoints.map((point) => point.score);
    const lastVoice = voiceScores.at(-1);
    const lastQuiz = quizScores.at(-1);

    return (
        <section aria-labelledby="progress-heading" className="space-y-4">
            <h2 id="progress-heading" className="text-xl font-semibold">
                Your progress
            </h2>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat
                    label="Voice interviews"
                    value={voiceScores.length}
                    note={voiceScores.length ? `Best score ${Math.max(...voiceScores)} out of 100` : "Finish one to get your first score"}
                />
                <Stat
                    label="Interview average"
                    value={average(voiceScores) ?? "–"}
                    note={
                        lastVoice == null
                            ? "Out of 100"
                            : voiceScores.length >= TREND_AFTER
                              ? `Latest ${lastVoice}, ${change(lastVoice, voiceScores.at(-2))}`
                              : `Latest ${lastVoice}. Trends show after ${TREND_AFTER} interviews.`
                    }
                />
                <Stat label="Quizzes" value={quizScores.length} note={quizScores.length ? `Best score ${Math.max(...quizScores)}%` : "Take one to test what you know"} />
                <Stat
                    label="Quiz average"
                    value={quizScores.length ? `${average(quizScores)}%` : "–"}
                    note={
                        lastQuiz == null
                            ? "Share of answers right"
                            : quizScores.length >= TREND_AFTER
                              ? `Latest ${lastQuiz}%, ${change(lastQuiz, quizScores.at(-2))}`
                              : `Latest ${lastQuiz}%. Trends show after ${TREND_AFTER} quizzes.`
                    }
                />
            </div>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="font-semibold">Score by attempt</h3>
                        <p className="text-xs text-muted-foreground">Oldest on the left. Hover a point for the date and details.</p>
                    </div>
                    {available.length > 1 && (
                        <div role="tablist" aria-label="Which scores to show" className="flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm">
                            {available.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    role="tab"
                                    aria-selected={shown === option}
                                    onClick={() => setKind(option)}
                                    className={cn(
                                        "rounded-full px-4 py-1.5 transition-colors",
                                        shown === option ? "bg-[#9EFF00] text-black" : "text-muted-foreground hover:text-white",
                                    )}
                                >
                                    {KINDS[option].label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <AttemptChart kind={shown} points={shown === "voice" ? voicePoints : quizPoints} />
            </div>
        </section>
    );
};

export default ProgressOverview;
