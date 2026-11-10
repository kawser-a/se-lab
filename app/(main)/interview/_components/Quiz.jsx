"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Keyboard, ListChecks, Timer, X } from "lucide-react";
import { toast } from "sonner";
import { generateQuiz, saveQuizResult, writeQuizTip } from "@/actions/interview";
import StagedProgress from "@/components/staged-progress";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import QuizResult from "./QuizResult";

const LETTERS = ["A", "B", "C", "D"];
const PRIMARY =
    "h-11 rounded-full bg-[#9EFF00] px-6 font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#b4ff33] active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:bg-white/10 disabled:text-white/40";

function Intro({ onStart, error }) {
    return (
        <div className="space-y-6 rounded-3xl border border-white/10 bg-card p-6 sm:p-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Ten questions for your field</h2>
                <p className="text-muted-foreground">Written for your industry and skills each time, so no two quizzes are the same.</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-3">
                {[
                    { icon: ListChecks, text: "Multiple choice, one right answer" },
                    { icon: Check, text: "Check each answer as you go, with an explanation" },
                    { icon: Timer, text: "About 5 minutes" },
                ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                        <Icon className="mt-0.5 size-4 shrink-0 text-[#9EFF00]" /> {text}
                    </li>
                ))}
            </ul>
            {error && (
                <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-200">
                    {error}
                </p>
            )}
            <div className="flex flex-col items-center gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
                <p className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                    <Keyboard className="size-4" /> Tip: press 1 to 4 to pick, Enter to check and continue.
                </p>
                <Button onClick={onStart} className={cn(PRIMARY, "w-full sm:w-auto")}>
                    {error ? "Try again" : "Start quiz"} <ArrowRight />
                </Button>
            </div>
        </div>
    );
}

const Quiz = () => {
    const router = useRouter();
    const [stage, setStage] = useState("intro"); // intro | writing | answering | saving | done
    const [questions, setQuestions] = useState([]);
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [checked, setChecked] = useState([]);
    const [result, setResult] = useState(null);
    const [tipLoading, setTipLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quitting, setQuitting] = useState(false);

    const start = async () => {
        setStage("writing");
        setError(null);
        try {
            const next = await generateQuiz();
            setQuestions(next);
            setAnswers(new Array(next.length).fill(null));
            setChecked(new Array(next.length).fill(false));
            setIndex(0);
            setResult(null);
            setStage("answering");
        } catch (err) {
            setError(err.message || "Couldn't write your quiz this time. Please try again.");
            setStage("intro");
        }
    };

    const finish = useCallback(async () => {
        setStage("saving");
        const correct = questions.filter((question, i) => answers[i] === question.correctAnswer).length;
        const score = (correct / questions.length) * 100;
        try {
            const saved = await saveQuizResult(questions, answers, score);
            setResult(saved);
            setStage("done");
            router.refresh();
            // The tip follows on its own; the score doesn't wait for it.
            if (correct < questions.length) {
                setTipLoading(true);
                const { tip } = await writeQuizTip(saved.id).catch(() => ({ tip: null }));
                setResult((current) => (current ? { ...current, improvementTip: tip } : current));
                setTipLoading(false);
            }
        } catch {
            toast.error("Couldn't save your result. Check your connection and try again.");
            setStage("answering");
        }
    }, [questions, answers, router]);

    const question = questions[index];
    const chosen = answers[index];
    const isChecked = checked[index];
    const last = index === questions.length - 1;

    const choose = useCallback(
        (option) => {
            if (stage !== "answering" || checked[index]) return;
            setAnswers((current) => current.map((answer, i) => (i === index ? option : answer)));
        },
        [stage, checked, index]
    );

    const primary = useCallback(() => {
        if (stage !== "answering" || !answers[index]) return;
        if (!checked[index]) return setChecked((current) => current.map((value, i) => (i === index ? true : value)));
        if (last) return finish();
        setIndex(index + 1);
    }, [stage, answers, checked, index, last, finish]);

    // Keyboard: 1 to 4 or A to D picks, Enter checks and moves on, left arrow goes back.
    useEffect(() => {
        if (stage !== "answering") return;
        const onKey = (event) => {
            if (event.target instanceof HTMLElement && event.target.closest("input, textarea, [role=dialog]")) return;
            const key = event.key.toUpperCase();
            const pick = /^[1-4]$/.test(key) ? Number(key) - 1 : LETTERS.indexOf(key);
            if (pick >= 0 && question?.options[pick]) {
                event.preventDefault();
                choose(question.options[pick]);
            } else if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) {
                event.preventDefault();
                primary();
            } else if (event.key === "ArrowLeft" && index > 0) {
                setIndex(index - 1);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [stage, question, choose, primary, index]);

    // Leaving halfway loses the answers, so the browser asks first.
    useEffect(() => {
        if (stage !== "answering") return;
        const warn = (event) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [stage]);

    if (stage === "intro") return <Intro onStart={start} error={error} />;

    if (stage === "writing") {
        return (
            <div className="flex min-h-80 items-center justify-center rounded-3xl border border-white/10 bg-card p-8">
                <StagedProgress title="Writing your quiz" steps={["Picking topics from your skills", "Writing ten questions", "Checking every answer"]} expectedMs={6000} />
            </div>
        );
    }

    if (stage === "done" && result) {
        return <QuizResult result={result} tipLoading={tipLoading} onStartNew={start} />;
    }

    const correctSoFar = questions.filter((q, i) => checked[i] && answers[i] === q.correctAnswer).length;
    const right = isChecked && chosen === question.correctAnswer;

    return (
        <div className="space-y-5 rounded-3xl border border-white/10 bg-card p-5 sm:p-8">
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">
                        Question {index + 1} <span className="text-muted-foreground">of {questions.length}</span>
                    </span>
                    <span className="text-muted-foreground">{correctSoFar} correct so far</span>
                    <button type="button" onClick={() => setQuitting(true)} className="text-muted-foreground transition-colors hover:text-white">
                        Quit
                    </button>
                </div>
                <div className="flex gap-1" aria-hidden="true">
                    {questions.map((q, i) => (
                        <span
                            key={i}
                            className={cn(
                                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                                checked[i] ? (answers[i] === q.correctAnswer ? "bg-[#9EFF00]" : "bg-red-400") : i === index ? "bg-white/50" : "bg-white/10"
                            )}
                        />
                    ))}
                </div>
            </div>

            <p className="text-lg font-semibold leading-relaxed sm:text-xl">{question.question}</p>

            <div role="radiogroup" aria-label="Answers" className="grid gap-2.5">
                {question.options.map((option, i) => {
                    const selected = chosen === option;
                    const isAnswer = option === question.correctAnswer;
                    return (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={isChecked}
                            onClick={() => choose(option)}
                            className={cn(
                                "flex items-center gap-3 rounded-2xl border p-4 text-left text-sm transition-all duration-150 sm:text-base",
                                !isChecked && (selected ? "border-[#9EFF00]/70 bg-[#9EFF00]/[0.07]" : "border-white/10 hover:border-white/30 hover:bg-white/[0.03]"),
                                isChecked && isAnswer && "border-[#9EFF00]/70 bg-[#9EFF00]/10",
                                isChecked && selected && !isAnswer && "border-red-400/70 bg-red-400/10",
                                isChecked && !selected && !isAnswer && "border-white/5 opacity-50"
                            )}
                        >
                            <span
                                className={cn(
                                    "flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold",
                                    selected && !isChecked ? "border-[#9EFF00] bg-[#9EFF00] text-black" : "border-white/20 text-muted-foreground",
                                    isChecked && isAnswer && "border-[#9EFF00] bg-[#9EFF00] text-black",
                                    isChecked && selected && !isAnswer && "border-red-400 bg-red-400 text-black"
                                )}
                            >
                                {isChecked && isAnswer ? <Check className="size-4" /> : isChecked && selected ? <X className="size-4" /> : LETTERS[i]}
                            </span>
                            <span className="flex-1">{option}</span>
                        </button>
                    );
                })}
            </div>

            {isChecked && (
                <div role="status" className={cn("space-y-1 rounded-2xl border p-4 text-sm", right ? "border-[#9EFF00]/30 bg-[#9EFF00]/5" : "border-red-400/30 bg-red-400/5")}>
                    <p className={cn("font-semibold", right ? "text-[#C9F300]" : "text-red-300")}>{right ? "Correct" : "Not quite"}</p>
                    {question.explanation && <p className="leading-relaxed text-muted-foreground">{question.explanation}</p>}
                </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-5">
                <Button variant="ghost" className="rounded-full" onClick={() => setIndex(index - 1)} disabled={index === 0 || stage === "saving"}>
                    <ArrowLeft /> Back
                </Button>
                <Button className={PRIMARY} onClick={primary} disabled={!chosen || stage === "saving"}>
                    {stage === "saving" ? "Saving your result…" : !isChecked ? "Check answer" : last ? "See my results" : "Next question"}
                    {stage !== "saving" && <ArrowRight />}
                </Button>
            </div>

            <AlertDialog open={quitting} onOpenChange={setQuitting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Quit this quiz?</AlertDialogTitle>
                        <AlertDialogDescription>Your answers so far won&apos;t be saved or count towards your progress.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep going</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Link href="/interview">Quit quiz</Link>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Quiz;
