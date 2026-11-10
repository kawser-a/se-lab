"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLevelMeter, createRecognizer, createRecorder, RECOGNITION_ERRORS } from "@/lib/interview/speech";

// Turn-taking, tuned to feel like talking to a person:
// - before they've said anything, silence never ends the turn (thinking time)
// - once they've spoken, a pause of PAUSE_MS starts a short wrap-up
//   countdown of WRAP_MS, and speaking again cancels it
const PAUSE_MS = 2200;
const WRAP_MS = 2500;
const MAX_ANSWER_MS = 3 * 60 * 1000;
const SPEAKING_LEVEL = 0.12;

// Captures one spoken answer.
//   mode "browser": the browser transcribes live (Chrome, Edge, Safari)
//   mode "record":  record, then transcribe with Whisper on the server
// When the answer ends, `onDone({ text, durationMs })` is called.
export function useAnswer({ mode, stream, context, onModeFailed, onDone }) {
    const [status, setStatus] = useState("idle"); // idle | listening | wrapping | transcribing
    const [text, setText] = useState("");
    const [interim, setInterim] = useState("");
    const [level, setLevel] = useState(0);
    const [error, setError] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const [wrapLeft, setWrapLeft] = useState(0);

    const session = useRef(null);
    const doneRef = useRef(onDone);
    doneRef.current = onDone;

    useEffect(() => {
        if (!stream) return;
        return createLevelMeter(stream, (value) => {
            setLevel(value);
            const current = session.current;
            if (current && value > SPEAKING_LEVEL) {
                const now = Date.now();
                current.firstSpeech ??= now;
                current.lastSpeech = now;
                current.heardSound = true;
            }
        });
    }, [stream]);

    const finish = useCallback(
        async (reason) => {
            const current = session.current;
            if (!current || current.stopping) return;
            current.stopping = true;
            clearInterval(current.timer);
            setWrapLeft(0);

            // Time from first word to last, so pauses at either end don't skew pace.
            const durationMs = current.firstSpeech ? Math.max(0, current.lastSpeech - current.firstSpeech) : 0;

            if (current.kind === "browser") {
                const final = await current.recognizer.stop();
                session.current = null;
                setInterim("");
                setText(final);
                setStatus("idle");

                // The microphone heard speech but recognition returned nothing.
                // Some browsers fail silently like this; switch rather than
                // let it happen on every answer.
                if (!final && current.heardSound && reason !== "cancel") {
                    const next = onModeFailed?.("no-result");
                    if (next === "typed") setError("Your browser's speech recognition isn't working here. Please type your answer.");
                }
                doneRef.current?.({ text: final, durationMs, reason });
                return;
            }

            setStatus("transcribing");
            const audio = await current.recorder.stop();
            session.current = null;

            let transcript = "";
            try {
                const form = new FormData();
                form.append("audio", audio, `answer.${audio.type.includes("mp4") ? "m4a" : "webm"}`);
                if (context) form.append("context", context);
                const response = await fetch("/api/interview/transcribe", { method: "POST", body: form });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.error ?? "Couldn't transcribe that recording.");
                transcript = result.text ?? "";
            } catch (err) {
                setError(err.message);
                setStatus("idle");
                doneRef.current?.({ text: "", durationMs, reason: "error" });
                return;
            }
            setText(transcript);
            setStatus("idle");
            doneRef.current?.({ text: transcript, durationMs, reason });
        },
        [context, onModeFailed]
    );

    const start = useCallback(() => {
        setError(null);
        setText("");
        setInterim("");
        setElapsed(0);
        setWrapLeft(0);

        const current = { kind: mode, startedAt: Date.now(), firstSpeech: null, lastSpeech: null, stopping: false };

        if (mode === "browser") {
            current.recognizer = createRecognizer({
                onText: ({ final, interim: partial }) => {
                    const now = Date.now();
                    current.firstSpeech ??= now;
                    current.lastSpeech = now;
                    setText(final);
                    setInterim(partial);
                },
                onError: (code) => {
                    clearInterval(current.timer);
                    session.current = null;
                    setStatus("idle");
                    const fallback = code === "network" || code === "service-not-allowed" ? onModeFailed?.(code) : null;
                    if (fallback === "record") return doneRef.current?.({ text: "", durationMs: 0, reason: "switched" });
                    setError(
                        fallback === "typed"
                            ? "Speech recognition isn't available in this browser right now. Please type your answer."
                            : RECOGNITION_ERRORS[code] ?? "Speech recognition stopped unexpectedly. Try again, or type your answer."
                    );
                },
            });
            current.recognizer.start();
        } else {
            current.recorder = createRecorder(stream);
            current.recorder.start();
        }

        current.timer = setInterval(() => {
            const now = Date.now();
            setElapsed(now - current.startedAt);

            if (now - current.startedAt > MAX_ANSWER_MS) return finish("limit");
            if (!current.lastSpeech) return;

            const quiet = now - current.lastSpeech;
            if (current.holdUntil && now < current.holdUntil) {
                setStatus("listening");
                setWrapLeft(0);
            } else if (quiet > PAUSE_MS + WRAP_MS) {
                finish("silence");
            } else if (quiet > PAUSE_MS) {
                setStatus("wrapping");
                setWrapLeft(Math.max(0, PAUSE_MS + WRAP_MS - quiet));
            } else {
                setStatus("listening");
                setWrapLeft(0);
            }
        }, 150);

        session.current = current;
        setStatus("listening");
    }, [mode, stream, finish, onModeFailed]);

    // "I'm not done": give them another stretch before wrapping up again.
    const hold = useCallback(() => {
        const current = session.current;
        if (!current) return;
        current.holdUntil = Date.now() + 8000;
        current.lastSpeech = Date.now();
        setStatus("listening");
        setWrapLeft(0);
    }, []);

    const stop = useCallback(() => finish("manual"), [finish]);

    const cancel = useCallback(() => {
        const current = session.current;
        if (current) {
            current.stopping = true;
            clearInterval(current.timer);
            current.recognizer?.abort();
            current.recorder?.abort();
        }
        session.current = null;
        setStatus("idle");
        setInterim("");
        setWrapLeft(0);
    }, []);

    useEffect(() => cancel, [cancel]);

    return {
        status,
        text,
        setText,
        interim,
        level,
        error,
        setError,
        elapsed,
        wrapLeft,
        wrapTotal: WRAP_MS,
        start,
        stop,
        hold,
        cancel,
    };
}
