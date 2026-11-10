import Link from "next/link";
import { ArrowRight, CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

function verdict(score) {
    if (score >= 80) return { label: "Excellent", tone: "text-[#9EFF00]" };
    if (score >= 60) return { label: "Good", tone: "text-[#C9F300]" };
    if (score >= 40) return { label: "Getting there", tone: "text-amber-300" };
    return { label: "Keep practising", tone: "text-red-300" };
}

// A quiz's score, the tip, and each question with the right answer. Used
// straight after a quiz and when reviewing an old one from the history.
const QuizResult = ({ result, hideStartNew = false, onStartNew, tipLoading = false }) => {
    if (!result) return null;

    const total = result.questions.length;
    const correct = result.questions.filter((q) => q.isCorrect).length;
    const score = Math.round(result.quizScore);
    const { label, tone } = verdict(score);

    return (
        <div className="space-y-5">
            <section className="flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-card p-6 text-center sm:flex-row sm:p-8 sm:text-left">
                <div className="flex size-28 shrink-0 flex-col items-center justify-center rounded-full border-4 border-[#9EFF00]/70">
                    <span className="text-3xl font-bold tabular-nums">{score}%</span>
                </div>
                <div className="space-y-1">
                    <p className={cn("text-sm font-semibold", tone)}>{label}</p>
                    <p className="text-2xl font-bold">
                        {correct} of {total} correct
                    </p>
                    <p className="text-sm text-muted-foreground">Open any question below to see the right answer and why.</p>
                </div>
            </section>

            {(tipLoading || result.improvementTip) && (
                <section aria-busy={tipLoading} className="flex gap-3 rounded-2xl border border-[#9EFF00]/25 bg-[#9EFF00]/[0.04] p-5">
                    <Lightbulb className="mt-0.5 size-5 shrink-0 text-[#C9F300]" />
                    <div className="flex-1 space-y-2">
                        <p className="text-sm font-semibold text-[#C9F300]">{tipLoading ? "Writing a tip based on what you missed…" : "What to study next"}</p>
                        {tipLoading ? (
                            <div className="space-y-2" aria-hidden="true">
                                <div className="ai-shimmer h-3 w-full rounded-full" />
                                <div className="ai-shimmer h-3 w-2/3 rounded-full" />
                            </div>
                        ) : (
                            <p className="text-sm leading-relaxed">{result.improvementTip}</p>
                        )}
                    </div>
                </section>
            )}

            <Accordion type="multiple" className="space-y-2">
                {result.questions.map((q, index) => (
                    <AccordionItem key={index} value={String(index)} className="rounded-2xl border border-white/10 bg-card px-4 last:border-b sm:px-5">
                        <AccordionTrigger className="gap-3 text-left hover:no-underline">
                            <span className="flex min-w-0 flex-1 items-start gap-3">
                                {q.isCorrect ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#9EFF00]" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-red-400" />}
                                <span className="font-medium leading-snug">{q.question}</span>
                            </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pb-5 pl-8 text-sm">
                            <p>
                                <span className="text-muted-foreground">Your answer: </span>
                                <span className={q.isCorrect ? "text-[#C9F300]" : "text-red-300"}>{q.userAnswer ?? "No answer"}</span>
                            </p>
                            {!q.isCorrect && (
                                <p>
                                    <span className="text-muted-foreground">Right answer: </span>
                                    <span className="text-[#C9F300]">{q.answer}</span>
                                </p>
                            )}
                            {q.explanation && <p className="rounded-xl bg-black/20 p-3 leading-relaxed text-muted-foreground">{q.explanation}</p>}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {!hideStartNew && (
                <div className="flex flex-col-reverse items-center gap-3 pt-2 sm:flex-row sm:justify-end">
                    <Link href="/interview" className="text-sm text-muted-foreground transition-colors hover:text-white">
                        Back to Interview Preparation
                    </Link>
                    <button
                        type="button"
                        onClick={onStartNew}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#9EFF00] px-6 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-[#b4ff33] active:translate-y-0 active:scale-[0.98] sm:w-auto"
                    >
                        Take another quiz <ArrowRight className="size-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuizResult;
