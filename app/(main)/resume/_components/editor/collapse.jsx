"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Animates height by transitioning grid rows from 0fr to 1fr, which works
// without measuring the content. Children mount on first open and stay
// mounted afterwards so closing can animate too.
const Collapse = ({ open, children, className }) => {
    const [mounted, setMounted] = useState(open);
    // Overflow has to stay hidden while animating, but once open it must be
    // visible so dropdowns inside the panel aren't cut off.
    const [settled, setSettled] = useState(open);

    useEffect(() => {
        if (open) setMounted(true);
        else setSettled(false);
    }, [open]);

    return (
        <div
            className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
            onTransitionEnd={(event) => {
                if (event.target === event.currentTarget && open) setSettled(true);
            }}
            inert={!open}
        >
            <div className={cn("min-h-0", open && settled ? "overflow-visible" : "overflow-hidden", className)}>
                {mounted && children}
            </div>
        </div>
    );
};

export default Collapse;
