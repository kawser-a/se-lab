import { Loader2 } from "lucide-react";

// Shown while the page loads, which includes writing the insights the first
// time anyone opens this market.
const Loading = () => (
    <div className="mx-auto max-w-6xl space-y-6 pt-6 pb-16" role="status" aria-live="polite">
        <div className="space-y-3">
            <h1 className="text-4xl font-bold gradient-title text-[#F4F4F5] md:text-6xl">Industry Insights</h1>
            <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-[#9EFF00]" /> Loading your market. The first time for a new market takes a few seconds.
            </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((key) => (
                <div key={key} className="ai-shimmer h-28 rounded-2xl" />
            ))}
        </div>
        <div className="ai-shimmer h-72 rounded-3xl" aria-hidden="true" />
        <div className="ai-shimmer h-80 rounded-3xl" aria-hidden="true" />
    </div>
);

export default Loading;
