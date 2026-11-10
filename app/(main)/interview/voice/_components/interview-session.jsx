"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
    Captions,
    CaptionsOff,
    ChevronLeft,
    Ellipsis,
    Keyboard,
    Loader2,
    LogOut,
    MessageSquareText,
    Mic,
    Pause,
    PhoneOff,
    Play,
    Repeat2,
    RotateCcw,
    SkipForward,
    Square,
    Volume2,
    VolumeX,
} from "lucide-react";
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
import StagedProgress from "@/components/staged-progress";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { INTERVIEW_TYPES, LEVELS, MAX_ANSWER_CHARS, minutesFor } from "@/lib/interview/config";
import { BACKCHANNELS, HOLD_LINE, NOT_CAUGHT } from "@/lib/interview/script";
import { canRecord, createSpeaker, getRecognitionClass, microphoneBlockedByConnection, preferredVoiceMode } from "@/lib/interview/speech";
import { cn } from "@/lib/utils";
import { InterviewerTile, SelfTile } from "./call-tiles";
import JoinControls from "./join-controls";
import { useAnswer } from "./use-answer";

const CAPTIONS_KEY = "growthgrid:interview-captions";
const TRANSCRIPT_KEY = "growthgrid:interview-transcript";

function readSetting(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value == null ? fallback : value === "1";
    } catch {
        return fallback;
    }
}

function saveSetting(key, value) {
    try {
        localStorage.setItem(key, value ? "1" : "0");
    } catch {}
}

function clock(ms) {
    const seconds = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// How each kind of line is delivered by the natural voice.
const warm = (text) => text && { text, style: "warm" };
const friendly = (text) => text && { text, style: "friendly" };

// After this many answers in a row come back empty, stop asking again and
// suggest typing instead.
const MAX_MISSES = 2;
// If the reply takes longer than this, the interviewer says so rather than
// leaving a silence.
const HOLD_AFTER_MS = 4000;

// The conversation so far, rebuilt from the saved turns when rejoining.
function logFromTurns(turns, interviewer) {
    return turns.flatMap((turn, index) => [
        { id: `q${index}`, who: "interviewer", name: interviewer.name, text: turn.prompt },
        { id: `a${index}`, who: "you", text: turn.skipped ? "Skipped" : turn.answer, muted: turn.skipped },
    ]);
}

function Subtitle({ line }) {
    if (!line) return null;
    return (
        <div className="pointer-events-none absolute inset-x-3 bottom-16 flex justify-center sm:inset-x-8 sm:bottom-20" aria-hidden="true">
            <AnimatePresence mode="wait">
                <motion.p
                    key={line.key}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="max-w-3xl rounded-xl bg-black/80 px-4 py-2.5 text-center text-base leading-relaxed shadow-lg backdrop-blur sm:px-5 sm:text-xl sm:leading-relaxed"
                >
                    <span className={cn("mr-2 text-sm font-semibold sm:text-base", line.who === "you" ? "text-sky-300" : "text-[#C9F300]")}>{line.name}</span>
                    {line.dots ? (
                        <span className="inline-flex gap-1 align-middle">
                            {[0, 1, 2].map((dot) => (
                                <span key={dot} className="size-1.5 rounded-full bg-white/70 motion-safe:animate-bounce" style={{ animationDelay: `${dot * 150}ms` }} />
                            ))}
                        </span>
                    ) : (
                        <>
                            {line.text}
                            {line.interim && <span className="text-white/60"> {line.interim}</span>}
                        </>
                    )}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}

function TypingDots() {
    return (
        <span className="inline-flex gap-1 align-middle" aria-label="Speaking">
            {[0, 1, 2].map((dot) => (
                <span key={dot} className="size-1.5 rounded-full bg-white/60 motion-safe:animate-bounce" style={{ animationDelay: `${dot * 150}ms` }} />
            ))}
        </span>
    );
}

function TranscriptPanel({ log, live, className }) {
    const list = useRef(null);
    const following = useRef(true);

    // Keep the newest words in view, unless they've scrolled up to reread
    // something, in which case leave the scroll where they put it.
    useEffect(() => {
        const element = list.current;
        if (element && following.current) element.scrollTop = element.scrollHeight;
    }, [log, live?.text, live?.interim]);

    const onScroll = () => {
        const element = list.current;
        following.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
    };

    return (
        <div className={cn("flex min-h-0 flex-col rounded-3xl border border-white/10 bg-card", className)}>
            <p className="border-b border-white/10 px-5 py-3 text-sm font-semibold">Transcript</p>
            <div ref={list} onScroll={onScroll} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm leading-relaxed">
                {log.length === 0 && !live && <p className="text-muted-foreground">The conversation will appear here as you talk.</p>}
                {log.map((entry) => (
                    <div key={entry.id} className={cn("space-y-1", entry.who === "you" && "pl-6")}>
                        <p className={cn("text-xs font-semibold", entry.who === "you" ? "text-sky-300" : "text-[#C9F300]")}>{entry.who === "you" ? "You" : entry.name}</p>
                        <p className={cn("rounded-2xl px-3 py-2", entry.who === "you" ? "bg-white/[0.06]" : "bg-[#9EFF00]/[0.06]", entry.muted && "italic text-muted-foreground")}>
                            {entry.text || (entry.live ? <TypingDots /> : null)}
                            {entry.live && entry.text && <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-[#C9F300] motion-safe:animate-pulse" aria-hidden="true" />}
                        </p>
                    </div>
                ))}
                {live && (
                    <div className="space-y-1 pl-6">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                            You <span className="size-1.5 rounded-full bg-sky-300 motion-safe:animate-pulse" />
                        </p>
                        <p className="rounded-2xl border border-dashed border-white/15 px-3 py-2">
                            {live.text}
                            {live.interim && <span className="text-white/50"> {live.interim}</span>}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// One line under the stage that always says whose turn it is and what
// happens next. It swaps with a short fade so changes are noticed but
// never jumpy.
function TurnStatus({ turn, name, level, wrapShare }) {
    const lines = {
        interviewer: { text: `${name} is speaking`, tone: "text-[#C9F300]" },
        replying: { text: `${name} is replying`, tone: "text-[#C9F300]", dots: true },
        yours: { text: "Your turn. Answer out loud when you're ready.", tone: "text-sky-300", mic: true },
        talking: { text: "Listening. Just pause when you've finished.", tone: "text-sky-300", mic: true },
        finishing: { text: "Finishing your answer. Keep talking to add more.", tone: "text-sky-300", bar: true },
        typing: { text: "Your turn. Type your answer below.", tone: "text-sky-300" },
        paused: { text: "Paused. Press Resume or Space when you're ready.", tone: "text-amber-300" },
    };
    const line = lines[turn];

    return (
        <div className="flex min-h-9 items-center justify-center" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
                {line && (
                    <motion.div
                        key={turn}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="relative flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm"
                    >
                        {line.mic && (
                            <span className="relative flex size-4 items-center justify-center" aria-hidden="true">
                                <span className="absolute inset-0 rounded-full bg-sky-300/30 transition-transform duration-100" style={{ transform: `scale(${1 + Math.min(level, 1) * 1.2})` }} />
                                <Mic className="relative size-3.5 text-sky-300" />
                            </span>
                        )}
                        {turn === "interviewer" && <span className="size-2 rounded-full bg-[#9EFF00] motion-safe:animate-pulse" aria-hidden="true" />}
                        <span className={line.tone}>{line.text}</span>
                        {line.dots && <TypingDots />}
                        {line.bar && (
                            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10" aria-hidden="true">
                                <span className="block h-full bg-sky-300 transition-[width] duration-150" style={{ width: `${Math.max(0, wrapShare) * 100}%` }} />
                            </span>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// A round call control with a short caption under it, so nobody has to
// guess what an icon means. Props (including a ref from a menu or dialog
// trigger) go to the button itself.
function ControlButton({ label, caption, active, danger, className, children, ref, ...props }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <button
                ref={ref}
                type="button"
                aria-label={label}
                title={label}
                className={cn(
                    "inline-flex size-12 items-center justify-center rounded-full border transition-all duration-200 [&_svg]:size-5",
                    "hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9EFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]",
                    danger
                        ? "border-red-500 bg-red-600 text-white shadow-[0_0_24px_-8px_#ef4444] hover:bg-red-500"
                        : active
                          ? "border-[#9EFF00]/60 bg-[#9EFF00]/10 text-[#C9F300] hover:bg-[#9EFF00]/15"
                          : "border-white/15 bg-white/[0.04] text-white hover:bg-white/10",
                    className
                )}
                {...props}
            >
                {children}
            </button>
            {caption && <span className={cn("hidden text-[11px] sm:block", danger ? "text-red-300" : "text-muted-foreground")}>{caption}</span>}
        </div>
    );
}

const InterviewSession = ({ initialView, capabilities }) => {
    const router = useRouter();
    const [view, setView] = useState(initialView);
    // lobby | speaking | answering | waiting | closing
    const [phase, setPhase] = useState("lobby");
    const [talking, setTalking] = useState(false);
    const [paused, setPaused] = useState(false);
    const [mode, setMode] = useState("typed");
    const [stream, setStream] = useState(null);
    const [captions, setCaptions] = useState(true);
    const [showTranscript, setShowTranscript] = useState(true);
    const [voiceOn, setVoiceOn] = useState(true);
    const [speakLevel, setSpeakLevel] = useState(0);
    const [caption, setCaption] = useState("");
    const [typed, setTyped] = useState("");
    const [problem, setProblem] = useState(null);
    const [autoListen, setAutoListen] = useState(true);
    const [log, setLog] = useState(() => logFromTurns(initialView.turns, initialView.interviewer));
    const [startedAt, setStartedAt] = useState(null);
    const [pausedFor, setPausedFor] = useState(0);
    const [now, setNow] = useState(0);
    const [voiceAvailable, setVoiceAvailable] = useState(true);
    const [insecure, setInsecure] = useState(false);

    const speaker = useRef(null);
    const viewRef = useRef(view);
    const voiceOnRef = useRef(true);
    const misses = useRef(0);
    const talkingCount = useRef(0);
    const pausedAt = useRef(null);
    const extrasLoaded = useRef(false);
    viewRef.current = view;

    // Only the browser knows what it supports, so check after the first render.
    useEffect(() => {
        setVoiceAvailable(!microphoneBlockedByConnection() && (Boolean(getRecognitionClass()) || (capabilities.serverTranscription && canRecord())));
        setInsecure(microphoneBlockedByConnection());
        setCaptions(readSetting(CAPTIONS_KEY, true));
        setShowTranscript(readSetting(TRANSCRIPT_KEY, true));
    }, [capabilities.serverTranscription]);

    useEffect(() => {
        if (!startedAt || paused) return;
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [startedAt, paused]);

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

    // Everything said before a question. `bridged` means a quick "okay" has
    // already been said, so only a reaction written for the answer is kept.
    const linesFor = useCallback((target, { opening, bridged } = {}) => {
        const firstQuestion = target.turnIndex === 0;
        // A greeting or "welcome back" replaces the usual reaction.
        const lead = opening && !firstQuestion ? null : bridged ? target.step.bridge : target.step.lead;
        return [warm(opening), friendly(lead), target.step.prompt];
    }, []);

    const ready = !view.preparing;
    useEffect(() => {
        if (!ready || phase !== "lobby") return;
        const current = viewRef.current;
        speaker.current?.prefetch(linesFor(current, { opening: current.turnIndex === 0 ? current.script.opening : current.script.resume }));
        speaker.current?.prefetch(friendly(BACKCHANNELS[0]));
    }, [ready, phase, linesFor]);

    // The rest of the short lines load once the call is under way, so the
    // voice service's per-minute allowance isn't spent all at once.
    const loadExtras = useCallback(() => {
        if (extrasLoaded.current) return;
        extrasLoaded.current = true;
        speaker.current?.prefetch([...BACKCHANNELS.slice(1), HOLD_LINE, NOT_CAUGHT].map(friendly));
    }, []);

    const addLog = useCallback((entry) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setLog((current) => [...current, { id, ...entry }]);
        return id;
    }, []);
    const updateLog = useCallback((id, patch) => setLog((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))), []);
    const removeLog = useCallback((id) => setLog((current) => current.filter((entry) => entry.id !== id)), []);

    // Returns the mode it switched to, so the message can say what happens next.
    const onModeFailed = useCallback(() => {
        const next = capabilities.serverTranscription && canRecord() && stream ? "record" : "typed";
        setMode(next);
        return next;
    }, [capabilities.serverTranscription, stream]);

    // Says each part in turn. The greeting, the reaction and the question
    // each get their own line in the transcript, filled in word by word as
    // they're spoken, and the subtitle follows the sentence being said.
    const say = useCallback(
        async (parts, { record = true } = {}) => {
            const list = []
                .concat(parts)
                .filter(Boolean)
                .map((part) => (typeof part === "string" ? { text: part } : part))
                .filter((part) => part.text);
            if (!list.length) return;

            talkingCount.current += 1;
            setTalking(true);
            try {
                for (const [index, part] of list.entries()) {
                    const id = record ? addLog({ who: "interviewer", name: viewRef.current.interviewer.name, text: "", live: true }) : null;

                    if (!voiceOnRef.current || !speaker.current) {
                        if (id) updateLog(id, { text: part.text, live: false });
                        setCaption(part.text);
                        continue;
                    }

                    if (list[index + 1]) speaker.current.prefetch(list[index + 1]);
                    setCaption("");
                    const finished = await speaker.current.speak(part, {
                        onProgress: (spoken, line) => {
                            if (id) updateLog(id, { text: spoken });
                            setCaption(line);
                        },
                    });
                    if (id) updateLog(id, finished ? { text: part.text, live: false } : { live: false });
                    if (!finished) break;
                }
            } finally {
                talkingCount.current -= 1;
                if (talkingCount.current === 0) setTalking(false);
            }
        },
        [addLog, updateLog]
    );

    const ask = useCallback(
        async (target, options) => {
            if (target.step.type !== "question") return;
            setProblem(null);
            setPhase("speaking");
            // Load the next question's audio while this one is asked and answered.
            if (target.upcoming) speaker.current?.prefetch(target.upcoming);
            await say(linesFor(target, options));
            setCaption(target.step.prompt);
            setPhase((current) => (current === "speaking" ? "answering" : current));
            loadExtras();
        },
        [say, linesFor, loadExtras]
    );

    const finish = useCallback(async () => {
        speaker.current?.cancel();
        setPaused(false);
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
        async ({ text = "", durationMs = 0, inputMode, skipped = false }, { acknowledge = false, ack = null } = {}) => {
            setPhase("waiting");
            setProblem(null);
            const current = viewRef.current;

            const request = submitVoiceAnswer(current.id, {
                turnIndex: current.turnIndex,
                answer: skipped ? "" : text.trim(),
                inputMode,
                durationMs: Math.round(durationMs),
                skipped,
            });

            // A quick "okay" straight away, like a person would, while the
            // reply is worked out. A long wait gets a word too.
            let settled = false;
            const spoken = [];
            if (acknowledge) spoken.push(ack ?? say(friendly(BACKCHANNELS[current.turnIndex % BACKCHANNELS.length]), { record: false }));
            const hold = setTimeout(() => {
                if (!settled) spoken.push(say(friendly(HOLD_LINE), { record: false }));
            }, HOLD_AFTER_MS);

            try {
                const result = await request;
                settled = true;
                clearTimeout(hold);

                if (result.error && !result.view) {
                    await Promise.all(spoken);
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
                // Start loading the reply while the "okay" is still playing.
                if (next.step.type === "question") speaker.current?.prefetch(linesFor(next, { bridged: acknowledge }));
                await Promise.all(spoken);

                if (next.status !== "IN_PROGRESS") {
                    router.push(`/interview/voice/${next.id}/feedback`);
                } else if (next.step.type === "complete") {
                    setPhase("speaking");
                    await say(warm(next.script.closing));
                    await finish();
                } else {
                    setAutoListen(true);
                    await ask(next, { bridged: acknowledge });
                }
            } catch {
                settled = true;
                clearTimeout(hold);
                // Probably offline. Sending again is safe: each answer carries its turn number.
                setProblem({ message: "Couldn't send your answer. Check your connection and try again.", retry: { text, durationMs, inputMode, skipped } });
                setPhase("answering");
                setAutoListen(false);
            }
        },
        [ask, finish, linesFor, router, say]
    );

    // The moment an answer is judged finished: the interviewer says "okay"
    // right away and the answer moves into the transcript, while the last
    // words are confirmed and the reply is worked out.
    const answerRef = useRef(null);
    const ending = useRef(null);
    const onAnswerEnding = useCallback(() => {
        setPhase("waiting");
        const live = answerRef.current;
        const words = `${live?.text ?? ""} ${live?.interim ?? ""}`.trim();
        const logId = words ? addLog({ who: "you", text: words }) : null;
        const ack = say(friendly(BACKCHANNELS[viewRef.current.turnIndex % BACKCHANNELS.length]), { record: false });
        ending.current = { ack, logId };
    }, [addLog, say]);

    const onAnswerDone = useCallback(
        async ({ text, durationMs, reason }) => {
            const early = ending.current;
            ending.current = null;
            if (reason === "switched" || reason === "error") {
                if (early?.logId) removeLog(early.logId);
                return;
            }

            if (!text.trim()) {
                if (early?.logId) removeLog(early.logId);
                await early?.ack;
                misses.current += 1;
                if (misses.current >= MAX_MISSES) {
                    setPhase("answering");
                    setAutoListen(false);
                    setProblem({ message: "I'm having trouble hearing you. Check your microphone, or type your answer instead." });
                    return;
                }
                setPhase("speaking");
                await say(friendly(NOT_CAUGHT));
                setPhase("answering");
                return;
            }

            if (early?.logId) updateLog(early.logId, { text: text.trim() });
            else addLog({ who: "you", text: text.trim() });
            await submit({ text, durationMs, inputMode: "voice" }, { acknowledge: true, ack: early?.ack });
        },
        [addLog, updateLog, removeLog, say, submit]
    );

    const step = view.step;
    const answer = useAnswer({
        mode,
        stream,
        context: step.type === "question" ? `Job interview for a ${view.role} role. Question: ${step.prompt}` : undefined,
        onModeFailed,
        onEnding: onAnswerEnding,
        onDone: onAnswerDone,
    });
    answerRef.current = answer;
    const { start: startListening, cancel: cancelListening } = answer;

    // The candidate's turn starts as soon as the interviewer stops talking.
    useEffect(() => {
        if (phase === "answering" && !paused && mode !== "typed" && autoListen && answer.status === "idle" && !answer.error) {
            startListening();
        }
    }, [phase, paused, mode, autoListen, answer.status, answer.error, startListening]);

    useEffect(() => {
        const busy = phase !== "lobby" && phase !== "closing";
        if (!busy) return;
        const warn = (event) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [phase]);

    const join = (micStream) => {
        // Called from the click on "Join", which is what lets audio play.
        speaker.current?.unlock();

        if (micStream) {
            setStream(micStream);
            setMode(preferredVoiceMode(capabilities));
        } else {
            setMode("typed");
        }
        setStartedAt(Date.now());
        window.scrollTo({ top: 0, behavior: "smooth" });
        ask(view, { opening: view.turnIndex === 0 ? view.script.opening : view.script.resume });
    };

    const togglePause = useCallback(() => {
        if (phase === "lobby" || phase === "closing") return;
        if (paused) {
            speaker.current?.resume();
            answer.resume();
            setPausedFor((total) => total + (Date.now() - (pausedAt.current ?? Date.now())));
            setPaused(false);
        } else {
            pausedAt.current = Date.now();
            speaker.current?.pause();
            answer.pause();
            setPaused(true);
        }
    }, [phase, paused, answer]);

    // Space pauses and resumes, unless they're typing or on a button.
    useEffect(() => {
        const onKey = (event) => {
            if (event.code !== "Space" || event.repeat) return;
            const target = event.target;
            if (target instanceof HTMLElement && target.closest("input, textarea, button, [role=menuitem], [contenteditable]")) return;
            event.preventDefault();
            togglePause();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [togglePause]);

    const toggleCaptions = () => {
        setCaptions(!captions);
        saveSetting(CAPTIONS_KEY, !captions);
    };

    const toggleTranscript = () => {
        setShowTranscript(!showTranscript);
        saveSetting(TRANSCRIPT_KEY, !showTranscript);
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
        await say(step.prompt, { record: false });
        setAutoListen(true);
        setPhase("answering");
    };

    const skip = () => {
        cancelListening();
        speaker.current?.cancel();
        addLog({ who: "you", text: "Skipped", muted: true });
        submit({ inputMode: mode === "typed" ? "typed" : "voice", skipped: true });
    };

    const sendTyped = () => {
        addLog({ who: "you", text: typed.trim() });
        submit({ text: typed, inputMode: "typed" });
    };

    const switchToTyping = () => {
        cancelListening();
        setMode("typed");
        setProblem(null);
    };

    const switchToVoice = () => {
        setMode(preferredVoiceMode(capabilities));
        setProblem(null);
        setAutoListen(true);
    };

    const listenAgain = () => {
        misses.current = 0;
        setProblem(null);
        answer.setError(null);
        setAutoListen(true);
    };

    // Throws away what's been said so far for this answer and listens again.
    const restartAnswer = () => {
        cancelListening();
        setAutoListen(true);
        toast("Starting your answer again.");
    };

    // Everything up to the last answer is already saved, so leaving is safe.
    const saveAndLeave = () => {
        cancelListening();
        speaker.current?.cancel();
        toast("Progress saved. Pick it up any time from Interview Preparation.");
        router.push("/interview");
    };

    // ---- What's on screen ---------------------------------------------------

    const inCall = phase !== "lobby";
    // Once an answer is judged finished it's the interviewer's turn, even in
    // the moment it takes the browser to confirm the last words.
    const listening = phase !== "waiting" && (answer.status === "listening" || answer.status === "wrapping" || answer.status === "paused");
    const wrapping = answer.status === "wrapping";
    const yourWords = { text: answer.text, interim: answer.interim };
    const saying = talking && voiceOn;

    const tileState = paused ? "paused" : saying ? "speaking" : listening ? "listening" : "idle";

    let subtitle = null;
    if (inCall && phase !== "closing") {
        if (saying) {
            subtitle = caption ? { key: "interviewer", who: "interviewer", name: view.interviewer.name, text: caption } : { key: "dots", who: "interviewer", name: view.interviewer.name, dots: true };
        } else if (listening && (yourWords.text || yourWords.interim)) {
            // Keep the end of a long answer on screen, the way TV captions roll on.
            const full = `${yourWords.text} ${yourWords.interim}`.trim();
            subtitle =
                full.length > 180
                    ? { key: "you", who: "you", name: "You", text: `…${full.slice(-180)}` }
                    : { key: "you", who: "you", name: "You", text: yourWords.text, interim: yourWords.interim };
        } else if (phase === "waiting" || answer.status === "transcribing") {
            subtitle = { key: "dots", who: "interviewer", name: view.interviewer.name, dots: true };
        } else if (phase === "answering" && caption) {
            // The question stays up while they answer, so it doesn't have to be remembered.
            subtitle = { key: "question", who: "interviewer", name: view.interviewer.name, text: caption };
        }
    }

    // Whose turn it is, worked out in one place so the status line, the
    // tiles and the controls always agree.
    let turn = null;
    if (paused) turn = "paused";
    else if (phase === "closing") turn = null;
    else if (saying) turn = "interviewer";
    else if (phase === "waiting" || answer.status === "transcribing") turn = "replying";
    else if (phase === "answering" && mode === "typed") turn = "typing";
    else if (wrapping) turn = "finishing";
    else if (listening) turn = yourWords.text || yourWords.interim ? "talking" : "yours";

    const busy = phase === "waiting" || phase === "closing";
    const elapsed = startedAt ? now - startedAt - pausedFor - (paused && pausedAt.current ? now - pausedAt.current : 0) : 0;
    const resuming = view.turnIndex > 0;
    const doneCount = step.type === "question" ? step.number - 1 : view.total;

    const liveWords = listening && (yourWords.text || yourWords.interim) ? yourWords : null;
    // In the lobby both columns share one height; in the call the stage
    // leaves room for the controls underneath.
    const lobbyHeight = "lg:h-[min(640px,calc(100dvh-17rem))] lg:min-h-[500px]";
    const callHeight = "sm:h-[calc(100dvh-24rem)] sm:max-h-[640px] sm:min-h-[360px]";

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-4 pt-2 pb-28 sm:pb-6">
            {/* Top bar */}
            <div className="flex min-h-9 items-center gap-3 text-sm">
                {inCall ? (
                    <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-medium tabular-nums" aria-label="Time in interview">
                        <span className={cn("size-2 rounded-full", paused ? "bg-amber-400" : "bg-red-500 motion-safe:animate-pulse")} aria-hidden="true" />
                        {clock(elapsed)}
                    </span>
                ) : (
                    <Link href="/interview" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-white">
                        <ChevronLeft className="size-4" /> Interview Preparation
                    </Link>
                )}
                <span className={cn("min-w-0 flex-1 truncate font-medium", !inCall && "hidden sm:block")}>{inCall && `${view.role} interview`}</span>
                {ready && inCall && (
                    <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
                        <span className="hidden sm:inline">
                            {step.type === "question" ? `Question ${step.number} of ${step.total}` : `${view.total} questions`}
                            {step.kind === "follow-up" && <span className="ml-2 rounded-full bg-[#9EFF00]/10 px-2 py-0.5 text-xs text-[#C9F300]">Follow-up</span>}
                        </span>
                        <span className="flex gap-1" aria-hidden="true">
                            {Array.from({ length: view.total }, (_, index) => (
                                <span
                                    key={index}
                                    className={cn(
                                        "h-1.5 w-4 rounded-full transition-colors duration-500 sm:w-6",
                                        index < doneCount ? "bg-[#9EFF00]" : index === doneCount ? "bg-[#9EFF00]/50" : "bg-white/15"
                                    )}
                                />
                            ))}
                        </span>
                    </span>
                )}
            </div>

            <div className={cn("grid gap-4", inCall ? (showTranscript ? "lg:grid-cols-[minmax(0,1fr)_340px]" : "lg:grid-cols-1") : "lg:grid-cols-[minmax(0,1fr)_400px]")}>
                {/* Stage */}
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 260, damping: 32 }}
                    className={cn(
                        "relative",
                        inCall ? cn("h-[52dvh] min-h-[340px]", callHeight) : cn("h-40 sm:h-[44dvh]", lobbyHeight),
                        inCall && mode === "typed" && phase === "answering" && "sm:h-[calc(100dvh-34rem)] sm:min-h-[260px]"
                    )}
                >
                    <InterviewerTile interviewer={view.interviewer} state={inCall ? tileState : "idle"} level={speakLevel} listenLevel={answer.level} raised={inCall}>
                        {inCall && (
                            <SelfTile
                                candidate={view.candidate}
                                listening={listening && !paused}
                                level={answer.level}
                                micOn={mode !== "typed" && Boolean(stream)}
                                wrapProgress={wrapping ? 1 - answer.wrapLeft / answer.wrapTotal : 0}
                            />
                        )}
                        {/* With the transcript open on a wide screen, the words show there
                            instead, so they're never shown twice. */}
                        {!paused && (captions || !showTranscript) && (
                            <div className={cn(showTranscript && "lg:hidden", !captions && "max-lg:hidden")}>
                                <Subtitle line={subtitle} />
                            </div>
                        )}

                        <AnimatePresence>
                            {paused && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm"
                                >
                                    <p className="text-lg font-semibold">Interview paused</p>
                                    <p className="max-w-xs text-center text-sm text-muted-foreground">Take your time. Everything you&apos;ve said so far is kept.</p>
                                    <Button onClick={togglePause} className="h-11 rounded-full bg-[#9EFF00] px-6 text-black transition-transform hover:scale-[1.03] hover:bg-[#b4ff33] active:scale-95">
                                        <Play /> Resume
                                    </Button>
                                </motion.div>
                            )}
                            {phase === "closing" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm"
                                >
                                    <StagedProgress
                                        title="Putting your feedback together"
                                        steps={["Reading your answers", "Rating understanding, depth and communication", "Writing tips for each question"]}
                                        expectedMs={7000}
                                        className="px-6"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </InterviewerTile>
                </motion.div>

                {/* Side panel: joining in the lobby, the transcript during the call */}
                <AnimatePresence mode="popLayout" initial={false}>
                    {!inCall ? (
                        <motion.aside
                            key="join"
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 24 }}
                            transition={{ duration: 0.25 }}
                            className={cn("flex flex-col gap-5 rounded-3xl border border-white/10 bg-card p-6 sm:p-7 lg:overflow-y-auto", lobbyHeight)}
                        >
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-1.5 text-xs">
                                    {[INTERVIEW_TYPES[view.type]?.label, LEVELS[view.level]?.label, `${view.total} questions`, `About ${minutesFor(view.total)} min`].map((tag) => (
                                        <span key={tag} className="rounded-full border border-white/10 px-2.5 py-1 text-muted-foreground">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h1 className="text-2xl font-bold sm:text-3xl">{resuming ? "Ready to pick up again?" : "Ready to join?"}</h1>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {resuming
                                        ? `${view.role} with ${view.interviewer.name}. You've answered ${view.answered} of ${view.total} questions so far.`
                                        : `${view.role} with ${view.interviewer.name}. Answer out loud, like on a real call. When you stop talking for a few seconds, ${view.interviewer.pronoun ?? "they"}'ll take that as your answer.`}
                                </p>
                            </div>

                            <JoinControls voiceAvailable={voiceAvailable} insecure={insecure} ready={ready} prepareError={prepareError} onRetryPrepare={prepare} resuming={resuming} onJoin={join} />
                        </motion.aside>
                    ) : (
                        showTranscript && (
                            <motion.div
                                key="transcript"
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 24 }}
                                transition={{ duration: 0.25, delay: 0.1 }}
                                className="hidden lg:block lg:h-[calc(100dvh-24rem)] lg:max-h-[640px] lg:min-h-[360px]"
                            >
                                <TranscriptPanel log={log} live={liveWords} className="h-full" />
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {inCall && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="space-y-3">
                        <TurnStatus turn={turn} name={view.interviewer.name} level={answer.level} wrapShare={wrapping ? answer.wrapLeft / answer.wrapTotal : 0} />

                        {problem && (
                            <div role="alert" className="mx-auto flex max-w-2xl flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm sm:flex-row sm:items-center">
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
                            <div role="alert" className="mx-auto flex max-w-2xl flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center">
                                <p className="flex-1 text-red-200">{answer.error}</p>
                                {mode !== "typed" && (
                                    <Button size="sm" onClick={listenAgain}>
                                        <Mic /> Try again
                                    </Button>
                                )}
                            </div>
                        )}

                        {mode === "typed" && phase === "answering" && !paused && (
                            <div className="mx-auto max-w-3xl space-y-3">
                                <Textarea
                                    aria-label="Your answer"
                                    value={typed}
                                    onChange={(event) => setTyped(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && typed.trim()) sendTyped();
                                    }}
                                    maxLength={MAX_ANSWER_CHARS}
                                    rows={4}
                                    placeholder="Type your answer the way you'd say it."
                                    className="min-h-28 text-base leading-relaxed"
                                />
                                <div className="flex items-center justify-between gap-2">
                                    <span className="hidden text-xs text-muted-foreground sm:block">Ctrl + Enter to send</span>
                                    <div className="ml-auto flex gap-2">
                                        {voiceAvailable && stream && (
                                            <Button variant="ghost" onClick={switchToVoice}>
                                                <Mic /> Answer by voice
                                            </Button>
                                        )}
                                        <Button onClick={sendTyped} disabled={!typed.trim()}>
                                            Send answer
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#121212]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                            <div className="mx-auto flex max-w-xl items-start justify-center gap-3 sm:gap-4">
                                <div className={cn(showTranscript && "lg:hidden")}>
                                    <ControlButton label={captions ? "Hide subtitles" : "Show subtitles"} caption="Subtitles" active={captions} aria-pressed={captions} onClick={toggleCaptions}>
                                        {captions ? <Captions /> : <CaptionsOff />}
                                    </ControlButton>
                                </div>
                                <div className="hidden lg:block">
                                    <ControlButton
                                        label={showTranscript ? "Hide transcript" : "Show transcript"}
                                        caption="Transcript"
                                        active={showTranscript}
                                        aria-pressed={showTranscript}
                                        onClick={toggleTranscript}
                                    >
                                        <MessageSquareText />
                                    </ControlButton>
                                </div>

                                <div className="flex flex-col items-center gap-1.5">
                                    <Button
                                        onClick={togglePause}
                                        disabled={phase === "closing"}
                                        aria-label={paused ? "Resume interview" : "Pause interview"}
                                        title={paused ? "Resume (Space)" : "Pause (Space)"}
                                        className={cn(
                                            "h-12 min-w-32 rounded-full px-6 font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 sm:min-w-36",
                                            paused ? "bg-[#9EFF00] text-black hover:bg-[#b4ff33]" : "bg-white text-black hover:bg-white/90"
                                        )}
                                    >
                                        {paused ? <Play /> : <Pause />}
                                        {paused ? "Resume" : "Pause"}
                                    </Button>
                                    <span className="hidden text-[11px] text-muted-foreground sm:block">
                                        or press <kbd className="rounded border border-white/15 px-1 font-sans">Space</kbd>
                                    </span>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <ControlButton label="More options" caption="More" disabled={busy}>
                                            <Ellipsis />
                                        </ControlButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" side="top" className="w-64">
                                        <DropdownMenuItem onSelect={answer.stop} disabled={!listening || paused}>
                                            <Square /> I&apos;m done answering
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={restartAnswer} disabled={!listening || paused}>
                                            <RotateCcw /> Start my answer again
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={repeat} disabled={phase !== "answering" || paused}>
                                            <Repeat2 /> Repeat the question
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={skip} disabled={phase !== "answering"}>
                                            <SkipForward /> Skip this question
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
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
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={saveAndLeave}>
                                            <LogOut /> Save and finish later
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <ControlButton label="End interview" caption="End" danger disabled={phase === "closing"}>
                                            <PhoneOff />
                                        </ControlButton>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>End the interview and get feedback?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                You&apos;ll get feedback on the {view.answered} {view.answered === 1 ? "answer" : "answers"} you&apos;ve given. Questions you haven&apos;t
                                                reached won&apos;t count against you. If you&apos;d rather come back to it, use <strong>Save and finish later</strong> in the
                                                More menu instead.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Keep going</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-red-600 text-white hover:bg-red-500"
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InterviewSession;
