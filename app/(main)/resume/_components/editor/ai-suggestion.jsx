"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shows a suggested rewrite next to what the user wrote. Nothing changes
// until they choose "Use this".
const AiSuggestion = ({ suggestion, loading, onAccept, onRetry, onDismiss }) => {
    // Bracketed gaps like [X%] are numbers only the user knows.
    const parts = suggestion ? suggestion.split(/(\[[^\]]+\])/) : [];
    const hasGaps = parts.some((part) => part.startsWith("["));

    return (
        <div className="space-y-2.5 rounded-lg border border-[#9EFF00]/30 bg-[#9EFF00]/5 p-3">
            <p className="text-sm font-semibold text-[#C9F300]">Suggestion</p>
            {loading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Writing a suggestion
                </p>
            ) : (
                <p className="text-sm leading-relaxed">
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
                <Button type="button" size="sm" onClick={onAccept} disabled={loading}>
                    Use this
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onRetry} disabled={loading}>
                    Try again
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
                    Keep mine
                </Button>
            </div>
        </div>
    );
};

export default AiSuggestion;
