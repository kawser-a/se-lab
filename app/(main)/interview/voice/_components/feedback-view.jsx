import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, ChevronLeft, Mic, Target, TrendingUp } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { INTERVIEW_TYPES, LEVELS } from "@/lib/interview/config";
import { CRITERIA } from "@/lib/interview/scoring";
import { cn } from "@/lib/utils";
import RetryFeedback from "./retry-feedback";

function verdict(score) {
    if (score >= 80) return { label: "Strong", tone: "text-[#9EFF00]" };
    if (score >= 60) return { label: "Good", tone: "text-[#C9F300]" };
    if (score >= 40) return { label: "Fair", tone: "text-amber-300" };
    return { label: "Needs work", tone: "text-red-300" };
}

function ScoreRing({ score }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const { label, tone } = verdict(score);

    return (
        <div className="relative size-36 shrink-0">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/10" />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#9EFF00"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - score / 100)}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{score}</span>
                <span className={cn("text-sm font-medium", tone)}>{label}</span>
            </div>
        </div>
    );
}

const PACE = {
    slow: "A little slow. Aim for 120 to 160 words a minute.",
    steady: "A comfortable pace.",
    fast: "Quite fast. Slowing down helps people follow.",
};

function Stat({ label, value, note }) {
    return (
        <div className="rounded-xl border bg-black/20 p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {note && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>}
        </div>
    );
}

function List({ items, icon: Icon, tone }) {
    return (
        <ul className="space-y-2">
            {items.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed">
                    <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function Transcript({ turns, questionId }) {
    return (
        <div className="space-y-3">
            {turns
                .filter((turn) => turn.questionId === questionId)
                .map((turn, index) => (
                    <div key={index} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{turn.kind === "follow-up" ? `Follow-up: ${turn.prompt}` : "Your answer"}</p>
                        <p className={cn("rounded-lg bg-black/20 p-3 text-sm leading-relaxed", turn.skipped && "italic text-muted-foreground")}>
                            {turn.skipped ? "Skipped" : turn.answer}
                        </p>
                    </div>
                ))}
        </div>
    );
}

const FeedbackView = ({ interview }) => {
    const { feedback, metrics, turns } = interview;
    const questionIds = [...new Set(turns.map((turn) => turn.questionId))];

    return (
        <div className="mx-auto max-w-4xl space-y-6 pt-4 pb-16">
            <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/interview" aria-label="Back to interview preparation">
                        <ChevronLeft />
                    </Link>
                </Button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-bold sm:text-3xl">{interview.role}</h1>
                    <p className="text-sm text-muted-foreground">
                        {INTERVIEW_TYPES[interview.type]?.label} · {LEVELS[interview.level]?.label} ·{" "}
                        {format(new Date(interview.completedAt ?? interview.createdAt), "d MMM yyyy")}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/interview/voice/new">Practise again</Link>
                </Button>
            </div>

            {feedback ? (
                <>
                    <section className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-start sm:p-8">
                        <ScoreRing score={feedback.score} />
                        <div className="space-y-4">
                            <p className="leading-relaxed">{feedback.summary}</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {Object.entries(CRITERIA).map(([key, criterion]) => {
                                    const value = feedback.criteria[key];
                                    return (
                                        <div key={key} title={criterion.description}>
                                            <div className="mb-1 flex justify-between text-sm">
                                                <span>{criterion.label}</span>
                                                <span className="text-muted-foreground">{value == null ? "–" : `${value} / 5`}</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                                <div className="h-full rounded-full bg-[#9EFF00]" style={{ width: `${((value ?? 0) / 5) * 100}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {(feedback.topStrengths.length > 0 || feedback.focusAreas.length > 0) && (
                        <section className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3 rounded-2xl border bg-card p-5">
                                <h2 className="font-semibold">What went well</h2>
                                <List items={feedback.topStrengths} icon={CheckCircle2} tone="text-[#9EFF00]" />
                            </div>
                            <div className="space-y-3 rounded-2xl border bg-card p-5">
                                <h2 className="font-semibold">Focus on next</h2>
                                <List items={feedback.focusAreas} icon={Target} tone="text-amber-300" />
                            </div>
                        </section>
                    )}
                </>
            ) : (
                <RetryFeedback id={interview.id} />
            )}

            {metrics && (
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <Mic className="size-4 text-[#9EFF00]" /> How you sounded
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <Stat
                            label="Speaking pace"
                            value={metrics.wordsPerMinute ? `${metrics.wordsPerMinute} wpm` : "–"}
                            note={metrics.pace ? PACE[metrics.pace] : "Measured on spoken answers only."}
                        />
                        <Stat label="Average answer" value={`${metrics.averageWords} words`} note="Most spoken answers land between 100 and 250." />
                        <Stat
                            label="Filler words"
                            value={metrics.fillerCount}
                            note={metrics.topFillers.length ? `Mostly ${metrics.topFillers.map((f) => `"${f.word}"`).join(", ")}.` : "Speech recognition often leaves these out, so the real count may be higher."}
                        />
                        <Stat label="Answered" value={`${metrics.answers} of ${metrics.answers + metrics.skipped}`} note={metrics.skipped ? `${metrics.skipped} skipped` : "None skipped"} />
                    </div>
                </section>
            )}

            <section className="space-y-3">
                <h2 className="flex items-center gap-2 font-semibold">
                    <TrendingUp className="size-4 text-[#9EFF00]" /> Question by question
                </h2>
                <Accordion type="multiple" className="space-y-2">
                    {questionIds.map((questionId, index) => {
                        const review = feedback?.questions.find((question) => question.questionId === questionId);
                        const main = turns.find((turn) => turn.questionId === questionId && turn.kind === "main");
                        return (
                            <AccordionItem key={questionId} value={questionId} className="rounded-xl border bg-card px-4 last:border-b">
                                <AccordionTrigger className="gap-3 text-left hover:no-underline">
                                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                                        <span className="text-xs text-muted-foreground">
                                            Question {index + 1}
                                            {review?.topic ? ` · ${review.topic}` : ""}
                                        </span>
                                        <span className="font-medium leading-snug">{main?.prompt}</span>
                                    </span>
                                    {review && (
                                        <span className={cn("shrink-0 text-lg font-bold", review.skipped ? "text-muted-foreground" : verdict(review.score).tone)}>
                                            {review.skipped ? "Skipped" : review.score}
                                        </span>
                                    )}
                                </AccordionTrigger>
                                <AccordionContent className="space-y-5 pb-5">
                                    <Transcript turns={turns} questionId={questionId} />

                                    {review?.scores && (
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(CRITERIA).map(([key, criterion]) => (
                                                <span key={key} className="rounded-full bg-white/5 px-2.5 py-1 text-xs">
                                                    {criterion.label} <strong className="text-[#C9F300]">{review.scores[key]}</strong>/5
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {review && (review.strengths.length > 0 || review.improvements.length > 0) && (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {review.strengths.length > 0 && (
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-semibold">Strengths</h3>
                                                    <List items={review.strengths} icon={CheckCircle2} tone="text-[#9EFF00]" />
                                                </div>
                                            )}
                                            {review.improvements.length > 0 && (
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-semibold">To improve</h3>
                                                    <List items={review.improvements} icon={Target} tone="text-amber-300" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {review?.strongerAnswer && (
                                        <div className="space-y-2 rounded-xl border border-[#9EFF00]/20 bg-[#9EFF00]/5 p-4">
                                            <h3 className="text-sm font-semibold text-[#C9F300]">A stronger answer would</h3>
                                            <p className="text-sm leading-relaxed">{review.strongerAnswer}</p>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </section>
        </div>
    );
};

export default FeedbackView;
