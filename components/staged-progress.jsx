"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// What to show while the AI works on something that takes a few seconds.
// The bar follows the usual time for the job and eases off near the end
// rather than claiming to be done, and the steps say what's happening, so
// a wait reads as progress instead of a frozen screen.
//
// `steps` are short labels, shown in order across `expectedMs`.
const StagedProgress = ({ title, steps, expectedMs = 8000, className }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const startedAt = Date.now();
        const timer = setInterval(() => setElapsed(Date.now() - startedAt), 150);
        return () => clearInterval(timer);
    }, []);

    // Linear up to 80% at the expected time, then creeps towards 95%.
    const share = elapsed < expectedMs ? (elapsed / expectedMs) * 0.8 : 0.8 + 0.15 * (1 - Math.exp(-(elapsed - expectedMs) / expectedMs));
    const current = Math.min(steps.length - 1, Math.floor((elapsed / expectedMs) * steps.length));
    const slow = elapsed > expectedMs * 1.8;

    return (
        <div role="status" aria-live="polite" className={cn("w-full max-w-sm space-y-4", className)}>
            <div className="space-y-2">
                <p className="text-lg font-semibold">{title}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#9EFF00] transition-[width] duration-300 ease-out" style={{ width: `${Math.round(share * 100)}%` }} />
                </div>
            </div>
            <ol className="space-y-2 text-sm">
                {steps.map((step, index) => (
                    <li key={step} className={cn("flex items-center gap-2 transition-colors", index > current ? "text-white/30" : index === current ? "text-white" : "text-muted-foreground")}>
                        {index < current ? (
                            <Check className="size-4 text-[#9EFF00]" />
                        ) : index === current ? (
                            <Loader2 className="size-4 animate-spin text-[#9EFF00]" />
                        ) : (
                            <span className="size-4 rounded-full border border-white/20" />
                        )}
                        {step}
                    </li>
                ))}
            </ol>
            {slow && <p className="text-xs text-muted-foreground">Taking a little longer than usual. Hang on, it&apos;s still working.</p>}
        </div>
    );
};

export default StagedProgress;
