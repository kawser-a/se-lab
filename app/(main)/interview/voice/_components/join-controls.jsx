"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Keyboard, ListChecks, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLevelMeter, getMicrophone, microphoneError } from "@/lib/interview/speech";
import { cn } from "@/lib/utils";

const JOIN_STYLE =
    "h-12 w-full rounded-full bg-[#9EFF00] px-7 text-base font-semibold text-black shadow-[0_0_30px_-10px_#9EFF00] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#b4ff33] hover:shadow-[0_0_40px_-8px_#9EFF00] active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:bg-white/10 disabled:text-white/50 disabled:opacity-100 disabled:shadow-none";

// One row of the "before you start" checklist.
function CheckRow({ icon, title, children, tone = "idle" }) {
    return (
        <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span
                className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
                    tone === "done" && "bg-[#9EFF00] text-black",
                    tone === "busy" && "bg-white/5 text-[#9EFF00]",
                    tone === "idle" && "bg-white/5 text-muted-foreground",
                    tone === "problem" && "bg-red-500/15 text-red-300"
                )}
            >
                {icon}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm font-medium">{title}</p>
                {children}
            </div>
        </li>
    );
}

// Everything between arriving and joining, in one place: the questions
// being prepared, the microphone, and one button to join.
//
// The microphone is asked for when they press Join, so there's a single
// step to take. If the browser already allows it, its level shows straight
// away; otherwise they can test it first if they'd like to.
const JoinControls = ({ voiceAvailable, insecure = false, ready, prepareError, onRetryPrepare, resuming, onJoin }) => {
    const [mic, setMic] = useState("unknown"); // unknown | starting | live | blocked
    const [stream, setStream] = useState(null);
    const [level, setLevel] = useState(0);
    const [heard, setHeard] = useState(false);
    const [error, setError] = useState(null);
    const joining = useRef(false);
    const handedOver = useRef(false);
    const streamRef = useRef(null);
    streamRef.current = stream;

    // If they leave without joining, let go of the microphone.
    useEffect(
        () => () => {
            if (!handedOver.current) streamRef.current?.getTracks().forEach((track) => track.stop());
        },
        []
    );

    useEffect(() => {
        if (!stream) return;
        return createLevelMeter(stream, (value) => {
            setLevel(value);
            if (value > 0.15) setHeard(true);
        });
    }, [stream]);

    const startMic = useCallback(async () => {
        setMic("starting");
        setError(null);
        try {
            const next = await getMicrophone();
            setStream(next);
            setMic("live");
            return next;
        } catch (err) {
            setError(microphoneError(err));
            setMic("blocked");
            return null;
        }
    }, []);

    // Turn the preview on by itself only when the browser won't need to ask.
    useEffect(() => {
        if (!voiceAvailable || !navigator.permissions?.query) return;
        let cancelled = false;
        navigator.permissions
            .query({ name: "microphone" })
            .then((status) => {
                if (!cancelled && status.state === "granted") startMic();
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [voiceAvailable, startMic]);

    const join = async () => {
        if (joining.current) return;
        if (!voiceAvailable) return onJoin(null);
        joining.current = true;
        const micStream = stream ?? (await startMic());
        joining.current = false;
        // If the microphone was refused, stay here so they can fix it or choose to type.
        if (!micStream) return;
        handedOver.current = true;
        onJoin(micStream);
    };

    const questionsRow = prepareError ? (
        <CheckRow icon={<ListChecks />} title="Questions" tone="problem">
            <p className="text-sm text-red-200">{prepareError}</p>
            <Button size="sm" variant="outline" onClick={onRetryPrepare}>
                Try again
            </Button>
        </CheckRow>
    ) : ready ? (
        <CheckRow icon={<Check />} title="Questions are ready" tone="done">
            <p className="text-xs text-muted-foreground">Written for your role and level.</p>
        </CheckRow>
    ) : (
        <CheckRow icon={<Loader2 className="animate-spin" />} title="Preparing your questions" tone="busy">
            <p className="text-xs text-muted-foreground">Usually a few seconds. You can check your microphone meanwhile.</p>
        </CheckRow>
    );

    let micRow;
    if (!voiceAvailable) {
        micRow = (
            <CheckRow icon={<Keyboard />} title="You'll type your answers" tone={insecure ? "problem" : "idle"}>
                <p className="text-xs leading-relaxed text-muted-foreground">
                    {insecure
                        ? "Your browser only allows the microphone on a secure (https) connection, and this page isn't on one. The interviewer still speaks each question."
                        : "This browser can't take spoken answers. The interviewer still speaks each question."}
                </p>
            </CheckRow>
        );
    } else if (mic === "live") {
        micRow = (
            <CheckRow icon={<Mic />} title={heard ? "Microphone is working" : "Microphone is on"} tone={heard ? "done" : "busy"}>
                <div className="h-2 overflow-hidden rounded-full bg-white/10" role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
                    <div className="h-full rounded-full bg-[#9EFF00] transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground" aria-live="polite">
                    {heard ? "We can hear you." : "Say a few words. The bar should move."}
                </p>
            </CheckRow>
        );
    } else if (mic === "blocked") {
        micRow = (
            <CheckRow icon={<MicOff />} title="Microphone isn't available" tone="problem">
                <p role="alert" className="text-xs leading-relaxed text-red-200">
                    {error}
                </p>
                <button type="button" onClick={startMic} className="text-xs font-medium text-[#C9F300] underline-offset-4 hover:underline">
                    Try the microphone again
                </button>
            </CheckRow>
        );
    } else {
        micRow = (
            <CheckRow icon={mic === "starting" ? <Loader2 className="animate-spin" /> : <Mic />} title="Microphone" tone={mic === "starting" ? "busy" : "idle"}>
                <p className="text-xs leading-relaxed text-muted-foreground">
                    {mic === "starting" ? "Waiting for your browser's permission…" : "Your browser will ask for it when you join."}{" "}
                    {mic !== "starting" && (
                        <button type="button" onClick={startMic} className="font-medium text-[#C9F300] underline-offset-4 hover:underline">
                            Test it now
                        </button>
                    )}
                </p>
            </CheckRow>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-5">
            <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/20 p-4">
                {questionsRow}
                {micRow}
            </ul>

            {/* Fixed to the bottom of the screen on phones and tablets, so joining never needs a scroll. */}
            <div className="fixed inset-x-0 bottom-0 z-40 space-y-1 border-t border-white/10 bg-[#121212]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mt-auto lg:space-y-2 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                <Button size="lg" className={JOIN_STYLE} onClick={join} disabled={!ready || mic === "starting"}>
                    {!ready ? <Loader2 className="animate-spin" /> : null}
                    {!ready ? "Preparing questions…" : resuming ? "Rejoin interview" : "Join interview"}
                </Button>
                {voiceAvailable && (
                    <Button variant="ghost" className="h-10 w-full rounded-full text-muted-foreground hover:text-white" onClick={() => onJoin(null)} disabled={!ready}>
                        <Keyboard /> Join and type my answers instead
                    </Button>
                )}
                <p className="hidden pt-1 text-center text-xs text-muted-foreground lg:block">Headphones help. You can pause any time.</p>
            </div>
        </div>
    );
};

export default JoinControls;
