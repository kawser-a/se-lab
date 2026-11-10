"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Keyboard, Loader2, Mic, RotateCcw, SkipForward, Square, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { finishVoiceInterview, submitVoiceAnswer } from "@/actions/voice-interview";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { INTERVIEW_TYPES, LEVELS, MAX_ANSWER_CHARS } from "@/lib/interview/config";
import { canRecord, createSpeaker, getRecognitionClass } from "@/lib/interview/speech";
import { cn } from "@/lib/utils";
import InterviewOrb from "./interview-orb";
import MicCheck from "./mic-check";
import { useAnswer } from "./use-answer";

const MUTE_KEY = "growthgrid:interviewer-muted";

function readMuted() {
    try {
        return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
        return false;
    }
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const InterviewSession = ({ initialView, capabilities }) => {
    const router = useRouter();
    const [view, setView] = useState(initialView);
    // intro | asking | answering | saving | finishing
    const [phase, setPhase] = useState("intro");
    const [mode, setMode] = useState("typed");
    const [stream, setStream] = useState(null);
    const [muted, setMuted] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const speaker = useMemo(() => (typeof window === "undefined" ? null : createSpeaker()), []);
    const mutedRef = useRef(false);

    // Only the browser knows what it supports, so this is checked after the
    // first render. Until then it assumes voice, which is the common case.
    const [voiceAvailable, setVoiceAvailable] = useState(true);
    useEffect(() => {
        setVoiceAvailable(Boolean(getRecognitionClass()) || (capabilities.serverTranscription && canRecord()));
    }, [capabilities.serverTranscription]);

    useEffect(() => {
        const stored = readMuted();
        setMuted(stored);
        mutedRef.current = stored;
    }, []);

    // If the browser's own recognition fails (Brave, some Android builds),
    // fall back to recording, or to typing if that isn't available either.
    // Returns the mode it switched to, so the message can say what happens next.
    const onModeFailed = useCallback(() => {
        const next = capabilities.serverTranscription && canRecord() && stream ? "record" : "typed";
        setMode(next);
        return next;
    }, [capabilities.serverTranscription, stream]);

    const step = view.step;
    const answer = useAnswer({
        mode,
        stream,
        context: step.type === "question" ? `Job interview for a ${view.role} role. Question: ${step.prompt}` : undefined,
        onModeFailed,
    });
    const { start: startListening, cancel: cancelListening, reset: resetAnswer } = answer;

    useEffect(
        () => () => {
            speaker?.dispose();
            stream?.getTracks().forEach((track) => track.stop());
        },
        [speaker, stream]
    );

    // Ask the current question, then start listening.
    const ask = useCallback(
        async (target = view) => {
            if (target.step.type !== "question") return;
            resetAnswer();
            setSaveError(null);
            setPhase("asking");
            window.scrollTo({ top: 0, behavior: "smooth" });
            if (!mutedRef.current) await speaker?.speak(target.step.prompt);
            setPhase((current) => (current === "asking" ? "answering" : current));
        },
        [view, speaker, resetAnswer]
    );

    // Listening starts on its own once the question has been asked.
    useEffect(() => {
        if (phase === "answering" && mode !== "typed" && answer.status === "idle" && !answer.error && !answer.text) {
            startListening();
        }
    }, [phase, mode, answer.status, answer.error, answer.text, startListening]);

    // Don't lose an answer to an accidental refresh.
    useEffect(() => {
        const unsaved = phase === "answering" && (answer.status === "listening" || answer.text.trim());
        if (!unsaved) return;
        const warn = (event) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [phase, answer.status, answer.text]);

    const begin = (micStream) => {
        if (micStream) {
            setStream(micStream);
            setMode(getRecognitionClass() ? "browser" : capabilities.serverTranscription && canRecord() ? "record" : "typed");
        } else {
            setMode("typed");
        }
        ask();
    };

    const finish = useCallback(async () => {
        speaker?.cancel();
        cancelListening();
        setPhase("finishing");
        try {
            const result = await finishVoiceInterview(view.id);
            if (result.error) throw new Error(result.error);
            if (result.abandoned) {
                toast("Interview ended. Nothing was answered, so there's no feedback this time.");
                router.push("/interview");
            } else {
                router.push(`/interview/voice/${view.id}/feedback`);
            }
        } catch (error) {
            toast.error(error.message || "Couldn't finish the interview. Please try again.");
            setPhase("answering");
        }
    }, [speaker, cancelListening, view.id, router]);

    const save = async ({ skipped = false } = {}) => {
        speaker?.cancel();
        cancelListening();
        setSaveError(null);
        setPhase("saving");

        try {
            const result = await submitVoiceAnswer(view.id, {
                turnIndex: view.turnIndex,
                answer: skipped ? "" : answer.text.trim(),
                inputMode: mode === "typed" ? "typed" : "voice",
                durationMs: skipped || mode === "typed" ? 0 : Math.round(answer.durationMs),
                skipped,
            });

            if (result.error && !result.view) {
                setSaveError(result.error);
                setPhase("answering");
                return;
            }
            if (result.notice) toast(result.notice);

            const next = result.view;
            setView(next);
            if (next.status !== "IN_PROGRESS") {
                router.push(`/interview/voice/${next.id}/feedback`);
            } else if (next.step.type === "complete") {
                await finish();
            } else {
                await ask(next);
            }
        } catch {
            // Most likely offline. The answer is still here, and sending it
            // again is safe because each answer carries its turn number.
            setSaveError("Couldn't save your answer. Check your connection and try again.");
            setPhase("answering");
        }
    };

    const toggleMute = () => {
        const next = !muted;
        setMuted(next);
        mutedRef.current = next;
        try {
            localStorage.setItem(MUTE_KEY, next ? "1" : "0");
        } catch {}
        if (next) speaker?.cancel();
    };

    const repeat = async () => {
        cancelListening();
        resetAnswer();
        setPhase("asking");
        await speaker?.speak(step.prompt);
        setPhase("answering");
    };

    const orbState =
        phase === "asking" && !muted ? "speaking" : answer.status === "listening" ? "listening" : phase === "saving" || phase === "finishing" || answer.status === "transcribing" ? "thinking" : "idle";

    const header = (
        <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="icon" asChild>
                <Link href="/interview" aria-label="Back to interview preparation">
                    <ChevronLeft />
                </Link>
            </Button>
            <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{view.role}</p>
                <p className="text-xs text-muted-foreground">
                    {INTERVIEW_TYPES[view.type]?.label} · {LEVELS[view.level]?.label}
                </p>
            </div>
            {phase !== "intro" && (
                <Button variant="ghost" size="icon" onClick={toggleMute} aria-label={muted ? "Turn the interviewer's voice on" : "Mute the interviewer"} aria-pressed={muted}>
                    {muted ? <VolumeX /> : <Volume2 />}
                </Button>
            )}
        </div>
    );

    if (phase === "intro") {
        const resuming = view.turnIndex > 0;
        return (
            <div className="mx-auto max-w-2xl pt-4 pb-16">
                {header}
                <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-6 text-center sm:p-10">
                    <InterviewOrb state="idle" />
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold sm:text-3xl">{resuming ? "Pick up where you left off" : "Ready when you are"}</h1>
                        <p className="text-muted-foreground">
                            {resuming
                                ? `You've answered ${view.answered} of ${view.total} questions. The next one is question ${step.number}.`
                                : `${view.total} questions. The interviewer may ask a short follow-up after an answer. Take your time.`}
                        </p>
                    </div>
                    <div className="w-full text-left">
                        <MicCheck voiceAvailable={voiceAvailable} onReady={begin} onTypeInstead={() => begin(null)} resuming={resuming} />
                    </div>
                </div>
            </div>
        );
    }

    if (step.type !== "question" || phase === "finishing") {
        return (
            <div className="mx-auto max-w-2xl pt-4">
                {header}
                <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-10 text-center">
                    <InterviewOrb state="thinking" />
                    <div className="space-y-2" aria-live="polite">
                        <h1 className="text-2xl font-bold">That&apos;s the interview</h1>
                        <p className="text-muted-foreground">Writing your feedback. This usually takes under a minute.</p>
                    </div>
                    {phase !== "finishing" && <Button onClick={finish}>See my feedback</Button>}
                </div>
            </div>
        );
    }

    const listening = answer.status === "listening";
    const reviewing = answer.status === "review" || (mode === "typed" && phase === "answering");
    const busy = phase === "saving";

    return (
        <div className="mx-auto max-w-2xl pt-4 pb-48 sm:pb-16">
            {header}

            <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Question {step.number} of {step.total}
                    {step.kind === "follow-up" && <span className="ml-2 rounded-full bg-[#9EFF00]/10 px-2 py-0.5 text-xs text-[#C9F300]">Follow-up</span>}
                </span>
                <span>{view.answered} answered</span>
            </div>
            <div className="mb-6 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#9EFF00] transition-[width] duration-500" style={{ width: `${((step.number - 1) / step.total) * 100}%` }} />
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-5 sm:gap-6 sm:p-8">
                <InterviewOrb state={orbState} level={answer.level} compact />

                <p className="text-center text-lg font-medium leading-relaxed sm:text-xl" aria-live="polite">
                    {step.prompt}
                </p>

                {phase === "asking" && (
                    <Button variant="ghost" size="sm" onClick={() => { speaker?.cancel(); setPhase("answering"); }}>
                        Skip reading, I&apos;m ready to answer
                    </Button>
                )}

                {phase !== "asking" && (
                    <div className="w-full space-y-3">
                        {listening && (
                            <div className="min-h-24 rounded-xl border border-[#9EFF00]/30 bg-black/20 p-4 text-left" aria-live="polite">
                                {answer.text || answer.interim ? (
                                    <p className="leading-relaxed">
                                        {answer.text} <span className="text-muted-foreground">{answer.interim}</span>
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">{mode === "record" ? "Recording. Answer whenever you're ready." : "Listening. Answer whenever you're ready."}</p>
                                )}
                            </div>
                        )}

                        {answer.status === "transcribing" && (
                            <p className="flex items-center justify-center gap-2 py-6 text-muted-foreground" aria-live="polite">
                                <Loader2 className="size-4 animate-spin" /> Writing down your answer
                            </p>
                        )}

                        {reviewing && (
                            <div className="space-y-2">
                                <label htmlFor="answer" className="text-sm text-muted-foreground">
                                    {mode === "typed" ? "Your answer" : answer.text ? "Check your answer. Fix anything that was misheard, then send it." : "We didn't catch anything that time."}
                                </label>
                                <Textarea
                                    id="answer"
                                    value={answer.text}
                                    onChange={(event) => answer.setText(event.target.value)}
                                    maxLength={MAX_ANSWER_CHARS}
                                    rows={6}
                                    placeholder={mode === "typed" ? "Type your answer as you'd say it out loud." : "Record again, or type your answer here."}
                                    className="min-h-36 text-base leading-relaxed"
                                    disabled={busy}
                                />
                            </div>
                        )}

                        {(answer.error || saveError) && (
                            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-300">
                                {saveError || answer.error}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {phase !== "asking" && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-[#121212]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mt-5 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                    <div className="mx-auto flex max-w-2xl flex-col gap-3">
                        {listening ? (
                            <Button size="lg" className="h-12 w-full" onClick={answer.stop}>
                                <Square className="fill-current" /> Done answering
                                <span className="ml-auto font-mono text-sm tabular-nums opacity-70">{formatTime(answer.elapsed)}</span>
                            </Button>
                        ) : reviewing ? (
                            <div className="flex gap-2">
                                {mode !== "typed" && (
                                    <Button size="lg" variant="outline" className="h-12" onClick={startListening} disabled={busy} aria-label="Record again">
                                        <RotateCcw /> <span className="hidden sm:inline">Record again</span>
                                    </Button>
                                )}
                                <Button size="lg" className="h-12 flex-1" onClick={() => save()} disabled={busy || !answer.text.trim()}>
                                    {busy && <Loader2 className="animate-spin" />}
                                    {busy ? "Saving" : "Send answer"}
                                </Button>
                            </div>
                        ) : answer.status === "idle" && mode !== "typed" ? (
                            <Button size="lg" className="h-12 w-full" onClick={startListening} disabled={busy}>
                                <Mic /> Start answering
                            </Button>
                        ) : null}

                        <div className="flex flex-wrap items-center justify-center gap-x-2 text-sm">
                            <Button variant="ghost" size="sm" onClick={repeat} disabled={busy}>
                                <Volume2 /> Repeat question
                            </Button>
                            {mode !== "typed" && answer.status !== "transcribing" && (
                                <Button variant="ghost" size="sm" onClick={() => { cancelListening(); setMode("typed"); }} disabled={busy}>
                                    <Keyboard /> Type instead
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => save({ skipped: true })} disabled={busy}>
                                <SkipForward /> Skip
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className={cn("text-muted-foreground")} disabled={busy}>
                                        End interview
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>End the interview now?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You&apos;ll get feedback on the {view.answered} {view.answered === 1 ? "answer" : "answers"} you&apos;ve given. Questions you haven&apos;t reached won&apos;t count against you.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Keep going</AlertDialogCancel>
                                        <AlertDialogAction onClick={finish}>End and get feedback</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewSession;
