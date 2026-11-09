"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GROUP_NAME_SUGGESTIONS } from "@/lib/resume/skill-suggestions";
import ListInput from "./list-input";
import SkillPicker from "./skill-picker";

// What each section type asks for. `wide` fields span both columns.
const FIELDS = {
    experience: [
        { name: "role", label: "Role", placeholder: "Software Engineer Intern" },
        { name: "organisation", label: "Organisation" },
        { name: "start", label: "Start", kind: "month" },
        { name: "end", label: "End", kind: "month", disabledBy: "current" },
        { name: "location", label: "Location", placeholder: "Dhaka" },
        { name: "current", label: "I work here now", kind: "checkbox" },
        { name: "bullets", label: "Bullet points", kind: "list", ai: true, placeholder: "What you did and what came of it" },
    ],
    education: [
        { name: "degree", label: "Degree", placeholder: "BSc in Computer Science and Engineering" },
        { name: "institution", label: "Institution" },
        { name: "start", label: "Start", kind: "month" },
        { name: "end", label: "End", kind: "month" },
        { name: "location", label: "Location" },
        { name: "result", label: "Result", placeholder: "CGPA 3.80 / 4.00" },
        { name: "thesis", label: "Thesis", wide: true },
        { name: "highlights", label: "Highlights", kind: "list" },
    ],
    projects: [
        { name: "name", label: "Project name" },
        { name: "role", label: "Your role", placeholder: "Team project, Solo project…" },
        { name: "link", label: "Link", placeholder: "github.com/you/project" },
        { name: "tech", label: "Built with", kind: "tags", context: "frameworks tools databases", placeholder: "Next.js, PostgreSQL" },
        { name: "start", label: "Start", kind: "month" },
        { name: "end", label: "End", kind: "month" },
        { name: "bullets", label: "Bullet points", kind: "list", ai: true },
    ],
    skills: [
        { name: "group", label: "Group", placeholder: "Languages", options: GROUP_NAME_SUGGESTIONS },
        { name: "keywords", label: "Skills", kind: "tags", contextFrom: "group", placeholder: "Start typing, or pick a suggestion" },
    ],
    publications: [
        { name: "authors", label: "Authors", wide: true, placeholder: "A. Rahman, Y. Name, B. Karim" },
        { name: "title", label: "Title", wide: true },
        { name: "venue", label: "Journal or conference" },
        { name: "year", label: "Year", placeholder: "2025" },
        {
            name: "kind",
            label: "Type",
            kind: "select",
            options: [
                ["conference", "Conference paper"],
                ["journal", "Journal article"],
                ["preprint", "Preprint"],
                ["other", "Other"],
            ],
        },
        {
            name: "status",
            label: "Status",
            kind: "select",
            options: [
                ["published", "Published"],
                ["accepted", "Accepted"],
                ["under-review", "Under review"],
            ],
        },
        { name: "link", label: "DOI or link", wide: true },
    ],
    awards: [
        { name: "name", label: "Award" },
        { name: "issuer", label: "Given by" },
        { name: "date", label: "Date", kind: "month" },
        { name: "link", label: "Link" },
        { name: "note", label: "Note", wide: true },
    ],
    certifications: [
        { name: "name", label: "Certification" },
        { name: "issuer", label: "Issued by" },
        { name: "date", label: "Date", kind: "month" },
        { name: "link", label: "Credential link" },
        { name: "note", label: "Note", wide: true },
    ],
    languages: [
        { name: "language", label: "Language", placeholder: "Bengali" },
        { name: "level", label: "Level", placeholder: "Native" },
    ],
    portfolio: [
        { name: "title", label: "Title" },
        { name: "link", label: "Link", placeholder: "vimeo.com/you/showreel" },
        { name: "note", label: "What it was", wide: true, placeholder: "Brand film · editing, colour" },
    ],
    custom: [
        { name: "title", label: "Title" },
        { name: "subtitle", label: "Subtitle" },
        { name: "start", label: "Start", kind: "month" },
        { name: "end", label: "End", kind: "month" },
        { name: "bullets", label: "Bullet points", kind: "list", ai: true },
    ],
};

// The text used for an entry's collapsed row.
export function itemSummary(type, item) {
    const first = item.role || item.name || item.degree || item.title || item.group || item.language;
    const second = item.organisation || item.institution || item.issuer || item.venue || item.level || item.subtitle;
    return { title: first || "Untitled", detail: second };
}

const ItemFields = ({ type, item, onChange, templateId }) => {
    const baseId = useId();
    const set = (name, value) => onChange({ ...item, [name]: value });

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS[type].map((field) => {
                const id = `${baseId}-${field.name}`;
                const value = item[field.name];

                if (field.kind === "list") {
                    return (
                        <div key={field.name} className="sm:col-span-2">
                            <ListInput
                                label={field.label}
                                values={value}
                                allowAi={field.ai}
                                placeholder={field.placeholder}
                                templateId={templateId}
                                onChange={(lines) => set(field.name, lines)}
                            />
                        </div>
                    );
                }

                if (field.kind === "checkbox") {
                    return (
                        <label key={field.name} className="flex items-center gap-2 self-end pb-2 text-sm">
                            <input
                                type="checkbox"
                                checked={value}
                                onChange={(event) => {
                                    const next = { ...item, [field.name]: event.target.checked };
                                    if (event.target.checked) next.end = "";
                                    onChange(next);
                                }}
                                className="size-4 accent-[#9EFF00]"
                            />
                            {field.label}
                        </label>
                    );
                }

                return (
                    <div key={field.name} className={cn("space-y-1.5", (field.wide || field.kind === "tags") && "sm:col-span-2")}>
                        <Label htmlFor={id}>{field.label}</Label>
                        {field.kind === "select" ? (
                            <Select value={value} onValueChange={(next) => set(field.name, next)}>
                                <SelectTrigger id={id} className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options.map(([optionValue, optionLabel]) => (
                                        <SelectItem key={optionValue} value={optionValue}>
                                            {optionLabel}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : field.kind === "tags" ? (
                            <SkillPicker
                                id={id}
                                values={value}
                                placeholder={field.placeholder}
                                context={field.contextFrom ? item[field.contextFrom] : field.context}
                                onChange={(list) => set(field.name, list)}
                            />
                        ) : (
                            <Input
                                id={id}
                                type={field.kind === "month" ? "month" : "text"}
                                value={value}
                                maxLength={field.kind === "month" ? undefined : 300}
                                placeholder={field.placeholder}
                                list={field.options ? `${id}-options` : undefined}
                                disabled={field.disabledBy ? item[field.disabledBy] : false}
                                onChange={(event) => set(field.name, event.target.value)}
                                className={field.kind === "month" ? "[color-scheme:dark]" : undefined}
                            />
                        )}
                        {field.options && field.kind !== "select" && (
                            <datalist id={`${id}-options`}>
                                {field.options.map((option) => (
                                    <option key={option} value={option} />
                                ))}
                            </datalist>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ItemFields;
