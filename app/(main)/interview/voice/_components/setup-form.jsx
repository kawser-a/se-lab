"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { startVoiceInterview } from "@/actions/voice-interview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTERVIEW_TYPES, LENGTHS, LEVELS } from "@/lib/interview/config";
import { cn } from "@/lib/utils";

const ROLE_SUGGESTIONS = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Mobile App Developer",
    "QA Engineer",
    "Data Analyst",
    "Data Scientist",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Product Manager",
    "UI/UX Designer",
    "Business Analyst",
    "Digital Marketing Executive",
    "Research Assistant",
];

const MAX_FOCUS = 5;

function OptionGroup({ label, name, options, value, onChange, columns = "sm:grid-cols-3" }) {
    return (
        <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">{label}</legend>
            <div className={cn("grid gap-2", columns)} role="radiogroup">
                {Object.entries(options).map(([id, option]) => {
                    const active = String(value) === String(id);
                    return (
                        <label
                            key={id}
                            className={cn(
                                "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#9EFF00]",
                                active ? "border-[#9EFF00] bg-[#9EFF00]/5" : "hover:border-neutral-500"
                            )}
                        >
                            <input type="radio" name={name} value={id} checked={active} onChange={() => onChange(id)} className="sr-only" />
                            <span className={cn("font-semibold", active && "text-[#C9F300]")}>{option.label}</span>
                            <span className="text-xs leading-relaxed text-muted-foreground">{option.description ?? option.minutes}</span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}

const SetupForm = ({ defaults }) => {
    const router = useRouter();
    const [role, setRole] = useState(defaults.role);
    const [type, setType] = useState("mixed");
    const [level, setLevel] = useState(defaults.level);
    const [questionCount, setQuestionCount] = useState("5");
    const [focus, setFocus] = useState([]);
    const [focusDraft, setFocusDraft] = useState("");
    const [starting, setStarting] = useState(false);

    const addFocus = (topic) => {
        const clean = topic.trim().slice(0, 40);
        if (!clean || focus.length >= MAX_FOCUS || focus.some((item) => item.toLowerCase() === clean.toLowerCase())) return;
        setFocus([...focus, clean]);
        setFocusDraft("");
    };

    const submit = async (event) => {
        event.preventDefault();
        setStarting(true);
        try {
            const result = await startVoiceInterview({ role, type, level, questionCount, focus });
            if (result.error) throw new Error(result.error);
            router.push(`/interview/voice/${result.id}`);
        } catch (error) {
            toast.error(error.message || "Couldn't start the interview. Please try again.");
            setStarting(false);
        }
    };

    const suggestions = defaults.skills.filter((skill) => !focus.includes(skill));

    return (
        <form onSubmit={submit} className="space-y-8 rounded-2xl border bg-card p-5 sm:p-8">
            <div className="space-y-2">
                <Label htmlFor="role">Role you&apos;re preparing for</Label>
                <Input
                    id="role"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    list="role-suggestions"
                    maxLength={80}
                    required
                    placeholder="e.g. Frontend Developer"
                    className="h-11"
                />
                <datalist id="role-suggestions">
                    {ROLE_SUGGESTIONS.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                    ))}
                </datalist>
            </div>

            <OptionGroup label="Interview type" name="type" options={INTERVIEW_TYPES} value={type} onChange={setType} />
            <OptionGroup label="Level" name="level" options={LEVELS} value={level} onChange={setLevel} />
            <OptionGroup label="Length" name="length" options={Object.fromEntries(Object.entries(LENGTHS).map(([count, option]) => [count, { label: `${option.label}, ${count} questions`, minutes: option.minutes }]))} value={questionCount} onChange={setQuestionCount} />

            <div className="space-y-2">
                <Label htmlFor="focus">
                    Topics to practise <span className="font-normal text-muted-foreground">(optional, up to {MAX_FOCUS})</span>
                </Label>
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
                    <div className="flex gap-2">
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
                            className="h-11"
                        />
                        <Button type="button" variant="outline" className="h-11" onClick={() => addFocus(focusDraft)} disabled={!focusDraft.trim()}>
                            <Plus /> Add
                        </Button>
                    </div>
                )}
                {suggestions.length > 0 && focus.length < MAX_FOCUS && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-xs text-muted-foreground">From your profile:</span>
                        {suggestions.map((skill) => (
                            <button key={skill} type="button" onClick={() => addFocus(skill)} className="rounded-full border px-2.5 py-0.5 text-xs hover:border-[#9EFF00] hover:text-[#C9F300]">
                                + {skill}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">Works best in Chrome, Edge or Safari, in a quiet room.</p>
                <Button type="submit" size="lg" className="h-12" disabled={starting || role.trim().length < 2}>
                    {starting && <Loader2 className="animate-spin" />}
                    {starting ? "Preparing your questions" : "Start interview"}
                </Button>
            </div>
        </form>
    );
};

export default SetupForm;
