"use client";

import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const VOICE_COLOR = "#9EFF00";
const QUIZ_COLOR = "#7DD3FC";

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

function compared(change) {
    if (change > 0) return `up ${change} on the one before`;
    if (change < 0) return `down ${Math.abs(change)} on the one before`;
    return "same as the one before";
}

function TrendTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs shadow-lg">
            <p className="mb-1 font-medium">{label}</p>
            {payload.map((item) => (
                <p key={item.dataKey} style={{ color: item.color }}>
                    {item.dataKey === "voice" ? `Interview: ${item.value}` : `Quiz: ${item.value}%`}
                </p>
            ))}
        </div>
    );
}

// Scores from both kinds of practice on one timeline. Everything here is
// worked out from what's actually been done; nothing is estimated.
const ProgressOverview = ({ interviews, quizzes }) => {
    const scored = interviews.filter((interview) => interview.hasFeedback && interview.score != null).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const voiceScores = scored.map((interview) => Math.round(interview.score));
    const quizScores = quizzes.map((quiz) => Math.round(quiz.quizScore));

    if (!voiceScores.length && !quizScores.length) {
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

    const lastVoice = voiceScores.at(-1);
    const voiceChange = voiceScores.length > 1 ? lastVoice - voiceScores.at(-2) : null;
    const quizAverage = average(quizScores);
    const lastQuiz = quizScores.at(-1);

    const points = [
        ...scored.map((interview) => ({ at: new Date(interview.createdAt), voice: Math.round(interview.score) })),
        ...quizzes.map((quiz) => ({ at: new Date(quiz.createdAt), quiz: Math.round(quiz.quizScore) })),
    ]
        .sort((a, b) => a.at - b.at)
        .map(({ at, ...rest }) => ({ label: format(at, "d MMM"), ...rest }));

    return (
        <section aria-labelledby="progress-heading" className="space-y-4">
            <h2 id="progress-heading" className="text-xl font-semibold">
                Your progress
            </h2>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat
                    label="Interviews completed"
                    value={voiceScores.length}
                    note={voiceScores.length ? `Best score ${Math.max(...voiceScores)}` : "Finish one to get your first score"}
                />
                <Stat
                    label="Average interview score"
                    value={average(voiceScores) ?? "–"}
                    note={voiceChange == null ? (lastVoice != null ? `Latest ${lastVoice}` : "Out of 100") : `Latest ${lastVoice}, ${compared(voiceChange)}`}
                />
                <Stat label="Quizzes taken" value={quizScores.length} note={quizAverage == null ? "Take one to test what you know" : `Average ${quizAverage}%`} />
                <Stat
                    label="Latest quiz"
                    value={lastQuiz == null ? "–" : `${lastQuiz}%`}
                    note={lastQuiz == null ? "No quizzes yet" : quizScores.length > 1 ? `${lastQuiz - quizAverage >= 0 ? "Above" : "Below"} your average of ${quizAverage}%` : "Your first quiz"}
                />
            </div>

            {points.length > 1 && (
                <div className="rounded-2xl border border-white/10 bg-card p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-semibold">Scores over time</h3>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                            {voiceScores.length > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <span className="h-0.5 w-4 rounded-full" style={{ background: VOICE_COLOR }} /> Voice interviews
                                </span>
                            )}
                            {quizScores.length > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <span className="h-0.5 w-4 rounded-full" style={{ background: QUIZ_COLOR }} /> Quizzes
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={points} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="#2A2A2A" strokeDasharray="4 4" />
                                <XAxis dataKey="label" tick={{ fill: "#A1A1AA", fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
                                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "#A1A1AA", fontSize: 12 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#3F3F46" }} />
                                <Line type="monotone" dataKey="voice" stroke={VOICE_COLOR} strokeWidth={2.5} dot={{ r: 3.5, fill: VOICE_COLOR }} connectNulls isAnimationActive={false} />
                                <Line type="monotone" dataKey="quiz" stroke={QUIZ_COLOR} strokeWidth={2} dot={{ r: 3, fill: QUIZ_COLOR }} connectNulls isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ProgressOverview;
