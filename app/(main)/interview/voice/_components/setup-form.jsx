"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Loader2, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { startVoiceInterview } from "@/actions/voice-interview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTERVIEWERS, INTERVIEW_TYPES, LEVELS, minutesFor, QUESTION_COUNT } from "@/lib/interview/config";
import { cn } from "@/lib/utils";
import RolePicker from "./role-picker";

const MAX_FOCUS = 5;

function Section({ title, hint, htmlFor, children }) {
    const heading = htmlFor ? (
        <Label htmlFor={htmlFor} className="text-base font-semibold">
            {title}
        </Label>
    ) : (
        <h2 className="text-base font-semibold">{title}</h2>
    );
    return (
        <section className="space-y-3 py-6 first:pt-0 last:pb-0">
            <div className="space-y-1">
                {heading}
                {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            </div>
            {children}
        </section>
    );
}

// A row of options with a highlight that slides to the chosen one.
function Segmented({ name, label, options, value, onChange }) {
    const id = useId();
    return (
        <div className="space-y-2">
            <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
                {Object.entries(options).map(([key, option]) => {
                    const active = value === key;
                    return (
                        <label
                            key={key}
                            className={cn(
                                "relative cursor-pointer rounded-lg px-2 py-2.5 text-center text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#9EFF00]",
                                active ? "text-[#C9F300]" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <input type="radio" name={name} value={key} checked={active} onChange={() => onChange(key)} className="sr-only" />
                            {active && (
                                <motion.span
                                    layoutId={`${id}-highlight`}
                                    className="absolute inset-0 rounded-lg bg-[#9EFF00]/10 ring-1 ring-[#9EFF00]/50"
                                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                                />
                            )}
                            <span className="relative">{option.label}</span>
                        </label>
                    );
                })}
            </div>
            <p className="text-sm text-muted-foreground">{options[value]?.description}</p>
        </div>
    );
}

// The number of questions as a scale: tap a step, or nudge with − and +.
function LengthScale({ value, onChange }) {
    const steps = Array.from({ length: QUESTION_COUNT.max - QUESTION_COUNT.min + 1 }, (_, index) => QUESTION_COUNT.min + index);
    const nudge = "flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 transition-all duration-200 hover:border-[#9EFF00]/60 hover:text-[#C9F300] active:scale-90 disabled:pointer-events-none disabled:opacity-30";

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <button type="button" className={nudge} onClick={() => onChange(value - 1)} disabled={value <= QUESTION_COUNT.min} aria-label="Fewer questions">
                    <Minus className="size-4" />
                </button>
                <div role="radiogroup" aria-label="Number of questions" className="flex flex-1 items-center justify-between gap-1">
                    {steps.map((count) => {
                        const active = count === value;
                        const filled = count <= value;
                        return (
                            <label key={count} className="group relative flex flex-1 cursor-pointer flex-col items-center gap-2 py-1">
                                <input type="radio" name="questionCount" value={count} checked={active} onChange={() => onChange(count)} className="peer sr-only" />
                                <span
                                    className={cn(
                                        "h-2 w-full rounded-full transition-colors duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-[#9EFF00]",
                                        filled ? "bg-[#9EFF00]" : "bg-white/10 group-hover:bg-white/25"
                                    )}
                                />
                                <span className={cn("text-xs tabular-nums transition-colors", active ? "font-semibold text-[#C9F300]" : "text-muted-foreground")}>{count}</span>
                            </label>
                        );
                    })}
                </div>
                <button type="button" className={nudge} onClick={() => onChange(value + 1)} disabled={value >= QUESTION_COUNT.max} aria-label="More questions">
                    <Plus className="size-4" />
                </button>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
                <span className="font-medium text-white">{value} questions</span>, about {minutesFor(value)} minutes, plus the odd follow-up.
            </p>
        </div>
    );
}

function InterviewerPicker({ value, onChange }) {
    return (
        <div role="radiogroup" aria-label="Interviewer" className="grid grid-cols-2 gap-3">
            {Object.entries(INTERVIEWERS).map(([key, person]) => {
                const active = value === key;
                return (
                    <label
                        key={key}
                        className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#9EFF00]",
                            active ? "border-[#9EFF00]/60 bg-[#9EFF00]/[0.06]" : "border-white/10 hover:border-white/30"
                        )}
                    >
                        <input type="radio" name="interviewer" value={key} checked={active} onChange={() => onChange(key)} className="sr-only" />
                        <span
                            className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-colors",
                                active ? "bg-gradient-to-br from-[#C9F300] to-[#6FB800] text-black" : "bg-white/10"
                            )}
                            aria-hidden="true"
                        >
                            {person.name[0]}
                        </span>
                        <span className="min-w-0">
                            <span className={cn("block font-semibold", active && "text-[#C9F300]")}>{person.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{person.description}</span>
                        </span>
                    </label>
                );
            })}
        </div>
    );
}

const SetupForm = ({ defaults }) => {
    const router = useRouter();
    const [role, setRole] = useState("");
    const [type, setType] = useState("mixed");
    const [level, setLevel] = useState(defaults.level);
    const [questionCount, setQuestionCount] = useState(QUESTION_COUNT.default);
    const [focus, setFocus] = useState([]);
    const [focusDraft, setFocusDraft] = useState("");
    const [interviewer, setInterviewer] = useState("hannah");
    const [starting, setStarting] = useState(false);

    const addFocus = (topic) => {
        const clean = topic.trim().slice(0, 40);
        if (!clean || focus.length >= MAX_FOCUS || focus.some((item) => item.toLowerCase() === clean.toLowerCase())) return;
        setFocus([...focus, clean]);
        setFocusDraft("");
    };

    const submit = async (event) => {
        event.preventDefault();
        if (starting) return;
        setStarting(true);
        // A topic typed but not added yet still counts; nobody expects it to vanish.
        const pending = focusDraft.trim().slice(0, 40);
        const topics = pending && focus.length < MAX_FOCUS && !focus.some((item) => item.toLowerCase() === pending.toLowerCase()) ? [...focus, pending] : focus;
        if (topics !== focus) {
            setFocus(topics);
            setFocusDraft("");
        }
        try {
            const result = await startVoiceInterview({ role, type, level, questionCount, focus: topics, interviewer });
            if (result.error) throw new Error(result.error);
            router.push(`/interview/voice/${result.id}`);
        } catch (error) {
            toast.error(error.message || "Couldn't start the interview. Please try again.");
            setStarting(false);
        }
    };

    const suggestions = defaults.skills.filter((skill) => !focus.includes(skill));
    const hasRole = role.trim().length >= 2;

    return (
        <form onSubmit={submit} className="space-y-8">
            <div className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-card p-5 sm:p-8">
                <Section title="Role you're preparing for" htmlFor="role">
                    <RolePicker id="role" value={role} onChange={setRole} suggestedRole={defaults.suggestedRole} />
                </Section>

                <Section title="Experience level">
                    <Segmented name="level" label="Experience level" options={LEVELS} value={level} onChange={setLevel} />
                </Section>

                <Section title="Interview type">
                    <Segmented name="type" label="Interview type" options={INTERVIEW_TYPES} value={type} onChange={setType} />
                </Section>

                <Section title="Length">
                    <LengthScale value={questionCount} onChange={(count) => setQuestionCount(Math.min(QUESTION_COUNT.max, Math.max(QUESTION_COUNT.min, count)))} />
                </Section>

                <Section title="Your interviewer">
                    <InterviewerPicker value={interviewer} onChange={setInterviewer} />
                </Section>

                <Section title="Topics to practise" hint={`Optional. Add up to ${MAX_FOCUS} and the questions will lean towards them.`} htmlFor="focus">
                    {focus.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {focus.map((topic) => (
                                <span key={topic} className="flex items-center gap-1 rounded-full bg-[#9EFF00]/10 py-1 pl-3 pr-1 text-sm text-[#C9F300]">
                                    {topic}
                                    <button type="button" onClick={() => setFocus(focus.filter((item) => item !== topic))} aria-label={`Remove ${topic}`} className="rounded-full p-1 hover:bg-white/10">
                                        <X className="size-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                    {focus.length < MAX_FOCUS && (
                        <div className="relative">
                            <Input
                                id="focus"
                                value={focusDraft}
                                onChange={(event) => setFocusDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === ",") {
                                        event.preventDefault();
                                        addFocus(focusDraft);
                                    }
                                }}
                                maxLength={40}
                                placeholder="e.g. React hooks, system design, conflict"
                                className="h-11 pr-20"
                            />
                            {focusDraft.trim() && (
                                <button
                                    type="button"
                                    onClick={() => addFocus(focusDraft)}
                                    className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-[#C9F300] hover:bg-white/10"
                                >
                                    <Plus className="size-3.5" /> Add
                                </button>
                            )}
                        </div>
                    )}
                    {suggestions.length > 0 && focus.length < MAX_FOCUS && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">From your profile:</span>
                            {suggestions.map((skill) => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => addFocus(skill)}
                                    className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs transition-colors hover:border-[#9EFF00] hover:text-[#C9F300]"
                                >
                                    + {skill}
                                </button>
                            ))}
                        </div>
                    )}
                </Section>
            </div>

            <div className="flex flex-col items-center gap-3 text-center">
                <button
                    type="submit"
                    disabled={!hasRole}
                    aria-busy={starting}
                    className="group inline-flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#9EFF00] px-8 text-base font-semibold text-black shadow-[0_0_40px_-12px_#9EFF00] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#b4ff33] hover:shadow-[0_0_50px_-8px_#9EFF00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9EFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none aria-busy:pointer-events-none aria-busy:translate-y-0"
                >
                    {starting ? <Loader2 className="size-5 animate-spin" /> : null}
                    {starting ? "Setting up your interview…" : "Start interview"}
                    {!starting && <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />}
                </button>
                <p className="text-sm text-muted-foreground">
                    {!hasRole ? "Choose a role above to start." : "Works best in Chrome, Edge or Safari, in a quiet room."}
                </p>
            </div>
        </form>
    );
};

export default SetupForm;
