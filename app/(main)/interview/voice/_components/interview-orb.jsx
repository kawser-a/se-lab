import { cn } from "@/lib/utils";

// The interviewer. Rings pulse while it's speaking; while the candidate
// answers, the inner circle follows the microphone level.
const InterviewOrb = ({ state, level = 0, compact = false }) => {
    const speaking = state === "speaking";
    const listening = state === "listening";

    return (
        <div className={cn("relative flex shrink-0 items-center justify-center", compact ? "size-20 sm:size-36" : "size-36 sm:size-44")} aria-hidden="true">
            {speaking && (
                <>
                    <span className="absolute inset-0 rounded-full bg-[#9EFF00]/20 motion-safe:animate-ping [animation-duration:1.8s]" />
                    <span className="absolute inset-2 sm:inset-3 rounded-full bg-[#9EFF00]/15 motion-safe:animate-ping [animation-duration:1.8s] [animation-delay:0.4s]" />
                </>
            )}
            <span
                className={cn(
                    "absolute rounded-full border transition-colors duration-300", compact ? "inset-2 sm:inset-4" : "inset-4",
                    listening ? "border-[#9EFF00]/60" : "border-white/10"
                )}
                style={listening ? { transform: `scale(${1 + level * 0.25})`, transition: "transform 80ms linear" } : undefined}
            />
            <span
                className={cn(
                    "relative rounded-full shadow-[0_0_40px_-8px_#9EFF00] transition-all duration-500", compact ? "size-12 sm:size-24" : "size-24 sm:size-28",
                    state === "thinking" ? "bg-gradient-to-br from-[#C9F300]/60 to-[#9EFF00]/30 motion-safe:animate-pulse" : "bg-gradient-to-br from-[#C9F300] to-[#7ACC00]",
                    state === "idle" && "opacity-70"
                )}
            />
        </div>
    );
};

export default InterviewOrb;
