"use client";

import { useEffect, useState } from "react";
import { Keyboard, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLevelMeter, getMicrophone, microphoneError } from "@/lib/interview/speech";

// Run before the interview so permission or hardware problems show up here,
// not halfway through an answer.
// `waiting` keeps the join buttons disabled while the questions are still
// being written, so the mic check and the preparation happen side by side.
// The check comes first so the one main button reads as the next step.
const JOIN_STYLE =
    "h-12 rounded-full bg-[#9EFF00] px-7 font-semibold text-black shadow-[0_0_30px_-10px_#9EFF00] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#b4ff33] hover:shadow-[0_0_40px_-8px_#9EFF00] active:translate-y-0 active:scale-95 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none";

const MicCheck = ({ voiceAvailable, onReady, onTypeInstead, resuming, waiting = false, waitingLabel = "Preparing questions" }) => {
    const [state, setState] = useState("idle"); // idle | asking | live | failed
    const [stream, setStream] = useState(null);
    const [level, setLevel] = useState(0);
    const [peak, setPeak] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!stream) return;
        return createLevelMeter(stream, (value) => {
            setLevel(value);
            setPeak((current) => Math.max(current, value));
        });
    }, [stream]);

    const check = async () => {
        setState("asking");
        setError(null);
        try {
            setStream(await getMicrophone());
            setState("live");
        } catch (err) {
            setError(microphoneError(err));
            setState("failed");
        }
    };

    const heard = peak > 0.15;

    if (!voiceAvailable) {
        return (
            <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                    This browser can&apos;t take spoken answers, so you&apos;ll type them instead. The interviewer still speaks each question.
                </p>
                <Button size="lg" className={`${JOIN_STYLE} w-full`} onClick={onTypeInstead} disabled={waiting}>
                    {waiting ? <Loader2 className="animate-spin" /> : <Keyboard />}
                    {waiting ? waitingLabel : resuming ? "Rejoin interview" : "Join interview"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {state === "live" ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Mic className="size-5 shrink-0 text-[#9EFF00]" />
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10" role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
                            <div className="h-full rounded-full bg-[#9EFF00] transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground" aria-live="polite">
                        {heard ? "Sounds good. We can hear you." : "Say a few words to test it, like your name and the role you want."}
                    </p>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Turn on your microphone and say a few words to check it&apos;s working.</p>
            )}

            {error && (
                <p role="alert" className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-300">
                    <MicOff className="mt-0.5 size-4 shrink-0" /> {error}
                </p>
            )}

            <div className="flex flex-col gap-2">
                {state === "live" ? (
                    <Button size="lg" className={JOIN_STYLE} onClick={() => onReady(stream)} disabled={waiting}>
                        {waiting && <Loader2 className="animate-spin" />}
                        {waiting ? waitingLabel : resuming ? "Rejoin interview" : "Join interview"}
                    </Button>
                ) : (
                    <Button size="lg" className={JOIN_STYLE} onClick={check} disabled={state === "asking"}>
                        {state === "asking" ? <Loader2 className="animate-spin" /> : <Mic />}
                        {state === "failed" ? "Try the microphone again" : "Turn on microphone"}
                    </Button>
                )}
                <Button size="lg" variant="ghost" className="h-11 rounded-full text-muted-foreground hover:text-white" onClick={onTypeInstead} disabled={waiting}>
                    <Keyboard /> Type my answers instead
                </Button>
            </div>
        </div>
    );
};

export default MicCheck;
