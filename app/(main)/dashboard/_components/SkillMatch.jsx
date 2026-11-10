"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ListChecks, Mic, Minus } from "lucide-react";
import { toast } from "sonner";
import { addProfileSkill, removeProfileSkill } from "@/actions/dashboard";
import { analyseSkills } from "@/lib/insights/skills";
import { cn } from "@/lib/utils";

const SHOWN = 6;

const DIRECTION = {
    RISING: { icon: ArrowUpRight, label: "Rising", tone: "text-[#9EFF00]" },
    STEADY: { icon: Minus, label: "Steady", tone: "text-muted-foreground" },
    FALLING: { icon: ArrowDownRight, label: "Falling", tone: "text-amber-300" },
};

function Direction({ value }) {
    const { icon: Icon, label, tone } = DIRECTION[value] ?? DIRECTION.STEADY;
    return (
        <span className={cn("inline-flex items-center gap-0.5 text-xs", tone)} title={`Demand is ${label.toLowerCase()}`}>
            <Icon className="size-3.5" /> {label}
        </span>
    );
}

function DemandBar({ value, tone = "bg-[#9EFF00]" }) {
    return (
        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/10" role="meter" aria-label="How often employers ask for it" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
            <span className={cn("block h-full rounded-full", tone)} style={{ width: `${value}%` }} />
        </span>
    );
}

function ScoreRing({ score }) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    return (
        <div className="relative size-28 shrink-0" role="img" aria-label={`${score}% match`}>
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#9EFF00" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * circumference} ${circumference}`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums">{score}%</span>
        </div>
    );
}

function verdict(score) {
    if (score >= 75) return "You already cover most of what employers ask for.";
    if (score >= 50) return "A solid base. Closing a couple of the gaps below would make a real difference.";
    if (score >= 25) return "Some of what's asked for. The gaps below are where to focus.";
    return "Little overlap so far. Start with the most asked-for gap below.";
}

// How someone's skills compare with what employers in their market ask for,
// and what to do about each gap: practise it, or say they already know it.
const SkillMatch = ({ skills: initialSkills, skillDemand, countryName }) => {
    const [skills, setSkills] = useState(initialSkills);
    const [showAll, setShowAll] = useState(false);
    const [pending, startTransition] = useTransition();
    const [busySkill, setBusySkill] = useState(null);

    const { have, missing, score } = analyseSkills(skills, skillDemand);
    const gaps = showAll ? missing : missing.slice(0, SHOWN);

    const knowIt = (skill) => {
        setBusySkill(skill);
        startTransition(async () => {
            const before = skills;
            const result = await addProfileSkill(skill).catch(() => ({ error: "Couldn't update your skills. Please try again." }));
            setBusySkill(null);
            if (result.error) return toast.error(result.error);
            setSkills(result.skills);
            toast(`Added ${skill} to your skills`, {
                action: {
                    label: "Undo",
                    onClick: async () => {
                        setSkills(before);
                        await removeProfileSkill(skill).catch(() => toast.error("Couldn't undo that. You can remove it from your profile."));
                    },
                },
            });
        });
    };

    if (!skills.length) {
        return (
            <section className="space-y-3 rounded-3xl border border-dashed border-white/15 p-6 text-center sm:p-8">
                <h2 className="text-xl font-semibold">How your skills compare</h2>
                <p className="text-sm text-muted-foreground">Add your skills to see how they compare with what employers in {countryName} ask for.</p>
                <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-medium text-[#C9F300] underline-offset-4 hover:underline">
                    Add your skills <ArrowRight className="size-4" />
                </Link>
            </section>
        );
    }

    return (
        <section aria-labelledby="skills-heading" className="space-y-6 rounded-3xl border border-[#9EFF00]/30 bg-card p-5 sm:p-8">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <ScoreRing score={score} />
                <div className="space-y-1.5">
                    <h2 id="skills-heading" className="text-xl font-semibold">
                        How your skills compare
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        You have {have.length} of the {skillDemand.length} skills employers in {countryName} ask for most. Weighted by how often each is asked for,
                        that&apos;s a {score}% match. {verdict(score)}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Gaps to close {missing.length > 0 && <span className="font-normal text-muted-foreground">· most asked for first</span>}</h3>
                    {missing.length === 0 ? (
                        <p className="rounded-2xl bg-[#9EFF00]/5 p-4 text-sm">No gaps among the most asked-for skills. Keep them sharp with a quiz or a voice interview.</p>
                    ) : (
                        <ul className="divide-y divide-white/10 rounded-2xl border border-white/10">
                            {gaps.map((item) => (
                                <li key={item.skill} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-medium">{item.skill}</span>
                                            <Direction value={item.direction} />
                                        </div>
                                        <DemandBar value={item.demand} tone="bg-amber-300/80" />
                                    </div>
                                    <div className="flex shrink-0 gap-1.5">
                                        <Link
                                            href={`/interview/mock?topic=${encodeURIComponent(item.skill)}`}
                                            className="inline-flex h-8 items-center gap-1 rounded-full border border-white/15 px-3 text-xs transition-colors hover:border-[#9EFF00]/60 hover:text-[#C9F300]"
                                            title={`Take a quiz on ${item.skill}`}
                                        >
                                            <ListChecks className="size-3.5" /> Quiz
                                        </Link>
                                        <Link
                                            href={`/interview/voice/new?focus=${encodeURIComponent(item.skill)}`}
                                            className="inline-flex h-8 items-center gap-1 rounded-full border border-white/15 px-3 text-xs transition-colors hover:border-[#9EFF00]/60 hover:text-[#C9F300]"
                                            title={`Practise ${item.skill} in a voice interview`}
                                        >
                                            <Mic className="size-3.5" /> Interview
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => knowIt(item.skill)}
                                            disabled={pending}
                                            className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                                            title={`Add ${item.skill} to your skills`}
                                        >
                                            <Check className="size-3.5" /> {busySkill === item.skill ? "Adding…" : "I know this"}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {missing.length > SHOWN && (
                        <button type="button" onClick={() => setShowAll(!showAll)} className="text-sm text-muted-foreground transition-colors hover:text-white">
                            {showAll ? "Show fewer" : `Show all ${missing.length} gaps`}
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Asked for, and you have it</h3>
                    {have.length === 0 ? (
                        <p className="text-sm text-muted-foreground">None of your listed skills are among the most asked for yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {have.map((item) => (
                                <li key={item.skill} className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <span>
                                            {item.skill}
                                            {item.yours && item.yours.toLowerCase() !== item.skill.toLowerCase() && (
                                                <span className="text-xs text-muted-foreground"> · as {item.yours}</span>
                                            )}
                                        </span>
                                        <Direction value={item.direction} />
                                    </div>
                                    <DemandBar value={item.demand} />
                                </li>
                            ))}
                        </ul>
                    )}
                    <p className="pt-1 text-xs text-muted-foreground">
                        Bars show how often employers ask for each skill, relative to the others.{" "}
                        <Link href="/profile" className="text-[#C9F300] underline-offset-4 hover:underline">
                            Edit your skills
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default SkillMatch;
