"use client";

import { motion } from "motion/react";
import { Mic, MicOff, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS = {
    speaking: "Speaking",
    listening: "Listening",
    paused: "Paused",
};

// Each bar moves with the voice at a slightly different weight, so the
// shape changes as they talk instead of the whole row bouncing together.
const BAR_WEIGHTS = [0.45, 0.8, 1, 0.7, 0.4];

function VoiceBars({ level, active }) {
    return (
        <span className="flex h-6 items-center gap-1" aria-hidden="true">
            {BAR_WEIGHTS.map((weight, index) => (
                <span
                    key={index}
                    className="w-1 rounded-full bg-[#9EFF00] transition-[height,opacity] duration-100"
                    style={{ height: `${active ? Math.max(18, Math.min(100, level * 160 * weight)) : 18}%`, opacity: active ? 1 : 0.35 }}
                />
            ))}
        </span>
    );
}

// The interviewer's side of the call. The rings follow the loudness of
// their voice while they talk, and while the candidate talks the outer ring
// follows the candidate's voice instead, so the interviewer visibly listens.
export function InterviewerTile({ interviewer, state, level = 0, listenLevel = 0, raised = false, className, children }) {
    const speaking = state === "speaking";
    const listening = state === "listening";

    return (
        <div
            className={cn(
                "relative isolate flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_center,#1c2412_0%,#141414_55%,#101010_100%)]",
                className
            )}
        >
            {/* On phones the avatar sits higher during the call to leave room for subtitles. */}
            <div className={cn("relative flex flex-col items-center gap-5 sm:mt-0", raised ? "-mt-12" : "scale-75 sm:scale-100")} aria-hidden="true">
                <div className="relative flex items-center justify-center">
                    <span
                        className="absolute size-36 rounded-full bg-[#9EFF00]/[0.07] transition-transform duration-100 sm:size-56"
                        style={{ transform: `scale(${speaking ? 1 + level * 0.4 : 1})` }}
                    />
                    <span
                        className="absolute size-28 rounded-full bg-[#9EFF00]/[0.12] transition-transform duration-100 sm:size-44"
                        style={{ transform: `scale(${speaking ? 1 + level * 0.22 : 1})` }}
                    />
                    <span
                        className={cn("absolute size-[7.5rem] rounded-full border-2 transition-[opacity,transform] duration-150 sm:size-[9rem]", listening ? "border-[#9EFF00]/70" : "border-transparent")}
                        style={{ transform: `scale(${listening ? 1 + Math.min(listenLevel, 1) * 0.12 : 1})`, opacity: listening ? 0.4 + Math.min(listenLevel, 1) * 0.6 : 0 }}
                    />
                    <motion.span
                        className={cn(
                            "relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-[#C9F300] to-[#6FB800] text-4xl font-bold text-black shadow-[0_0_60px_-10px_#9EFF00] sm:size-28 sm:text-5xl",
                            state === "paused" && "opacity-60 grayscale-[40%]"
                        )}
                        animate={state === "paused" ? { scale: 1 } : { scale: [1, 1.035, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {interviewer.name[0]}
                    </motion.span>
                </div>
                <VoiceBars level={level} active={speaking} />
            </div>

            {STATUS[state] && (
                <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium backdrop-blur">
                    {state === "paused" ? <Pause className="size-3" /> : <span className={cn("size-2 rounded-full", speaking ? "bg-[#9EFF00] motion-safe:animate-pulse" : "bg-white/60")} />}
                    {STATUS[state]}
                </span>
            )}

            <span className="absolute bottom-4 left-4 rounded-md bg-black/50 px-2.5 py-1 text-sm font-medium backdrop-blur">
                {interviewer.name} <span className="font-normal text-muted-foreground">· Interviewer</span>
            </span>

            {children}
        </div>
    );
}

// The candidate's own small tile, like the self-view on a video call.
export function SelfTile({ candidate, listening, level, micOn, wrapProgress }) {
    return (
        <div className="absolute right-3 top-3 flex w-24 flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90 shadow-xl backdrop-blur sm:right-4 sm:top-4 sm:w-40">
            <div className="relative flex aspect-video items-center justify-center">
                <span
                    className="absolute size-12 rounded-full bg-[#9EFF00]/20 transition-transform duration-100 sm:size-16"
                    style={{ transform: `scale(${listening ? 1 + Math.min(level, 1) * 0.5 : 0.8})`, opacity: listening ? 1 : 0 }}
                    aria-hidden="true"
                />
                {candidate.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={candidate.imageUrl} alt="" className="relative size-10 rounded-full object-cover sm:size-12" />
                ) : (
                    <span className="relative flex size-10 items-center justify-center rounded-full bg-neutral-700 text-lg font-semibold sm:size-12">
                        {(candidate.name || "You")[0]}
                    </span>
                )}
                {wrapProgress > 0 && (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                        <span className="block h-full bg-[#9EFF00] transition-[width] duration-150" style={{ width: `${wrapProgress * 100}%` }} />
                    </span>
                )}
            </div>
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
                <span className="truncate">You</span>
                {micOn ? <Mic className={cn("size-3", listening ? "text-[#9EFF00]" : "text-muted-foreground")} /> : <MicOff className="size-3 text-muted-foreground" />}
            </div>
        </div>
    );
}
