"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { updateUser } from "@/actions/user";
import StagedProgress from "@/components/staged-progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { countries, countryByCode } from "@/data/countries";
import { industries } from "@/data/industries";
import { MAX_SKILLS, industrySlug, profileSchema, splitIndustrySlug } from "@/lib/insights/profile";
import { addSkill, canonicalSkill } from "@/lib/insights/skills";
import { suggestSkills } from "@/lib/resume/skill-suggestions";
import { cn } from "@/lib/utils";

function Field({ id, label, hint, error, children }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-semibold">
                {label}
            </Label>
            {children}
            {error ? (
                <p id={`${id}-error`} role="alert" className="text-sm text-red-300">
                    {error}
                </p>
            ) : (
                hint && <p className="text-xs text-muted-foreground">{hint}</p>
            )}
        </div>
    );
}

// Skills as chips: type and press Enter (or comma), pick a suggestion, or
// take one from your CV. Spellings of the same skill aren't added twice.
function SkillsInput({ id, skills, onChange, cvSkills, invalid }) {
    const [draft, setDraft] = useState("");
    const add = (skill) => {
        const clean = skill.trim().slice(0, 40);
        if (!clean || skills.length >= MAX_SKILLS) return;
        onChange(addSkill(skills, clean));
        setDraft("");
    };
    const remove = (skill) => onChange(skills.filter((item) => item !== skill));

    const taken = new Set(skills.map(canonicalSkill));
    const fromCv = cvSkills.filter((skill) => !taken.has(canonicalSkill(skill))).slice(0, 10);
    const typed = draft.trim() ? suggestSkills(draft, { exclude: skills, limit: 6 }) : [];

    return (
        <div className="space-y-3">
            {skills.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Your skills">
                    {skills.map((skill) => (
                        <li key={skill} className="flex items-center gap-1 rounded-full bg-[#9EFF00]/10 py-1 pl-3 pr-1 text-sm text-[#C9F300]">
                            {skill}
                            <button type="button" onClick={() => remove(skill)} aria-label={`Remove ${skill}`} className="rounded-full p-1 hover:bg-white/10">
                                <X className="size-3" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {skills.length < MAX_SKILLS && (
                <div className="relative">
                    <Input
                        id={id}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value.replace(",", ""))}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === ",") {
                                event.preventDefault();
                                add(draft);
                            } else if (event.key === "Backspace" && !draft && skills.length) {
                                remove(skills.at(-1));
                            }
                        }}
                        maxLength={40}
                        aria-invalid={invalid || undefined}
                        aria-describedby={invalid ? `${id}-error` : undefined}
                        placeholder={skills.length ? "Add another skill" : "e.g. React, SQL, Figma, Stakeholder management"}
                        className="h-11 pr-20"
                    />
                    {draft.trim() && (
                        <button
                            type="button"
                            onClick={() => add(draft)}
                            className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-[#C9F300] hover:bg-white/10"
                        >
                            <Plus className="size-3.5" /> Add
                        </button>
                    )}
                </div>
            )}
            {typed.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Suggestions:</span>
                    {typed.map((skill) => (
                        <button key={skill} type="button" onClick={() => add(skill)} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs transition-colors hover:border-[#9EFF00] hover:text-[#C9F300]">
                            + {skill}
                        </button>
                    ))}
                </div>
            )}
            {fromCv.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">From your CV:</span>
                    {fromCv.map((skill) => (
                        <button key={skill} type="button" onClick={() => add(skill)} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs transition-colors hover:border-[#9EFF00] hover:text-[#C9F300]">
                            + {skill}
                        </button>
                    ))}
                    {fromCv.length > 1 && (
                        <button
                            type="button"
                            onClick={() => onChange(fromCv.reduce((list, skill) => (list.length < MAX_SKILLS ? addSkill(list, skill) : list), skills))}
                            className="text-xs font-medium text-[#C9F300] underline-offset-4 hover:underline"
                        >
                            Add all
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// The profile behind Industry Insights. `mode` is "onboarding" the first
// time and "edit" afterwards; the fields are the same.
const ProfileForm = ({ mode = "onboarding", defaults }) => {
    const router = useRouter();
    const editing = mode === "edit";
    const initial = useMemo(() => {
        const { industry, subIndustry } = splitIndustrySlug(defaults.industry);
        return {
            industry,
            subIndustry,
            country: defaults.country ?? undefined,
            experience: defaults.experience == null ? "" : String(defaults.experience),
            skills: defaults.skills ?? [],
            bio: defaults.bio ?? "",
        };
    }, [defaults]);

    const [values, setValues] = useState(initial);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const formRef = useRef(null);
    const set = (field) => (value) => {
        setValues((current) => ({ ...current, ...(field === "industry" ? { industry: value, subIndustry: undefined } : { [field]: value }) }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    };

    const dirty = JSON.stringify(values) !== JSON.stringify(initial);
    const field = industries.find((industry) => industry.id === values.industry);
    const country = countryByCode(values.country);
    // Changing industry or country means new insights to write, which takes a few seconds.
    const newMarket = !editing || industrySlug(values.industry ?? "", values.subIndustry ?? "") !== defaults.industry || values.country !== defaults.country;

    // Leaving with unsaved changes asks first.
    useEffect(() => {
        if (!editing || !dirty || saving) return;
        const warn = (event) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [editing, dirty, saving]);

    const submit = async (event) => {
        event.preventDefault();
        const parsed = profileSchema.safeParse(values);
        if (!parsed.success) {
            const next = {};
            for (const issue of parsed.error.issues) next[issue.path[0]] ??= issue.message;
            setErrors(next);
            // Take them to the first thing to fix.
            const first = ["industry", "subIndustry", "country", "experience", "skills", "bio"].find((name) => next[name]);
            formRef.current?.querySelector(`#${first}`)?.focus();
            return;
        }

        setSaving(true);
        // The progress replaces the form, so bring it into view.
        if (newMarket) window.scrollTo({ top: 0, behavior: "smooth" });
        try {
            const result = await updateUser(parsed.data);
            if (result.error) throw new Error(result.error);
            if (result.notice) toast(result.notice);
            else toast.success(editing ? "Profile updated." : "You're all set. Here's your market.");
            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            toast.error(error.message || "Couldn't save your profile. Please try again.");
            setSaving(false);
        }
    };

    if (saving && newMarket) {
        return (
            <div className="flex min-h-96 items-center justify-center rounded-3xl border border-white/10 bg-card p-8">
                <StagedProgress
                    title={editing ? "Updating your market" : "Setting up your insights"}
                    steps={["Saving your profile", `Estimating salaries${country ? ` in ${country.name}` : ""}`, "Ranking the skills employers ask for"]}
                    expectedMs={9000}
                />
            </div>
        );
    }

    return (
        <form ref={formRef} onSubmit={submit} noValidate className="space-y-8">
            <div className="space-y-6 rounded-3xl border border-white/10 bg-card p-5 sm:p-8">
                <div className="grid gap-6 sm:grid-cols-2">
                    <Field id="industry" label="Industry" error={errors.industry}>
                        <Select value={values.industry} onValueChange={set("industry")}>
                            <SelectTrigger id="industry" className="h-11 w-full" aria-invalid={Boolean(errors.industry) || undefined}>
                                <SelectValue placeholder="Choose an industry" />
                            </SelectTrigger>
                            <SelectContent>
                                {industries.map((industry) => (
                                    <SelectItem key={industry.id} value={industry.id}>
                                        {industry.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field id="subIndustry" label="Specialization" hint={!field ? "Choose an industry first" : undefined} error={errors.subIndustry}>
                        <Select value={values.subIndustry} onValueChange={set("subIndustry")} disabled={!field}>
                            <SelectTrigger id="subIndustry" className="h-11 w-full" aria-invalid={Boolean(errors.subIndustry) || undefined}>
                                <SelectValue placeholder="Choose a specialization" />
                            </SelectTrigger>
                            <SelectContent>
                                {field?.subIndustries.map((sub) => (
                                    <SelectItem key={sub} value={sub}>
                                        {sub}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field id="country" label="Where you work" hint="Salaries are shown for this job market, in its currency." error={errors.country}>
                        <Select value={values.country} onValueChange={set("country")}>
                            <SelectTrigger id="country" className="h-11 w-full" aria-invalid={Boolean(errors.country) || undefined}>
                                <SelectValue placeholder="Choose a country" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                                {countries.map((option) => (
                                    <SelectItem key={option.code} value={option.code}>
                                        {option.name} <span className="text-muted-foreground">· {option.currency}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field id="experience" label="Years of experience" hint="Use 0 if you're a student or just starting." error={errors.experience}>
                        <Input
                            id="experience"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={50}
                            value={values.experience}
                            onChange={(event) => set("experience")(event.target.value)}
                            aria-invalid={Boolean(errors.experience) || undefined}
                            placeholder="e.g. 2"
                            className="h-11"
                        />
                    </Field>
                </div>

                <Field
                    id="skills"
                    label={`Your skills${values.skills.length ? ` (${values.skills.length})` : ""}`}
                    hint="These are compared with what employers in your market ask for."
                    error={errors.skills}
                >
                    <SkillsInput id="skills" skills={values.skills} onChange={set("skills")} cvSkills={defaults.cvSkills ?? []} invalid={Boolean(errors.skills)} />
                </Field>

                <Field id="bio" label="About you (optional)" hint={`${values.bio.length}/500. Used to tailor suggestions elsewhere in the app.`} error={errors.bio}>
                    <Textarea
                        id="bio"
                        value={values.bio}
                        onChange={(event) => set("bio")(event.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="A line or two about what you do and what you're aiming for."
                    />
                </Field>
            </div>

            <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
                {editing && (
                    <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-white">
                        Cancel
                    </Link>
                )}
                <button
                    type="submit"
                    disabled={saving || (editing && !dirty)}
                    className={cn(
                        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#9EFF00] px-8 font-semibold text-black shadow-[0_0_40px_-14px_#9EFF00] transition-all duration-200 sm:w-auto",
                        "hover:-translate-y-0.5 hover:bg-[#b4ff33] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
                    )}
                >
                    {saving ? "Saving…" : editing ? "Save changes" : "Show my insights"}
                    {!saving && <ArrowRight className="size-4" />}
                </button>
            </div>
        </form>
    );
};

export default ProfileForm;
