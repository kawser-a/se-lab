"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronRight, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteVoiceInterview } from "@/actions/voice-interview";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INTERVIEW_TYPES, LEVELS, scoreVerdict } from "@/lib/interview/config";
import { cn } from "@/lib/utils";
import QuizResult from "./QuizResult";

const PAGE = 5;
const TAB =
    "h-full rounded-full border-0 px-4 text-muted-foreground data-[state=active]:bg-[#9EFF00] data-[state=active]:text-black data-[state=active]:shadow-none dark:data-[state=active]:bg-[#9EFF00] dark:data-[state=active]:text-black";

function EmptyState({ children, href, action }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-sm text-muted-foreground">{children}</p>
            <Link href={href} className="text-sm font-medium text-[#C9F300] underline-offset-4 hover:underline">
                {action}
            </Link>
        </div>
    );
}

function ShowMore({ total, shown, onClick }) {
    if (total <= PAGE) return null;
    return (
        <button type="button" onClick={onClick} className="w-full rounded-xl py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white">
            {shown < total ? `Show all ${total}` : "Show fewer"}
        </button>
    );
}

function InterviewStatus({ interview }) {
    if (interview.status === "IN_PROGRESS") {
        return (
            <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300">
                In progress · {interview.answered}/{interview.total}
            </span>
        );
    }
    if (!interview.hasFeedback) return <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">Feedback pending</span>;
    const score = Math.round(interview.score);
    const { label, tone } = scoreVerdict(score);
    return (
        <span className="flex items-baseline gap-2">
            <span className={cn("hidden text-xs sm:inline", tone)}>{label}</span>
            <span className={cn("text-xl font-bold tabular-nums", tone)}>{score}</span>
        </span>
    );
}

function InterviewList({ interviews }) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, startDelete] = useTransition();

    if (!interviews.length) {
        return (
            <EmptyState href="/interview/voice/new" action="Start your first voice interview">
                No voice interviews yet. A short one takes about 10 minutes.
            </EmptyState>
        );
    }

    const shown = expanded ? interviews : interviews.slice(0, PAGE);

    const confirmDelete = () =>
        startDelete(async () => {
            try {
                await deleteVoiceInterview(pendingDelete.id);
                toast.success("Interview deleted.");
                setPendingDelete(null);
                router.refresh();
            } catch {
                toast.error("Couldn't delete that interview. Please try again.");
            }
        });

    return (
        <>
            <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-card">
                {shown.map((interview) => {
                    const inProgress = interview.status === "IN_PROGRESS";
                    return (
                        <li key={interview.id} className="group flex items-center transition-colors hover:bg-white/[0.03]">
                            <Link
                                href={inProgress ? `/interview/voice/${interview.id}` : `/interview/voice/${interview.id}/feedback`}
                                className="flex min-w-0 flex-1 items-center gap-4 p-4 sm:px-5"
                                aria-label={`${interview.role}, ${inProgress ? "resume" : "view feedback"}`}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{interview.role}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {INTERVIEW_TYPES[interview.type]?.label} · {LEVELS[interview.level]?.label} · {format(new Date(interview.createdAt), "d MMM yyyy")}
                                    </p>
                                </div>
                                <InterviewStatus interview={interview} />
                                <span className="hidden text-xs font-medium text-muted-foreground transition-colors group-hover:text-white sm:inline">
                                    {inProgress ? "Resume" : "Feedback"}
                                </span>
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => setPendingDelete(interview)}
                                aria-label={`Delete the ${interview.role} interview`}
                                title="Delete"
                                className="mr-2 rounded-lg p-2 text-muted-foreground opacity-100 transition-all hover:bg-red-500/10 hover:text-red-300 sm:mr-3 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </li>
                    );
                })}
            </ul>
            <ShowMore total={interviews.length} shown={shown.length} onClick={() => setExpanded(!expanded)} />

            <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this interview?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The {pendingDelete?.role} interview from {pendingDelete && format(new Date(pendingDelete.createdAt), "d MMM yyyy")}, with its answers and
                            feedback, will be removed for good. This can&apos;t be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-500"
                            disabled={deleting}
                            onClick={(event) => {
                                event.preventDefault();
                                confirmDelete();
                            }}
                        >
                            {deleting && <Loader2 className="animate-spin" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function QuizList({ quizzes }) {
    const [expanded, setExpanded] = useState(false);
    const [open, setOpen] = useState(null);

    if (!quizzes.length) {
        return (
            <EmptyState href="/interview/mock" action="Take your first quiz">
                No quizzes yet. Each one is ten questions and takes about five minutes.
            </EmptyState>
        );
    }

    // Newest first, numbered in the order they were taken.
    const ordered = quizzes.map((quiz, index) => ({ ...quiz, number: index + 1 })).reverse();
    const shown = expanded ? ordered : ordered.slice(0, PAGE);

    return (
        <>
            <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-card">
                {shown.map((quiz) => {
                    const score = Math.round(quiz.quizScore);
                    return (
                        <li key={quiz.id}>
                            <button type="button" onClick={() => setOpen(quiz)} className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.03] sm:px-5">
                                <div className="min-w-0 flex-1 space-y-1">
                                    <p className="font-medium">
                                        Quiz {quiz.number} <span className="font-normal text-muted-foreground">· {format(new Date(quiz.createdAt), "d MMM yyyy")}</span>
                                    </p>
                                    {quiz.improvementTip && <p className="line-clamp-1 text-xs text-muted-foreground">{quiz.improvementTip}</p>}
                                </div>
                                <div className="hidden w-24 sm:block" aria-hidden="true">
                                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full rounded-full bg-sky-300" style={{ width: `${score}%` }} />
                                    </div>
                                </div>
                                <span className="w-12 text-right text-lg font-bold tabular-nums">{score}%</span>
                                <span className="hidden text-xs font-medium text-muted-foreground transition-colors group-hover:text-white sm:inline">Review</span>
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                            </button>
                        </li>
                    );
                })}
            </ul>
            <ShowMore total={ordered.length} shown={shown.length} onClick={() => setExpanded(!expanded)} />

            <AlertDialog open={Boolean(open)} onOpenChange={(next) => !next && setOpen(null)}>
                <AlertDialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="sr-only">Quiz {open?.number} results</AlertDialogTitle>
                    </AlertDialogHeader>
                    <QuizResult result={open} hideStartNew />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// Past sessions, one tab per kind of practice.
const History = ({ interviews, quizzes }) => (
    <section aria-labelledby="history-heading" className="space-y-4">
        <h2 id="history-heading" className="text-xl font-semibold">
            History
        </h2>
        <Tabs defaultValue={interviews.length || !quizzes.length ? "voice" : "quiz"} className="gap-4">
            <TabsList className="h-11 rounded-full border border-white/10 bg-white/[0.03] p-1">
                <TabsTrigger value="voice" className={TAB}>
                    Voice interviews <span className="ml-1.5 text-xs opacity-70">{interviews.length}</span>
                </TabsTrigger>
                <TabsTrigger value="quiz" className={TAB}>
                    Quizzes <span className="ml-1.5 text-xs opacity-70">{quizzes.length}</span>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="voice" className="space-y-2">
                <InterviewList interviews={interviews} />
            </TabsContent>
            <TabsContent value="quiz" className="space-y-2">
                <QuizList quizzes={quizzes} />
            </TabsContent>
        </Tabs>
    </section>
);

export default History;
