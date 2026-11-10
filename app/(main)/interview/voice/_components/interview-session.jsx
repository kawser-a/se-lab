"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Captions, CaptionsOff, Check, Ellipsis, Hand, Keyboard, Loader2, Mic, PhoneOff, Repeat2, SkipForward, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { finishVoiceInterview, prepareVoiceInterview, submitVoiceAnswer } from "@/actions/voice-interview";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { INTERVIEW_TYPES, LEVELS, MAX_ANSWER_CHARS } from "@/lib/interview/config";
import { NOT_CAUGHT } from "@/lib/interview/script";
import { canRecord, createSpeaker, getRecognitionClass } from "@/lib/interview/speech";
import { cn } from "@/lib/utils";
import { InterviewerTile, SelfTile } from "./call-tiles";
import MicCheck from "./mic-check";
import { useAnswer } from "./use-answer";

const CAPTIONS_KEY = "growthgrid:interview-captions";

function readCaptions() {
    try {
        return localStorage.getItem(CAPTIONS_KEY) === "1";
    } catch {
        return false;
    }
}

function clock(ms) {
    const seconds = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// After this many answers in a row come back empty, stop asking again and
// suggest typing instead.
const MAX_MISSES = 2;

const InterviewSession = ({ initialView, capabilities }) => {
    const router = useRouter();
    const [view, setView] = useState(initialView);
    // lobby | speaking | answering | thinking | closing
    const [phase, setPhase] = useState("lobby");
    const [mode, setMode] = useState("typed");
    const [stream, setStream] = useState(null);
    const [captions, setCaptions] = useState(false);
    const [voiceOn, setVoiceOn] = useState(true);
    const [speakLevel, setSpeakLevel] = useState(0);
    const [caption, setCaption] = useState("");
    const [typed, setTyped] = useState("");
    const [problem, setProblem] = useState(null);
    const [autoListen, setAutoListen] = useState(true);
    const [startedAt, setStartedAt] = useState(null);
    const [now, setNow] = useState(0);
    const [voiceAvailable, setVoiceAvailable] = useState(true);

    const speaker = useRef(null);
    const viewRef = useRef(view);
    const voiceOnRef = useRef(true);
    const misses = useRef(0);
    viewRef.current = view;

    // Only the browser knows what it supports, so check after the first render.
    useEffect(() => {
        setVoiceAvailable(Boolean(getRecognitionClass()) || (capabilities.serverTranscription && canRecord()));
        setCaptions(readCaptions());
    }, [capabilities.serverTranscription]);

    useEffect(() => {
        if (!startedAt) return;
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [startedAt]);

    // Release the microphone when it's replaced or the page closes, and the
    // interviewer's voice only when the page closes.
    useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream]);
    // The voice is set up on arrival so audio can load during the mic check.
    // It can only start playing after the click on "Join".
    useEffect(() => {
        speaker.current = createSpeaker({
            voice: initialView.interviewer.voice,
            serverVoice: capabilities.serverVoice,
            onLevel: setSpeakLevel,
            onCaption: setCaption,
        });
        return () => speaker.current?.dispose();
    }, [initialView.interviewer.voice, capabilities.serverVoice]);

    // Questions are written while the candidate is in the lobby.
    const [prepareError, setPrepareError] = useState(null);
    const prepare = useCallback(async () => {
        setPrepareError(null);
        try {
            const result = await prepareVoiceInterview(viewRef.current.id);
            if (result.error) setPrepareError(result.error);
            else setView(result.view);
        } catch {
            setPrepareError("Couldn't prepare your questions. Check your connection and try again.");
        }
    }, []);

    useEffect(() => {
        if (initialView.preparing) prepare();
    }, [initialView.preparing, prepare]);

    // Once the questions exist, load what the interviewer will say first.
    const linesFor = useCallback((target, opening) => {
        const firstQuestion = target.turnIndex === 0;
        // A greeting or "welcome back" replaces the usual "Thanks, moving on".
        const lead = opening && !firstQuestion ? null : target.step.lead;
        return [opening, lead, target.step.prompt];
    }, []);

    const ready = !view.preparing;
    useEffect(() => {
        if (!ready || phase !== "lobby") return;
        const current = viewRef.current;
        speaker.current?.prefetch(linesFor(current, current.turnIndex === 0 ? current.script.opening : current.script.resume));
        speaker.current?.prefetch(NOT_CAUGHT);
    }, [ready, phase, linesFor]);

    // Returns the mode it switched to, so the message can say what happens next.
    const onModeFailed = useCallback(() => {
        const next = capabilities.serverTranscription && canRecord() && stream ? "record" : "typed";
        setMode(next);
        if (next === "typed") setCaptions(true);
        return next;
    }, [capabilities.serverTranscription, stream]);

    const say = useCallback(async (parts) => {
        setCaption([].concat(parts).filter(Boolean).join(" "));
        if (voiceOnRef.current && speaker.current) await speaker.current.speak(parts);
    }, []);

    const ask = useCallback(
        async (target, opening) => {
            if (target.step.type !== "question") return;
            setProblem(null);
            setPhase("speaking");
            // Load the next question's audio while this one is asked and answered.
            if (target.upcoming) speaker.current?.prefetch(target.upcoming);
            await say(linesFor(target, opening));
            setCaption(target.step.prompt);
            setPhase((current) => (current === "speaking" ? "answering" : current));
        },
        [say, linesFor]
    );

    const finish = useCallback(async () => {
        speaker.current?.cancel();
        setPhase("closing");
        try {
            const result = await finishVoiceInterview(viewRef.current.id);
            if (result.error) throw new Error(result.error);
            if (result.abandoned) {
                toast("Interview ended. Nothing was answered, so there's no feedback this time.");
                router.push("/interview");
            } else {
                router.push(`/interview/voice/${viewRef.current.id}/feedback`);
            }
        } catch (error) {
            toast.error(error.message || "Couldn't finish the interview. Please try again.");
            setPhase("answering");
            setAutoListen(false);
        }
    }, [router]);

    const submit = useCallback(
        async ({ text = "", durationMs = 0, inputMode, skipped = false }) => {
            setPhase("thinking");
            setProblem(null);
            const current = viewRef.current;

            try {
                const result = await submitVoiceAnswer(current.id, {
                    turnIndex: current.turnIndex,
                    answer: skipped ? "" : text.trim(),
                    inputMode,
                    durationMs: Math.round(durationMs),
                    skipped,
                });

                if (result.error && !result.view) {
                    setProblem({ message: result.error, retry: { text, durationMs, inputMode, skipped } });
                    setPhase("answering");
                    setAutoListen(false);
                    return;
                }
                if (result.notice) toast(result.notice);

                const next = result.view;
                misses.current = 0;
                setTyped("");
                setView(next);

                if (next.status !== "IN_PROGRESS") {
                    router.push(`/interview/voice/${next.id}/feedback`);
                } else if (next.step.type === "complete") {
                    setPhase("closing");
                    await say(next.script.closing);
                    await finish();
                } else {
                    setAutoListen(true);
                    await ask(next);
                }
            } catch {
                // Probably offline. Sending again is safe: each answer carries its turn number.
                setProblem({ message: "Couldn't send your answer. Check your connection and try again.", retry: { text, durationMs, inputMode, skipped } });
                setPhase("answering");
                setAutoListen(false);
            }
        },
        [ask, finish, router, say]
    );

    const onAnswerDone = useCallback(
        async ({ text, durationMs, reason }) => {
            if (reason === "switched" || reason === "error") return;

            if (!text.trim()) {
                misses.current += 1;
                if (misses.current >= MAX_MISSES) {
                    setAutoListen(false);
                    setProblem({ message: "I'm having trouble hearing you. Check your microphone, or type your answer instead." });
                    return;
                }
                setPhase("speaking");
                await say(NOT_CAUGHT);
                setPhase("answering");
                return;
            }

            await submit({ text, durationMs, inputMode: "voice" });
        },
        [say, submit]
    );

    const step = view.step;
    const answer = useAnswer({
        mode,
        stream,
        context: step.type === "question" ? `Job interview for a ${view.role} role. Question: ${step.prompt}` : undefined,
        onModeFailed,
        onDone: onAnswerDone,
    });
    const { start: startListening, cancel: cancelListening } = answer;

    // The candidate's turn starts as soon as the interviewer stops talking.
    useEffect(() => {
        if (phase === "answering" && mode !== "typed" && autoListen && answer.status === "idle" && !answer.error) {
            startListening();
        }
    }, [phase, mode, autoListen, answer.status, answer.error, startListening]);

    useEffect(() => {
        const busy = phase === "answering" && (answer.status !== "idle" || typed.trim());
        if (!busy) return;
        const warn = (event) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [phase, answer.status, typed]);

    const join = (micStream) => {
        // Called from the click on "Join", which is what lets audio play.
        speaker.current?.unlock();

        if (micStream) {
            setStream(micStream);
            setMode(getRecognitionClass() ? "browser" : capabilities.serverTranscription && canRecord() ? "record" : "typed");
        } else {
            setMode("typed");
            setCaptions(true);
        }
        setStartedAt(Date.now());
        window.scrollTo({ top: 0 });
        ask(view, view.turnIndex === 0 ? view.script.opening : view.script.resume);
    };

    const toggleCaptions = () => {
        const next = !captions;
        setCaptions(next);
        try {
            localStorage.setItem(CAPTIONS_KEY, next ? "1" : "0");
        } catch {}
    };

    const toggleVoice = () => {
        const next = !voiceOn;
        setVoiceOn(next);
        voiceOnRef.current = next;
        if (!next) {
            speaker.current?.cancel();
            setCaptions(true);
        }
    };

    const repeat = async () => {
        cancelListening();
        setPhase("speaking");
        await say(step.prompt);
        setAutoListen(true);
        setPhase("answering");
    };

    const skip = () => {
        cancelListening();
        speaker.current?.cancel();
        submit({ inputMode: mode === "typed" ? "typed" : "voice", skipped: true });
    };

    const switchToTyping = () => {
        cancelListening();
        setMode("typed");
        setCaptions(true);
        setProblem(null);
    };

    const switchToVoice = () => {
        setMode(getRecognitionClass() ? "browser" : "record");
        setProblem(null);
        setAutoListen(true);
    };

    const listenAgain = () => {
        misses.current = 0;
        setProblem(null);
        answer.setError(null);
        setAutoListen(true);
    };

    // ---- Lobby --------------------------------------------------------------

    if (phase === "lobby") {
        const resuming = view.turnIndex > 0;
        return (
            <div className="mx-auto grid max-w-5xl gap-6 pt-4 pb-16 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                <InterviewerTile interviewer={view.interviewer} state="idle" level={0} compact />
                <div className="space-y-5">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            {INTERVIEW_TYPES[view.type]?.label} · {LEVELS[view.level]?.label} · {view.total} questions
                        </p>
                        <h1 className="text-3xl font-bold">{resuming ? "Ready to pick up again?" : `${view.interviewer.name} is ready for you`}</h1>
                        <p className="text-muted-foreground">
                            {resuming
                                ? `You've answered ${view.answered} of ${view.total} questions for the ${view.role} interview.`
                                : `A spoken interview for the ${view.role} role. Answer out loud, the way you would on a call. Take a moment to think before you answer whenever you need to.`}
                        </p>
                    </div>
                    <MicCheck
                        voiceAvailable={voiceAvailable}
                        onReady={join}
                        onTypeInstead={() => join(null)}
                        resuming={resuming}
                        waiting={!ready}
                        waitingLabel={`${view.interviewer.name} is preparing your questions`}
                    />
                    {prepareError && (
                        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm sm:flex-row sm:items-center">
                            <p className="flex-1 text-amber-100">{prepareError}</p>
                            <Button size="sm" onClick={prepare}>
                                Try again
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ---- The call -----------------------------------------------------------

    const listening = answer.status === "listening" || answer.status === "wrapping";
    const wrapping = answer.status === "wrapping";
    const tileState = phase === "speaking" || phase === "closing" ? (phase === "closing" && !caption ? "thinking" : "speaking") : phase === "thinking" || answer.status === "transcribing" ? "thinking" : listening ? "listening" : "idle";
    const yourWords = `${answer.text} ${answer.interim}`.trim();
    const captionLine =
        phase === "speaking" || phase === "closing"
            ? { who: view.interviewer.name, text: caption }
            : listening && yourWords
              ? { who: "You", text: yourWords.length > 160 ? `…${yourWords.slice(-160)}` : yourWords }
              : phase === "answering" && caption
                ? { who: view.interviewer.name, text: caption }
                : null;

    const hint =
        phase === "closing"
            ? `${view.interviewer.name} is wrapping up and writing your feedback`
            : phase === "speaking"
              ? `${view.interviewer.name} is speaking`
              : phase === "thinking"
                ? answer.status === "transcribing"
                    ? "Catching your answer"
                    : `${view.interviewer.name} is thinking`
                : wrapping
                  ? "Sounds like you're done. Keep talking to carry on."
                  : listening
                    ? yourWords
                        ? "Listening"
                        : "Your turn. Take a moment, then answer out loud."
                    : mode === "typed"
                      ? "Your turn. Type your answer below."
                      : answer.status === "transcribing"
                        ? "Catching your answer"
                        : null;

    const busy = phase === "thinking" || phase === "closing";

    return (
        <div className="mx-auto max-w-5xl pt-2 pb-56 sm:pb-16">
            <div className="mb-3 flex items-center gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium">
                    <span className="size-2 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />
                    {clock(now - (startedAt ?? now))}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{view.role} interview</span>
                {step.type === "question" && (
                    <span className="shrink-0 text-muted-foreground">
                        Question {step.number}/{step.total}
                        {step.kind === "follow-up" && <span className="ml-2 rounded-full bg-[#9EFF00]/10 px-2 py-0.5 text-xs text-[#C9F300]">Follow-up</span>}
                    </span>
                )}
            </div>

            <InterviewerTile interviewer={view.interviewer} state={tileState} level={speakLevel}>
                <SelfTile
                    candidate={view.candidate}
                    listening={listening}
                    level={answer.level}
                    micOn={mode !== "typed" && Boolean(stream)}
                    wrapProgress={wrapping ? 1 - answer.wrapLeft / answer.wrapTotal : 0}
                />
                {captions && captionLine?.text && (
                    <div className="absolute inset-x-3 bottom-14 flex justify-center sm:bottom-16" aria-live="polite">
                        <p className="max-w-2xl rounded-lg bg-black/75 px-4 py-2 text-center text-sm leading-relaxed backdrop-blur sm:text-base">
                            <span className="font-semibold text-[#C9F300]">{captionLine.who}: </span>
                            {captionLine.text}
                        </p>
                    </div>
                )}
            </InterviewerTile>

            <p className="mt-4 flex min-h-6 items-center justify-center gap-2 text-center text-sm text-muted-foreground" aria-live="polite">
                {(phase === "thinking" || answer.status === "transcribing" || phase === "closing") && <Loader2 className="size-4 animate-spin" />}
                {hint}
            </p>

            {problem && (
                <div role="alert" className="mx-auto mt-3 flex max-w-2xl flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm sm:flex-row sm:items-center">
                    <p className="flex-1 text-amber-100">{problem.message}</p>
                    <div className="flex gap-2">
                        {problem.retry ? (
                            <Button size="sm" onClick={() => submit(problem.retry)}>
                                Try again
                            </Button>
                        ) : (
                            mode !== "typed" && (
                                <Button size="sm" onClick={listenAgain}>
                                    <Mic /> Answer again
                                </Button>
                            )
                        )}
                        {mode !== "typed" && (
                            <Button size="sm" variant="outline" onClick={switchToTyping}>
                                <Keyboard /> Type it
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {!problem && answer.error && phase === "answering" && (
                <div role="alert" className="mx-auto mt-3 flex max-w-2xl flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center">
                    <p className="flex-1 text-red-200">{answer.error}</p>
                    {mode !== "typed" && (
                        <Button size="sm" onClick={listenAgain}>
                            <Mic /> Try again
                        </Button>
                    )}
                </div>
            )}

            {mode === "typed" && phase === "answering" && (
                <div className="mx-auto mt-4 max-w-2xl space-y-3">
                    <Textarea
                        aria-label="Your answer"
                        value={typed}
                        onChange={(event) => setTyped(event.target.value)}
                        maxLength={MAX_ANSWER_CHARS}
                        rows={5}
                        placeholder="Type your answer the way you'd say it."
                        className="min-h-32 text-base leading-relaxed"
                    />
                    <div className="flex justify-end gap-2">
                        {voiceAvailable && stream && (
                            <Button variant="ghost" onClick={switchToVoice}>
                                <Mic /> Answer by voice
                            </Button>
                        )}
                        <Button onClick={() => submit({ text: typed, inputMode: "typed" })} disabled={!typed.trim()}>
                            Send answer
                        </Button>
                    </div>
                </div>
            )}

            <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-[#121212]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                <div className="mx-auto flex max-w-xl items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn("size-12 rounded-full", captions && "border-[#9EFF00] text-[#C9F300]")}
                        onClick={toggleCaptions}
                        aria-pressed={captions}
                        aria-label={captions ? "Hide captions" : "Show captions"}
                    >
                        {captions ? <Captions /> : <CaptionsOff />}
                    </Button>
                    <Button variant="outline" size="icon" className="size-12 rounded-full" onClick={repeat} disabled={busy || phase === "speaking"} aria-label="Ask the question again">
                        <Repeat2 />
                    </Button>

                    {wrapping ? (
                        <Button className="h-12 flex-1 rounded-full sm:flex-none sm:px-6" variant="secondary" onClick={answer.hold}>
                            <Hand /> I&apos;m not done
                        </Button>
                    ) : listening ? (
                        <Button className="h-12 flex-1 rounded-full sm:flex-none sm:px-6" onClick={answer.stop}>
                            <Check /> Done
                        </Button>
                    ) : mode !== "typed" && phase === "answering" && answer.status === "idle" && !problem && !answer.error ? (
                        <Button className="h-12 flex-1 rounded-full sm:flex-none sm:px-6" onClick={listenAgain}>
                            <Mic /> Answer
                        </Button>
                    ) : (
                        <span className="flex-1 sm:hidden" />
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="size-12 rounded-full" aria-label="More options" disabled={busy}>
                                <Ellipsis />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="top" className="w-56">
                            <DropdownMenuItem onSelect={skip} disabled={phase !== "answering"}>
                                <SkipForward /> Skip this question
                            </DropdownMenuItem>
                            {mode === "typed" ? (
                                voiceAvailable &&
                                stream && (
                                    <DropdownMenuItem onSelect={switchToVoice}>
                                        <Mic /> Answer by voice
                                    </DropdownMenuItem>
                                )
                            ) : (
                                <DropdownMenuItem onSelect={switchToTyping}>
                                    <Keyboard /> Type my answers
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={toggleVoice}>
                                {voiceOn ? <VolumeX /> : <Volume2 />} {voiceOn ? `Mute ${view.interviewer.name}` : `Unmute ${view.interviewer.name}`}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" className="size-12 rounded-full bg-red-600 text-white hover:bg-red-500" aria-label="End interview" disabled={phase === "closing"}>
                                <PhoneOff />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>End the interview now?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You&apos;ll get feedback on the {view.answered} {view.answered === 1 ? "answer" : "answers"} you&apos;ve given. Questions you haven&apos;t reached
                                    won&apos;t count against you.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep going</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        cancelListening();
                                        finish();
                                    }}
                                >
                                    End and get feedback
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
};

export default InterviewSession;
