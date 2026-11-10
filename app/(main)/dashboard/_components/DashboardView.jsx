"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ArrowRight, Info, ListChecks, Loader2, MapPin, Mic, Pencil, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { countryByCode } from "@/data/countries";
import { describeIndustry } from "@/lib/insights/market";
import { cn } from "@/lib/utils";
import SalaryRanges from "./SalaryRanges";
import SkillMatch from "./SkillMatch";

const LEVEL = {
    HIGH: { label: "High", tone: "text-[#9EFF00]", note: "Employers are hiring actively." },
    MEDIUM: { label: "Moderate", tone: "text-[#C9F300]", note: "Steady hiring, with competition for roles." },
    LOW: { label: "Low", tone: "text-amber-300", note: "Fewer openings than candidates." },
};

const OUTLOOK = {
    POSITIVE: { label: "Positive", tone: "text-[#9EFF00]", icon: TrendingUp, note: "Expected to grow over the next year or two." },
    NEUTRAL: { label: "Stable", tone: "text-[#C9F300]", icon: TrendingUp, note: "Expected to hold roughly steady." },
    NEGATIVE: { label: "Cautious", tone: "text-amber-300", icon: TrendingDown, note: "Expected to tighten for a while." },
};

function Tile({ label, value, tone, note }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-card p-4 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
            <p className={cn("mt-1.5 text-lg font-bold sm:mt-2 sm:text-2xl", tone)}>{value}</p>
            <p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">{note}</p>
        </div>
    );
}

function Header({ title, subtitle, children }) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold gradient-title text-[#F4F4F5] md:text-6xl">{title}</h1>
                {subtitle}
            </div>
            <div className="flex flex-wrap gap-2">
                <Link
                    href="/profile"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm transition-colors hover:border-[#9EFF00]/60 hover:text-[#C9F300]"
                >
                    <Pencil className="size-4" /> Edit profile
                </Link>
                {children}
            </div>
        </header>
    );
}

function Notice({ title, children, action }) {
    return (
        <section className="flex flex-col items-start gap-4 rounded-3xl border border-amber-300/30 bg-amber-300/[0.04] p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{children}</p>
            {action}
        </section>
    );
}

const DashboardView = ({ profile, insight, needsCountry, error }) => {
    const router = useRouter();
    const [retrying, startRetry] = useTransition();
    const industry = describeIndustry(profile.industry);
    const country = countryByCode(profile.country);

    const context = (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span>{industry?.specialization}</span>
            {country && (
                <span className="inline-flex items-center gap-1">
                    <MapPin className="size-4" /> {country.name}
                </span>
            )}
        </p>
    );

    if (needsCountry) {
        return (
            <div className="mx-auto max-w-6xl space-y-8 pt-6 pb-16">
                <Header title="Industry Insights" subtitle={context} />
                <Notice
                    title="Where do you work?"
                    action={
                        <Link href="/profile" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#9EFF00] px-6 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-[#b4ff33]">
                            Choose your country <ArrowRight className="size-4" />
                        </Link>
                    }
                >
                    Insights now describe your own job market, with salaries in its currency. Choose the country you work in (or Remote) and they&apos;ll be ready in a few seconds.
                </Notice>
            </div>
        );
    }

    if (error || !insight) {
        return (
            <div className="mx-auto max-w-6xl space-y-8 pt-6 pb-16">
                <Header title="Industry Insights" subtitle={context} />
                <Notice
                    title="Your insights aren't ready"
                    action={
                        <button
                            type="button"
                            onClick={() => startRetry(() => router.refresh())}
                            disabled={retrying}
                            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#9EFF00] px-6 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-[#b4ff33] disabled:opacity-60"
                        >
                            {retrying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Try again
                        </button>
                    }
                >
                    {error ?? "Something went wrong loading your insights."} Your profile is saved, so nothing needs re-entering.
                </Notice>
            </div>
        );
    }

    // Insights written before demand scores existed: treat the listed skills
    // as equally in demand until the weekly refresh replaces them.
    const skillDemand = insight.skillDemand?.length ? insight.skillDemand : insight.topSkills.map((skill) => ({ skill, demand: 50, direction: "STEADY" }));
    const trends = insight.trends?.length ? insight.trends : insight.keyTrends.map((name) => ({ name, detail: "" }));
    const level = LEVEL[insight.demandLevel] ?? LEVEL.MEDIUM;
    const outlook = OUTLOOK[insight.marketOutlook] ?? OUTLOOK.NEUTRAL;
    const growth = insight.growthRate;
    const updated = new Date(insight.lastUpdated);
    const ago = Date.now() - updated.getTime() < 60000 ? "just now" : formatDistanceToNowStrict(updated, { addSuffix: true });

    return (
        <div className="mx-auto max-w-6xl space-y-6 pt-6 pb-16">
            <Header
                title="Industry Insights"
                subtitle={
                    <div className="space-y-2">
                        {context}
                        <p suppressHydrationWarning className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                            <Info className="size-3.5" /> AI estimate · updated {format(updated, "d MMM yyyy")} ({ago}) · refreshes weekly
                        </p>
                    </div>
                }
            />

            <section aria-label="Market at a glance" className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
                <div className="col-span-3 rounded-2xl border border-white/10 bg-card p-5 lg:col-span-1">
                    <p className="text-sm text-muted-foreground">The market right now</p>
                    <p className="mt-2 text-sm leading-relaxed">{insight.summary || `${level.note} ${outlook.note}`}</p>
                </div>
                <Tile label="Hiring demand" value={level.label} tone={level.tone} note={level.note} />
                <Tile label="Outlook" value={outlook.label} tone={outlook.tone} note={outlook.note} />
                <Tile
                    label="Job growth a year"
                    value={`${growth > 0 ? "+" : ""}${growth}%`}
                    tone={growth >= 0 ? "text-white" : "text-amber-300"}
                    note={`Expected change in jobs in this field in ${country.name} over a year.`}
                />
            </section>

            <SkillMatch skills={profile.skills} skillDemand={skillDemand} countryName={country.name} />

            <SalaryRanges ranges={insight.salaryRanges} currency={insight.currency} country={country} experience={profile.experience} />

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <section aria-labelledby="trends-heading" className="space-y-4 rounded-3xl border border-white/10 bg-card p-5 sm:p-8">
                    <h2 id="trends-heading" className="text-xl font-semibold">
                        What&apos;s changing
                    </h2>
                    <ol className="space-y-4">
                        {trends.map((trend, index) => (
                            <li key={trend.name} className="flex gap-3">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#9EFF00]/10 text-xs font-semibold text-[#C9F300]">{index + 1}</span>
                                <div className="space-y-0.5">
                                    <p className="font-medium">{trend.name}</p>
                                    {trend.detail && <p className="text-sm leading-relaxed text-muted-foreground">{trend.detail}</p>}
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                <section aria-labelledby="next-heading" className="space-y-4 rounded-3xl border border-white/10 bg-card p-5 sm:p-8">
                    <div className="space-y-1">
                        <h2 id="next-heading" className="text-xl font-semibold">
                            Worth learning next
                        </h2>
                        <p className="text-sm text-muted-foreground">Growing in importance here, beyond what&apos;s asked for most today.</p>
                    </div>
                    <ul className="space-y-2">
                        {insight.recommendedSkills.map((skill) => (
                            <li key={skill} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-2.5">
                                <span className="text-sm">{skill}</span>
                                <span className="flex gap-1">
                                    <Link
                                        href={`/interview/mock?topic=${encodeURIComponent(skill)}`}
                                        aria-label={`Take a quiz on ${skill}`}
                                        title="Quiz"
                                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-[#C9F300]"
                                    >
                                        <ListChecks className="size-4" />
                                    </Link>
                                    <Link
                                        href={`/interview/voice/new?focus=${encodeURIComponent(skill)}`}
                                        aria-label={`Practise ${skill} in a voice interview`}
                                        title="Voice interview"
                                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-[#C9F300]"
                                    >
                                        <Mic className="size-4" />
                                    </Link>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
                These figures are AI estimates for {industry?.specialization} in {country.name}, made from general knowledge of the market rather than live job listings.
                Use them as a guide when planning what to learn or what to ask for, not as a quote for any particular job.
            </p>
        </div>
    );
};

export default DashboardView;
