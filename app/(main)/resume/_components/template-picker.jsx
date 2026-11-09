"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createResume } from "@/actions/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TEMPLATE_LIST } from "@/lib/resume/templates";
import { TemplateThumbnail } from "./template-thumbnail";

const FILTERS = [
    { id: "all", label: "All" },
    { id: "tech", label: "Tech" },
    { id: "academic", label: "Academic" },
    { id: "creative", label: "Creative" },
    { id: "students", label: "Students" },
];

const DEFAULT_TITLES = {
    developer: "Software Engineer CV",
    academic: "Research CV",
    creative: "Portfolio CV",
    graduate: "Graduate CV",
};

const TemplatePicker = ({ resumes }) => {
    const router = useRouter();
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState("developer");
    const [title, setTitle] = useState(DEFAULT_TITLES.developer);
    const [titleEdited, setTitleEdited] = useState(false);
    const [copyFrom, setCopyFrom] = useState("none");
    const [creating, setCreating] = useState(false);

    const visible = TEMPLATE_LIST.filter((template) => filter === "all" || template.audience === filter);
    const chosen = TEMPLATE_LIST.find((template) => template.id === selected);

    const choose = (id) => {
        setSelected(id);
        if (!titleEdited) setTitle(DEFAULT_TITLES[id]);
    };

    const create = async () => {
        setCreating(true);
        try {
            const { id } = await createResume({
                title,
                templateId: selected,
                copyFromId: copyFrom === "none" ? null : copyFrom,
            });
            router.push(`/resume/${id}`);
        } catch (error) {
            toast.error(error.message);
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter templates">
                {FILTERS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        aria-pressed={filter === item.id}
                        onClick={() => setFilter(item.id)}
                        className={cn(
                            "h-9 rounded-full border px-4 text-sm font-medium transition-colors",
                            filter === item.id ? "border-white bg-white text-black" : "border-neutral-700 hover:border-neutral-500"
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {visible.map((template) => {
                    const active = template.id === selected;
                    return (
                        <button
                            key={template.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => choose(template.id)}
                            className={cn(
                                "flex flex-col overflow-hidden rounded-xl bg-card text-left transition-colors",
                                active ? "border-2 border-[#9EFF00]" : "border hover:border-neutral-500"
                            )}
                        >
                            <span className="relative flex h-64 w-full items-end justify-center bg-neutral-800 pt-6">
                                {active && (
                                    <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-[#9EFF00] text-black">
                                        <Check className="size-4" strokeWidth={3} />
                                    </span>
                                )}
                                <TemplateThumbnail templateId={template.id} accent={template.theme.accent} className="h-56 w-44" />
                            </span>
                            <span className="flex flex-col gap-2 p-4">
                                <span className="text-lg font-bold">{template.name}</span>
                                <span className="text-sm leading-relaxed text-muted-foreground">{template.description}</span>
                                <span className="mt-1 flex flex-wrap gap-1.5 text-xs">
                                    <span className="rounded-full bg-neutral-800 px-2 py-0.5">{template.pages}</span>
                                    <span
                                        className={cn(
                                            "rounded-full px-2 py-0.5",
                                            template.atsSafe ? "bg-[#9EFF00]/10 text-[#C9F300]" : "bg-amber-400/10 text-amber-300"
                                        )}
                                    >
                                        {template.atsSafe ? "ATS-safe" : "Plain copy included"}
                                    </span>
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <p className="text-sm text-muted-foreground">
                Coming later: Career changer, Bangladesh format, Industry + research, Classic professional.
            </p>

            <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 md:flex-row md:items-end">
                <div className="flex-1 space-y-2 md:max-w-md">
                    <Label htmlFor="cv-name">CV name</Label>
                    <Input
                        id="cv-name"
                        value={title}
                        maxLength={80}
                        onChange={(event) => {
                            setTitle(event.target.value);
                            setTitleEdited(true);
                        }}
                    />
                </div>
                {resumes.length > 0 && (
                    <div className="space-y-2 md:w-64">
                        <Label htmlFor="copy-from">Start from</Label>
                        <Select value={copyFrom} onValueChange={setCopyFrom}>
                            <SelectTrigger id="copy-from" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">A blank CV</SelectItem>
                                {resumes.map((resume) => (
                                    <SelectItem key={resume.id} value={resume.id}>
                                        A copy of &quot;{resume.title}&quot;
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="flex gap-2 md:ml-auto">
                    <Button variant="outline" asChild>
                        <Link href="/resume">Cancel</Link>
                    </Button>
                    <Button onClick={create} disabled={creating || !title.trim()}>
                        {creating && <Loader2 className="animate-spin" />}
                        Create with {chosen?.shortName}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TemplatePicker;
