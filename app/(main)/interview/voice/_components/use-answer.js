"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLevelMeter, createRecognizer, createRecorder, RECOGNITION_ERRORS } from "@/lib/interview/speech";

// Stop listening this long after the candidate goes quiet. Long enough for a
// thinking pause mid-answer, short enough not to feel stuck.
const SILENCE_MS = 4000;
const MAX_ANSWER_MS = 3 * 60 * 1000;
const SPEAKING_LEVEL = 0.12;

// Captures one spoken answer.
//   mode "browser": the browser transcribes live (Chrome, Edge, Safari)
//   mode "record":  record, then transcribe with Whisper on the server
// Either way the result lands in `text` for the candidate to check before
// it's submitted.
export function useAnswer({ mode, stream, context, onModeFailed }) {
    const [status, setStatus] = useState("idle"); // idle | listening | transcribing | review
    const [text, setText] = useState("");
    const [interim, setInterim] = useState("");
    const [level, setLevel] = useState(0);
    const [error, setError] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const [durationMs, setDurationMs] = useState(0);

    const session = useRef(null);

    // The level meter runs whenever there's a microphone.
    useEffect(() => {
        if (!stream) return;
        return createLevelMeter(stream, (value) => {
            setLevel(value);
            const current = session.current;
            if (current && value > SPEAKING_LEVEL) {
                current.lastSpeech = Date.now();
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

            // Leave out the silent wait at the end when it stopped on its own.
            setDurationMs(Math.max(0, Date.now() - current.startedAt - (reason === "silence" ? SILENCE_MS : 0)));

            if (current.kind === "browser") {
                const final = await current.recognizer.stop();
                session.current = null;
                setInterim("");
                setText(final);
                setStatus("review");
                // The microphone picked up speech but recognition returned
                // nothing. Some browsers fail silently like this, so switch
                // to recording rather than let it happen on every answer.
                if (!final && current.heardSound) {
                    const next = onModeFailed?.("no-result");
                    setError(
                        next === "record"
                            ? "Your browser's speech recognition didn't pick that up, so your answers will be recorded instead. Record that answer again."
                            : "Your browser's speech recognition didn't pick that up. Please type your answer instead."
                    );
                }
                return;
            }

            setStatus("transcribing");
            const audio = await current.recorder.stop();
            session.current = null;

            try {
                const form = new FormData();
                form.append("audio", audio, `answer.${audio.type.includes("mp4") ? "m4a" : "webm"}`);
                if (context) form.append("context", context);
                const response = await fetch("/api/interview/transcribe", { method: "POST", body: form });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.error ?? "Couldn't transcribe that recording.");
                setText(result.text ?? "");
            } catch (err) {
                setError(err.message);
                setText("");
            }
            setStatus("review");
        },
        [context, onModeFailed]
    );

    const start = useCallback(() => {
        setError(null);
        setText("");
        setInterim("");
        setElapsed(0);
        setDurationMs(0);

        const current = { kind: mode, startedAt: Date.now(), lastSpeech: null, stopping: false };

        if (mode === "browser") {
            current.recognizer = createRecognizer({
                onText: ({ final, interim: partial }) => {
                    current.lastSpeech = Date.now();
                    setText(final);
                    setInterim(partial);
                },
                onError: (code) => {
                    clearInterval(current.timer);
                    session.current = null;
                    setStatus("idle");
                    const fallback = code === "network" || code === "service-not-allowed" ? onModeFailed?.(code) : null;
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
            if (now - current.startedAt > MAX_ANSWER_MS) finish("limit");
            else if (current.lastSpeech && now - current.lastSpeech > SILENCE_MS) finish("silence");
        }, 250);

        session.current = current;
        setStatus("listening");
    }, [mode, stream, finish, onModeFailed]);

    const stop = useCallback(() => finish("manual"), [finish]);

    const cancel = useCallback(() => {
        const current = session.current;
        if (current) {
            clearInterval(current.timer);
            current.recognizer?.abort();
            current.recorder?.abort();
        }
        session.current = null;
        setStatus("idle");
        setInterim("");
    }, []);

    const reset = useCallback(() => {
        cancel();
        setText("");
        setError(null);
        setElapsed(0);
    }, [cancel]);

    useEffect(() => cancel, [cancel]);

    return {
        status,
        text,
        setText,
        interim,
        level,
        error,
        elapsed,
        // How long the last answer took, for words per minute.
        durationMs,
        start,
        stop,
        cancel,
        reset,
    };
}
