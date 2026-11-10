import Link from "next/link";
import { ArrowRight, Check, ListChecks, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
    {
        href: "/interview/voice/new",
        icon: Mic,
        title: "Voice interview",
        badge: "Most realistic",
        description: "A spoken mock interview with an AI interviewer who listens, follows up and gives feedback on every answer.",
        points: ["Questions for your role and level", "Follow-up questions, like a real interviewer", "Scored on understanding, depth and communication"],
        time: "10 to 30 minutes",
        action: "Start voice interview",
        featured: true,
    },
    {
        href: "/interview/mock",
        icon: ListChecks,
        title: "Knowledge quiz",
        description: "Ten multiple-choice questions for your industry, with an explanation for each answer.",
        points: ["Instant score", "A tip on what to study next"],
        time: "About 5 minutes",
        action: "Start a quiz",
    },
];

const PracticeModes = () => (
    <section aria-labelledby="practice-heading" className="space-y-4">
        <h2 id="practice-heading" className="text-xl font-semibold">
            Start practising
        </h2>
        <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
            {MODES.map(({ href, icon: Icon, title, badge, description, points, time, action, featured }) => (
                <article
                    key={href}
                    className={cn(
                        "group flex flex-col gap-5 rounded-3xl border p-6 transition-colors sm:p-7",
                        featured ? "border-[#9EFF00]/40 bg-card" : "border-white/10 bg-card hover:border-white/20"
                    )}
                    style={featured ? { backgroundImage: "radial-gradient(ellipse at top left, rgba(158, 255, 0, 0.08), transparent 60%)" } : undefined}
                >
                    <div className="flex items-start gap-4">
                        <span
                            className={cn(
                                "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                                featured ? "bg-gradient-to-br from-[#C9F300] to-[#6FB800] text-black" : "bg-white/5 text-[#C9F300]"
                            )}
                        >
                            <Icon className="size-6" />
                        </span>
                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-bold">{title}</h3>
                                {badge && <span className="rounded-full bg-[#9EFF00]/10 px-2 py-0.5 text-xs font-medium text-[#C9F300]">{badge}</span>}
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                        </div>
                    </div>

                    <ul className="space-y-2">
                        {points.map((point) => (
                            <li key={point} className="flex items-center gap-2 text-sm">
                                <Check className="size-4 shrink-0 text-[#9EFF00]" /> {point}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                        <span className="text-sm text-muted-foreground">{time}</span>
                        <Link
                            href={href}
                            className={cn(
                                "inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
                                featured
                                    ? "bg-[#9EFF00] text-black shadow-[0_0_30px_-12px_#9EFF00] hover:bg-[#b4ff33]"
                                    : "border border-white/20 hover:border-[#9EFF00]/60 hover:text-[#C9F300]"
                            )}
                        >
                            {action} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </article>
            ))}
        </div>
    </section>
);

export default PracticeModes;
