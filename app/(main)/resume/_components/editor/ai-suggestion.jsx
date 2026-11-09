"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Rough shape of the text that's on its way. Bullets are one line, summaries a few.
const PLACEHOLDER_LINES = {
    bullet: ["w-11/12", "w-2/3"],
    summary: ["w-full", "w-11/12", "w-full", "w-3/5"],
};

// Shows a suggested rewrite next to what the user wrote. Nothing changes
// until they choose "Use this".
const AiSuggestion = ({ suggestion, loading, kind = "bullet", onAccept, onRetry, onDismiss }) => {
    // Bracketed gaps like [X%] are numbers only the user knows.
    const parts = suggestion ? suggestion.split(/(\[[^\]]+\])/) : [];
    const hasGaps = parts.some((part) => part.startsWith("["));

    return (
        <div
            aria-busy={loading}
            className={cn(
                "space-y-2.5 rounded-lg border border-[#9EFF00]/30 bg-[#9EFF00]/5 p-3 transition-colors",
                loading && "ai-working"
            )}
        >
            <p className="text-sm font-semibold text-[#C9F300]">{loading ? "Writing a suggestion…" : "Suggestion"}</p>

            {loading ? (
                <div className="space-y-2 py-0.5" aria-hidden>
                    {PLACEHOLDER_LINES[kind].map((width, index) => (
                        <div key={index} className={cn("ai-shimmer h-3 rounded-full", width)} />
                    ))}
                </div>
            ) : (
                <p className="animate-in fade-in text-sm leading-relaxed duration-300">
                    {parts.map((part, index) =>
                        part.startsWith("[") ? (
                            <span key={index} className="rounded bg-amber-400/15 px-1 text-amber-300">
                                {part}
                            </span>
                        ) : (
                            <span key={index}>{part}</span>
                        )
                    )}
                </p>
            )}
            {hasGaps && !loading && (
                <p className="text-xs text-muted-foreground">Replace the highlighted part with your real number, or delete it.</p>
            )}

            <div className="flex flex-wrap gap-2">
                {!loading && (
                    <>
                        <Button type="button" size="sm" onClick={onAccept}>
                            Use this
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
                            Try again
                        </Button>
                    </>
                )}
                <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
                    {loading ? "Cancel" : "Keep mine"}
                </Button>
            </div>
        </div>
    );
};

export default AiSuggestion;
