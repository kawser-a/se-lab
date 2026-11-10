"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion } from "motion/react";
import { ArrowRight, FileText, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { generateCoverLetter } from "@/actions/cover-letter";
import StagedProgress from "@/components/staged-progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LENGTHS, MAX_DESCRIPTION, MIN_DESCRIPTION, TONES, letterRequestSchema } from "@/lib/cover-letter/letter";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "growthgrid:cover-letter-draft";
const PROFILE = "profile";

const WRITING_STEPS = ["Reading the job description", "Finding the evidence in your CV", "Writing your letter", "Checking nothing is made up"];

function Section({ title, hint, children }) {
    return (
        <section className="space-y-4 py-6 first:pt-0 last:pb-0">
            <div className="space-y-1">
                <h2 className="text-base font-semibold">{title}</h2>
                {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            </div>
            {children}
        </section>
    );
}

function Field({ id, label, optional, error, children }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
            </Label>
            {children}
            {error && (
                <p id={`${id}-error`} className="text-sm text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}

function Segmented({ name, label, options, value, onChange, describe }) {
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
            <p className="text-sm text-muted-foreground">{describe(options[value])}</p>
        </div>
    );
}

function SourceOption({ checked, onChange, icon: Icon, title, detail }) {
    return (
        <label
            className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#9EFF00]",
                checked ? "border-[#9EFF00]/60 bg-[#9EFF00]/[0.06]" : "border-white/10 hover:border-white/30"
            )}
        >
            <input type="radio" name="source" checked={checked} onChange={onChange} className="sr-only" />
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full transition-colors", checked ? "bg-[#9EFF00] text-black" : "bg-white/10")} aria-hidden="true">
                <Icon className="size-5" />
            </span>
            <span className="min-w-0">
                <span className={cn("block truncate font-semibold", checked && "text-[#C9F300]")}>{title}</span>
                <span className="block truncate text-xs text-muted-foreground">{detail}</span>
            </span>
        </label>
    );
}

const empty = { companyName: "", jobTitle: "", hiringManager: "", jobDescription: "", tone: "confident", length: "standard" };

function readDraft() {
    try {
        return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    } catch {
        return null;
    }
}

function writeDraft(values) {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {
        // Private browsing or storage turned off: the form still works, it just won't be remembered.
    }
}

function clearDraft() {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {
        // Nothing to clear.
    }
}

const LetterForm = ({ sources, initial }) => {
    const router = useRouter();
    const { resumes, profileSkills } = sources;
    const [values, setValues] = useState(() => ({ ...empty, ...initial, resumeId: initial?.resumeId ?? resumes[0]?.id ?? PROFILE }));
    const [errors, setErrors] = useState({});
    const [writing, setWriting] = useState(false);
    const [restored, setRestored] = useState(false);
    const formRef = useRef(null);

    // Someone who leaves halfway (to find the advert, say) gets their typing
    // back. Skipped when starting from another letter, which is its own start.
    useEffect(() => {
        if (initial) return;
        const draft = readDraft();
        if (draft && (draft.companyName || draft.jobDescription)) {
            setValues((current) => ({ ...current, ...draft, resumeId: resumes.some((resume) => resume.id === draft.resumeId) ? draft.resumeId : current.resumeId }));
            setRestored(true);
        }
    }, [initial, resumes]);

    const set = (field) => (value) => {
        const next = { ...values, [field]: value };
        setValues(next);
        if (errors[field]) setErrors({ ...errors, [field]: undefined });
        if (!initial) writeDraft(next);
    };

    const startOver = () => {
        clearDraft();
        setValues({ ...empty, resumeId: resumes[0]?.id ?? PROFILE });
        setErrors({});
        setRestored(false);
    };

    const focusField = (field) => formRef.current?.querySelector(`[name="${field}"]`)?.focus();

    const submit = async (event) => {
        event.preventDefault();
        if (writing) return;

        const request = { ...values, resumeId: values.resumeId === PROFILE ? undefined : values.resumeId };
        const checked = letterRequestSchema.safeParse(request);
        if (!checked.success) {
            const found = {};
            for (const issue of checked.error.issues) found[issue.path[0]] ??= issue.message;
            setErrors(found);
            focusField(checked.error.issues[0].path[0]);
            return;
        }

        setWriting(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        try {
            const result = await generateCoverLetter(request);
            if (result.error) {
                setWriting(false);
                if (result.field) {
                    setErrors({ [result.field]: result.error });
                    setTimeout(() => focusField(result.field));
                } else {
                    toast.error(result.error);
                }
                return;
            }
            clearDraft();
            router.push(`/ai-cover-letter/${result.id}`);
        } catch {
            setWriting(false);
            toast.error("Couldn't write the letter just now. Your details are still here, so please try again.");
        }
    };

    if (writing) {
        return (
            <div className="flex min-h-[26rem] items-center justify-center rounded-3xl border border-white/10 bg-card p-8">
                <StagedProgress title={`Writing your letter to ${values.companyName.trim()}`} steps={WRITING_STEPS} expectedMs={9000} />
            </div>
        );
    }

    const descriptionLength = values.jobDescription.trim().length;

    return (
        <form ref={formRef} onSubmit={submit} noValidate className="space-y-8">
            {restored && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                    <span className="text-muted-foreground">We kept what you typed last time.</span>
                    <button type="button" onClick={startOver} className="font-medium text-[#C9F300] underline-offset-4 hover:underline">
                        Start with an empty form
                    </button>
                </div>
            )}

            <div className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-card p-5 sm:p-8">
                <Section title="The job">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="companyName" label="Company" error={errors.companyName}>
                            <Input
                                id="companyName"
                                name="companyName"
                                value={values.companyName}
                                onChange={(event) => set("companyName")(event.target.value)}
                                maxLength={120}
                                placeholder="e.g. Pathao"
                                autoComplete="organization"
                                aria-invalid={!!errors.companyName}
                                aria-describedby={errors.companyName ? "companyName-error" : undefined}
                                className="h-11"
                            />
                        </Field>
                        <Field id="jobTitle" label="Job title" error={errors.jobTitle}>
                            <Input
                                id="jobTitle"
                                name="jobTitle"
                                value={values.jobTitle}
                                onChange={(event) => set("jobTitle")(event.target.value)}
                                maxLength={120}
                                placeholder="e.g. Frontend Engineer"
                                aria-invalid={!!errors.jobTitle}
                                aria-describedby={errors.jobTitle ? "jobTitle-error" : undefined}
                                className="h-11"
                            />
                        </Field>
                    </div>
                    <Field id="hiringManager" label="Who to address it to" optional error={errors.hiringManager}>
                        <Input
                            id="hiringManager"
                            name="hiringManager"
                            value={values.hiringManager}
                            onChange={(event) => set("hiringManager")(event.target.value)}
                            maxLength={120}
                            placeholder="e.g. Nadia Karim. Leave empty for “Dear Hiring Manager”"
                            className="h-11"
                        />
                    </Field>
                    <Field id="jobDescription" label="Job description" error={errors.jobDescription}>
                        <Textarea
                            id="jobDescription"
                            name="jobDescription"
                            value={values.jobDescription}
                            onChange={(event) => set("jobDescription")(event.target.value)}
                            maxLength={MAX_DESCRIPTION}
                            placeholder="Paste the advert here: the responsibilities and requirements matter most."
                            aria-invalid={!!errors.jobDescription}
                            aria-describedby="jobDescription-help"
                            className="min-h-48 resize-y"
                        />
                        <p id="jobDescription-help" className="flex justify-between gap-3 text-xs text-muted-foreground">
                            <span>{descriptionLength < MIN_DESCRIPTION ? `At least ${MIN_DESCRIPTION} characters, so the letter has something to answer.` : "The letter answers its main requirements one by one."}</span>
                            <span className="tabular-nums">
                                {descriptionLength.toLocaleString("en")} / {MAX_DESCRIPTION.toLocaleString("en")}
                            </span>
                        </p>
                    </Field>
                </Section>

                <Section title="Write it from" hint="The letter only uses what's in here, so pick the CV closest to this job.">
                    <div role="radiogroup" aria-label="Write it from" className="grid gap-3 sm:grid-cols-2">
                        {resumes.map((resume) => (
                            <SourceOption
                                key={resume.id}
                                checked={values.resumeId === resume.id}
                                onChange={() => set("resumeId")(resume.id)}
                                icon={FileText}
                                title={resume.title}
                                detail={`CV · edited ${formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })}`}
                            />
                        ))}
                        <SourceOption
                            checked={values.resumeId === PROFILE}
                            onChange={() => set("resumeId")(PROFILE)}
                            icon={UserRound}
                            title="My profile only"
                            detail={profileSkills ? `Your bio, experience and ${profileSkills} skills` : "Your bio and experience"}
                        />
                    </div>
                    {resumes.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            A profile gives the letter less to work with, so expect more [brackets] to fill in.{" "}
                            <Link href="/resume/new" className="text-[#C9F300] underline-offset-4 hover:underline">
                                Make a CV first
                            </Link>
                        </p>
                    )}
                </Section>

                <Section title="Tone">
                    <Segmented name="tone" label="Tone" options={TONES} value={values.tone} onChange={set("tone")} describe={(option) => option.hint} />
                </Section>

                <Section title="Length">
                    <Segmented
                        name="length"
                        label="Length"
                        options={LENGTHS}
                        value={values.length}
                        onChange={set("length")}
                        describe={(option) => `About ${option.words[0]}–${option.words[1]} words${option.paragraphs <= 3 ? ", for application forms with a word limit." : option.paragraphs >= 5 ? ", when the role asks for a lot." : ", what most employers expect."}`}
                    />
                </Section>
            </div>

            <div className="flex flex-col items-center gap-3 text-center">
                <button
                    type="submit"
                    aria-busy={writing}
                    className="group inline-flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#9EFF00] px-8 text-base font-semibold text-black shadow-[0_0_40px_-12px_#9EFF00] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#b4ff33] hover:shadow-[0_0_50px_-8px_#9EFF00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9EFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] active:translate-y-0 active:scale-[0.97]"
                >
                    {writing ? <Loader2 className="size-5 animate-spin" /> : null}
                    Write my cover letter
                    <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <p className="text-sm text-muted-foreground">Takes about ten seconds. You can edit everything afterwards.</p>
            </div>
        </form>
    );
};

export default LetterForm;
