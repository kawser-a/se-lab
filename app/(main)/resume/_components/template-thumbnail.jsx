import { cn } from "@/lib/utils";

// Small drawings of each template's layout, used on cards and in pickers.

function Line({ width, className }) {
    return <div className={cn("h-1 rounded-sm bg-neutral-300", className)} style={{ width }} />;
}

export function TemplateThumbnail({ templateId, accent, className }) {
    if (templateId === "creative") {
        return (
            <div aria-hidden="true" className={cn("flex overflow-hidden rounded-t-sm bg-white", className)}>
                <div className="flex w-1/3 flex-col items-center gap-1.5 px-2 py-3" style={{ backgroundColor: accent }}>
                    <div className="h-1 w-full rounded-sm bg-white/50" />
                    <div className="h-1 w-4/5 rounded-sm bg-white/50" />
                    <div className="mt-2 h-1 w-full rounded-sm bg-white/50" />
                    <div className="h-1 w-3/4 rounded-sm bg-white/50" />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 overflow-hidden px-2.5 py-3 [&>*]:shrink-0">
                    <div className="h-2 w-4/5 rounded-sm bg-neutral-900" />
                    <div className="h-1 w-3/5 rounded-sm" style={{ backgroundColor: accent }} />
                    <Line width="100%" className="mt-2" />
                    <Line width="85%" />
                    <Line width="95%" />
                    <Line width="70%" />
                </div>
            </div>
        );
    }

    const centered = templateId === "academic";
    const banded = templateId === "graduate";

    const heading = (key) =>
        banded ? (
            <div key={key} className="mt-1.5 h-2.5 w-full rounded-sm" style={{ backgroundColor: `${accent}26` }} />
        ) : (
            <div key={key} className="mt-1.5 h-0.5 w-full" style={{ backgroundColor: centered ? "#111" : accent }} />
        );

    return (
        <div
            aria-hidden="true"
            className={cn(
                "flex flex-col gap-1.5 overflow-hidden rounded-t-sm bg-white px-3.5 pt-4 [&>*]:shrink-0",
                centered && "items-center",
                className
            )}
        >
            <div className="h-2 w-3/5 rounded-sm bg-neutral-900" />
            <Line width="85%" className="bg-neutral-400" />
            {heading("a")}
            <Line width="100%" />
            <Line width="80%" />
            {heading("b")}
            <Line width="95%" />
            <Line width="88%" />
            <Line width="92%" />
            {heading("c")}
            <Line width="90%" />
        </div>
    );
}
