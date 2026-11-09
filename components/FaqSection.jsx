"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BackgroundBeams } from "./ui/background-beams";

const faqData = [
    {
        title: "What is GrowthGrid?",
        answer:
            "GrowthGrid is an all-in-one career advancement platform designed to help job seekers build strong CVs, discover job opportunities, prepare for interviews, and stay ahead by learning trending skills relevant to the job market.",
    },
    {
        title: "Who is GrowthGrid for?",
        answer:
            "GrowthGrid supports career growth for everyone—from students and recent graduates entering the job market to mid-level professionals seeking change or advancement. It’s also ideal for anyone looking to upskill and stay competitive in today’s fast-changing job landscape.",
    },
    {
        title: "What features does GrowthGrid offer?",
        answer:
            "GrowthGrid offers powerful tools to support your career at every stage. From an AI-powered CV builder and job matching tool to mock interviews and personalized coaching, it helps you prepare and grow with confidence. Features like skill gap analysis, trending skills tracking, and personalized learning roadmaps ensure you stay ahead. Plus, you'll get expert tips and resources to guide your journey.",
    },
    {
        title: "How does the CV Builder work?",
        answer:
            "Our CV Builder uses AI to analyze your background, suggest improvements, and generate tailored, professional CVs optimized for applicant tracking systems (ATS).",
    },
    {
        title: "Can GrowthGrid help me find a job?",
        answer:
            "Yes! GrowthGrid features a smart job-matching engine that connects your profile and interests with curated job listings, including remote, freelance, and full-time opportunities.",
    },
    {
        title: "What kind of interview help does GrowthGrid provide?",
        answer:
            "We offer smart tools to help you ace interviews. Get instant feedback from AI-driven mock interviews, explore role-specific question banks, and access coaching guides tailored to your industry. Opt for video-based practice to receive real-time analysis of your body language and tone.",
    },
    {
        title: " Is my data safe with GrowthGrid?",
        answer:
            "Absolutely. GrowthGrid uses industry-standard encryption and never shares your personal data without your consent. You can control your privacy settings anytime from your dashboard.",
    },
];

export default function FaqSection() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleIndex = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <main className="mt-36">
            <section className="page-container w-full px-6 space-y-12">
                    <div className="text-center">
                        <h1 className="text-center text-[#F4F4F5] text-3xl leading-tight md:text-5xl font-extrabold tracking-tight">
                            Frequently Asked <span className="relative inline-block">
                                <span className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1" />
                                <strong className="text-black">Questions</strong>
                            </span>
                        </h1>
                        <p className="mt-4 dark:text-gray-400 text-center text-[#D4D4D8] text-sm md:text-base font-medium tracking-wide">
                            Can't find what you're looking for? Reach out to us directly.
                        </p>
                    </div>

                    <motion.div
                        layout
                        className="max-w-5xl mx-auto mt-16 space-y-6"
                        id="faq"
                    >
                        {faqData.map((item, i) => (
                            <motion.div key={i} layout className="rounded-xl bg-[#1F1F1F] px-6 py-5 border border-[#2A2A2A] transition-all hover:border-[#C9F300]">
                                <motion.div
                                    layout
                                    initial={false}
                                    className="flex justify-between items-center cursor-pointer group transition-colors duration-200"
                                    onClick={() => toggleIndex(i)}
                                >
                                    <motion.h2
                                        layout
                                        className="text-lg md:text-xl font-semibold text-[#F4F4F5] group-hover:text-[#C9F300] transition-colors"
                                    >
                                        {item.title}
                                    </motion.h2>
                                    <div className="h-7 w-7 rounded-full bg-[#C9F300] flex items-center justify-center ml-3 relative transition-transform duration-300">
                                        <div className="w-4 h-0.5 bg-black absolute" />
                                        <motion.div
                                            className="w-4 h-0.5 bg-black absolute"
                                            animate={{ rotate: openIndex === i ? 0 : 90 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>

                                </motion.div>

                                <AnimatePresence initial={false}>
                                    {openIndex === i && (
                                        <motion.div
                                            className="overflow-hidden"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <motion.p
                                                className="pt-4 text-base leading-relaxed text-[#D4D4D8]"
                                                initial={{ y: -10 }}
                                                animate={{ y: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {item.answer}
                                            </motion.p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </motion.div>
            </section>
        </main>
    );
}
