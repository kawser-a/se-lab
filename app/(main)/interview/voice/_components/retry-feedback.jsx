"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { retryVoiceFeedback } from "@/actions/voice-interview";
import { Button } from "@/components/ui/button";

// Shown when the interview finished but the AI couldn't write the feedback.
// The answers are already saved, so nothing is lost by trying again later.
const RetryFeedback = ({ id }) => {
    const router = useRouter();
    const [state, setState] = useState({ status: "idle" });

    const retry = async () => {
        setState({ status: "working" });
        try {
            const result = await retryVoiceFeedback(id);
            if (result.error) throw new Error(result.error);
            router.refresh();
        } catch (error) {
            setState({ status: "failed", message: error.message || "Couldn't write the feedback. Please try again." });
        }
    };

    return (
        <section className="space-y-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6">
            <div className="space-y-1">
                <h2 className="font-semibold text-amber-200">Your feedback isn&apos;t ready yet</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Your answers are saved, but the AI was too busy to review them when the interview ended. Try again now, or come back later.
                </p>
            </div>
            {state.status === "failed" && (
                <p role="alert" className="text-sm text-red-300">
                    {state.message}
                </p>
            )}
            <Button onClick={retry} disabled={state.status === "working"}>
                {state.status === "working" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                {state.status === "working" ? "Writing your feedback" : "Write my feedback"}
            </Button>
        </section>
    );
};

export default RetryFeedback;
