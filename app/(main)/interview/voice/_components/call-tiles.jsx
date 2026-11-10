import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS = {
    speaking: "Speaking",
    listening: "Listening",
    thinking: "Thinking",
    idle: null,
};

// The interviewer's side of the call. The rings follow the actual loudness
// of their voice, so it looks like someone talking rather than a spinner.
export function InterviewerTile({ interviewer, state, level, compact = false, children }) {
    const speaking = state === "speaking";

    return (
        <div
            className={cn(
                "relative flex w-full items-center justify-center overflow-hidden rounded-3xl border bg-[radial-gradient(ellipse_at_center,#1f2614_0%,#121212_65%)] sm:aspect-video",
                compact ? "aspect-[4/3]" : "aspect-[4/5]"
            )}
        >
            <div className="relative flex items-center justify-center" aria-hidden="true">
                <span
                    className="absolute size-40 rounded-full bg-[#9EFF00]/10 transition-transform duration-75 sm:size-52"
                    style={{ transform: `scale(${speaking ? 1 + level * 0.45 : 1})` }}
                />
                <span
                    className="absolute size-32 rounded-full bg-[#9EFF00]/15 transition-transform duration-75 sm:size-40"
                    style={{ transform: `scale(${speaking ? 1 + level * 0.25 : 1})` }}
                />
                <span
                    className={cn(
                        "relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-[#C9F300] to-[#6FB800] text-4xl font-bold text-black shadow-[0_0_60px_-10px_#9EFF00] sm:size-28 sm:text-5xl",
                        state === "thinking" && "motion-safe:animate-pulse"
                    )}
                >
                    {interviewer.name[0]}
                </span>
            </div>

            {STATUS[state] && (
                <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium backdrop-blur">
                    <span className={cn("size-2 rounded-full", speaking ? "bg-[#9EFF00] motion-safe:animate-pulse" : "bg-white/50")} />
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
    const bars = [0.6, 1, 0.75];

    return (
        <div className="absolute right-3 top-3 flex w-28 flex-col overflow-hidden rounded-2xl border bg-neutral-900/90 shadow-xl backdrop-blur sm:right-4 sm:top-auto sm:bottom-4 sm:w-44">
            <div className="relative flex aspect-video items-center justify-center">
                {candidate.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={candidate.imageUrl} alt="" className={cn("size-10 rounded-full object-cover sm:size-14", listening && "ring-2 ring-[#9EFF00]")} />
                ) : (
                    <span className={cn("flex size-10 items-center justify-center rounded-full bg-neutral-700 text-lg font-semibold sm:size-14 sm:text-xl", listening && "ring-2 ring-[#9EFF00]")}>
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
                {micOn ? (
                    <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                        {bars.map((weight, index) => (
                            <span
                                key={index}
                                className="w-1 rounded-full bg-[#9EFF00] transition-[height] duration-75"
                                style={{ height: `${Math.max(20, Math.min(100, (listening ? level : 0) * 140 * weight))}%` }}
                            />
                        ))}
                        <Mic className="ml-1 size-3 text-muted-foreground" />
                    </span>
                ) : (
                    <MicOff className="size-3 text-muted-foreground" />
                )}
            </div>
        </div>
    );
}
