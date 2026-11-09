import React from "react";
import TestimonialCard from "./TestimonialCard";

export default function MarqueeTestimonial({ testimonials, reverse = false, speed = 30 }) {
    const flow = [...testimonials, ...testimonials]; // duplicate for infinite loop

    return (
        <div className="relative w-full overflow-hidden group">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 md:w-32 z-10 bg-gradient-to-r from-[#0f0f0f]/90 to-transparent blur-sm" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 md:w-32 z-10 bg-gradient-to-l from-[#0f0f0f]/90 to-transparent blur-sm" />

            <div
                className={`flex w-max gap-4 md:gap-6 ${reverse ? "animate-scroll-right" : "animate-scroll-left"
                    } group-hover:paused`}
                style={{ animationDuration: `${speed}s` }}
            >
                {flow.map((t, idx) => (
                    <TestimonialCard key={`${t.id}-${idx}`} t={t} />
                ))}
            </div>
        </div>
    );
}
