"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_META } from "@/lib/resume/sections";
import { ACCENTS, FONT_PAIRS, TEMPLATES, TEMPLATE_LIST, isSectionShown } from "@/lib/resume/templates";
import { TemplateThumbnail } from "../template-thumbnail";

function Group({ legend, children, className }) {
    return (
        <fieldset className={cn("space-y-2.5", className)}>
            <legend className="mb-2.5 text-sm font-semibold">{legend}</legend>
            {children}
        </fieldset>
    );
}

function Segmented({ legend, value, options, onChange }) {
    return (
        <Group legend={legend}>
            <div className="flex rounded-lg border bg-card p-1">
                {options.map(([optionValue, label]) => (
                    <button
                        key={optionValue}
                        type="button"
                        aria-pressed={value === optionValue}
                        onClick={() => onChange(optionValue)}
                        className={cn(
                            "h-9 flex-1 rounded-md text-sm transition-colors",
                            value === optionValue ? "bg-neutral-700 font-semibold text-white" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </Group>
    );
}

function Toggle({ label, hint, checked, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border bg-card px-3 text-left"
        >
            <span className="flex flex-col">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
            </span>
            <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-[#9EFF00]" : "bg-neutral-700")}>
                <span
                    className={cn(
                        "absolute top-[3px] size-[18px] rounded-full transition-all",
                        checked ? "left-[23px] bg-neutral-950" : "left-[3px] bg-white"
                    )}
                />
            </span>
        </button>
    );
}

const StylePanel = ({ theme, sections, onChange }) => {
    const set = (patch) => onChange({ ...theme, ...patch });
    const isPreset = ACCENTS.some((accent) => accent.value.toLowerCase() === theme.accent.toLowerCase());
    const hidden = sections.filter((section) => !isSectionShown(theme.templateId, section.type));

    return (
        <div className="space-y-6">
            <Group legend="Template">
                <div className="grid grid-cols-4 gap-2">
                    {TEMPLATE_LIST.map((template) => {
                        const active = template.id === theme.templateId;
                        return (
                            <button
                                key={template.id}
                                type="button"
                                aria-pressed={active}
                                // Switching template brings its own fonts and colour; size and page settings stay.
                                onClick={() => !active && set({ templateId: template.id, ...template.theme })}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 rounded-lg bg-card px-1.5 pb-2 pt-2.5 text-xs",
                                    active ? "border-2 border-[#9EFF00] font-semibold" : "border text-muted-foreground hover:text-white"
                                )}
                            >
                                <TemplateThumbnail templateId={template.id} accent={template.theme.accent} className="h-20 w-16 gap-1 px-2 pt-2.5" />
                                {template.shortName}
                            </button>
                        );
                    })}
                </div>
            </Group>

            <Group legend="Fonts">
                {Object.entries(FONT_PAIRS).map(([id, pair]) => (
                    <label
                        key={id}
                        className={cn(
                            "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg bg-card px-3",
                            theme.fontPair === id ? "border-2 border-[#9EFF00]" : "border"
                        )}
                    >
                        <input
                            type="radio"
                            name="font-pair"
                            checked={theme.fontPair === id}
                            onChange={() => set({ fontPair: id })}
                            className="accent-[#9EFF00]"
                        />
                        <span className="w-9 text-xl font-bold" style={{ fontFamily: pair.sample }} aria-hidden="true">
                            Aa
                        </span>
                        <span className="text-sm">{pair.label}</span>
                    </label>
                ))}
            </Group>

            <Group legend="Accent colour">
                <div className="flex flex-wrap gap-2">
                    {ACCENTS.map((accent) => {
                        const active = accent.value.toLowerCase() === theme.accent.toLowerCase();
                        return (
                            <button
                                key={accent.value}
                                type="button"
                                aria-label={accent.name}
                                aria-pressed={active}
                                title={accent.name}
                                onClick={() => set({ accent: accent.value })}
                                className={cn(
                                    "flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-background",
                                    active && "ring-2 ring-white"
                                )}
                                style={{ backgroundColor: accent.value }}
                            >
                                {active && <Check className="size-4 text-white" strokeWidth={3} />}
                            </button>
                        );
                    })}
                    <label
                        title="Custom colour"
                        className={cn(
                            "relative flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-neutral-500 ring-offset-2 ring-offset-background",
                            !isPreset && "border-solid ring-2 ring-white"
                        )}
                        style={!isPreset ? { backgroundColor: theme.accent } : undefined}
                    >
                        <span className="sr-only">Custom colour</span>
                        {isPreset && <span aria-hidden="true">+</span>}
                        <input
                            type="color"
                            value={theme.accent}
                            onChange={(event) => set({ accent: event.target.value })}
                            className="absolute inset-0 cursor-pointer opacity-0"
                        />
                    </label>
                </div>
            </Group>

            <div className="grid gap-4 sm:grid-cols-2">
                <Segmented
                    legend="Density"
                    value={theme.density}
                    onChange={(density) => set({ density })}
                    options={[
                        ["compact", "Compact"],
                        ["normal", "Normal"],
                        ["relaxed", "Airy"],
                    ]}
                />
                <Segmented
                    legend="Margins"
                    value={theme.margins}
                    onChange={(margins) => set({ margins })}
                    options={[
                        ["narrow", "Narrow"],
                        ["normal", "Normal"],
                        ["wide", "Wide"],
                    ]}
                />
                <Segmented
                    legend="Page size"
                    value={theme.pageSize}
                    onChange={(pageSize) => set({ pageSize })}
                    options={[
                        ["A4", "A4"],
                        ["LETTER", "Letter"],
                    ]}
                />
                {theme.templateId === "academic" && (
                    <Segmented
                        legend="Citation style"
                        value={theme.citationStyle}
                        onChange={(citationStyle) => set({ citationStyle })}
                        options={[
                            ["ieee", "IEEE"],
                            ["apa", "APA"],
                        ]}
                    />
                )}
            </div>

            <Toggle
                label="Fit to one page"
                hint="Tightens spacing and type, never below 9 pt"
                checked={theme.fitToOnePage}
                onChange={(fitToOnePage) => set({ fitToOnePage })}
            />

            {hidden.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-sm font-semibold">Not shown in {TEMPLATES[theme.templateId].shortName}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {hidden.map((section) => section.title || SECTION_META[section.type].label).join(", ")}{" "}
                        {hidden.length === 1 ? "is" : "are"} kept in your CV but this template doesn&apos;t display{" "}
                        {hidden.length === 1 ? "it" : "them"}. Switch templates to show {hidden.length === 1 ? "it" : "them"} again.
                    </p>
                </div>
            )}
        </div>
    );
};

export default StylePanel;
