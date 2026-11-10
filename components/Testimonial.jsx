"use client";

import React from "react";
import testimonials from "@/data/testimonials";
import { chunkArray } from "@/data/utils";
import MarqueeTestimonial from "./sub-comp/MarqueeTestimonial";

export default function Testimonial() {
    const chunkedTestimonials = chunkArray(testimonials, 6);

    return (
        <section className="mt-20 mb-24 md:mb-44 space-y-10 md:space-y-14">
            <div className="text-center space-y-3">
                <h2 className="px-4 text-[#F4F4F5] text-3xl md:text-5xl font-extrabold leading-tight">
                    Freshers Who Made It&nbsp;— You&apos;re{" "}
                    <span className="relative inline-block">
                        <span className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1" />
                        <strong className="text-black"> Next!</strong>
                    </span>
                </h2>
                <h3 className="px-4 text-[#D4D4D8] text-base md:text-lg font-medium">
                    They started where you are. Now they're where you
                    <span className="underline decoration-wavy decoration-[#9EFF00] underline-offset-4 ml-1">
                        want to be.
                    </span>
                </h3>
            </div>

            <div className="space-y-8">
                {chunkedTestimonials.map((row, index) => (
                    <MarqueeTestimonial
                        key={index}
                        testimonials={row}
                        reverse={index % 2 === 1}
                        speed={35 - index * 2}
                    />
                ))}
            </div>
        </section>
    );
}
