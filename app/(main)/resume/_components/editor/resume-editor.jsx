"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertCircle, Check, ChevronDown, ChevronLeft, Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { suggestSummary, updateResume } from "@/actions/resume";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { resumeDataSchema, resumeThemeSchema, resumeTitleSchema } from "@/lib/resume/schema";
import { SECTION_META, emptySection } from "@/lib/resume/sections";
import { TEMPLATES } from "@/lib/resume/templates";
import BasicsCard from "./basics-card";
import SectionCard, { move } from "./section-card";
import StylePanel from "./style-panel";

// react-pdf and pdf.js only run in the browser.
const PdfPreview = dynamic(() => import("./pdf-preview"), {
    ssr: false,
    loading: () => (
        <div className="flex aspect-[1/1.414] w-full max-w-[720px] items-center justify-center rounded-sm bg-white/5">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
    ),
});

const PLAIN_THEME = { templateId: "developer", fontPair: "inter", accent: "#374151" };

function fileName(name, title) {
    return `${[name, title].filter(Boolean).join(" ")}`.replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "") + ".pdf";
}

function firstIssue(...results) {
    const failed = results.find((result) => !result.success);
    return failed?.error.issues[0]?.message;
}

const VIEWS = [
    ["content", "Content"],
    ["style", "Style"],
    ["preview", "Preview"],
];

const ResumeEditor = ({ resume }) => {
    const [title, setTitle] = useState(resume.title);
    const [data, setData] = useState(resume.data);
    const [theme, setTheme] = useState(resume.theme);
    const [view, setView] = useState("content");
    const [openSection, setOpenSection] = useState("basics");
    const [saveState, setSaveState] = useState({ status: "saved" });
    const [downloading, setDownloading] = useState(false);

    const template = TEMPLATES[theme.templateId];
    const firstRender = useRef(true);
    const saveRun = useRef(0);

    const save = useCallback(async () => {
        const issue = firstIssue(
            resumeTitleSchema.safeParse(title),
            resumeDataSchema.safeParse(data),
            resumeThemeSchema.safeParse(theme)
        );
        if (issue) {
            setSaveState({ status: "invalid", message: issue });
            return false;
        }

        const run = ++saveRun.current;
        setSaveState({ status: "saving" });
        try {
            await updateResume(resume.id, { title, data, theme });
            if (run === saveRun.current) setSaveState({ status: "saved" });
            return true;
        } catch (error) {
            if (run === saveRun.current) setSaveState({ status: "error", message: error.message });
            return false;
        }
    }, [resume.id, title, data, theme]);

    // Autosave shortly after the last change.
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        setSaveState({ status: "unsaved" });
        const timer = setTimeout(save, 1200);
        return () => clearTimeout(timer);
    }, [save]);

    useEffect(() => {
        const warn = (event) => {
            if (saveState.status !== "saved") event.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [saveState.status]);

    const updateSection = (next) => setData((current) => ({ ...current, sections: current.sections.map((s) => (s.id === next.id ? next : s)) }));

    const moveSection = (index, offset) => setData((current) => ({ ...current, sections: move(current.sections, index, offset) }));

    const removeSection = (id) => setData((current) => ({ ...current, sections: current.sections.filter((s) => s.id !== id) }));

    const addSection = (type) => {
        const section = emptySection(type);
        setData((current) => ({ ...current, sections: [...current.sections, section] }));
        setOpenSection(section.id);
    };

    const draftSummary = async (brief) => {
        // The summary is written from the saved CV, so save first.
        if (!(await save())) throw new Error("Fix the highlighted problem before drafting a summary");
        const result = await suggestSummary(resume.id, brief);
        if (result.error) throw new Error(result.error);
        return result.text;
    };

    const download = async (plain = false) => {
        setDownloading(true);
        try {
            const { closeDocument, downloadBlob, renderResume } = await import("@/lib/resume/pdf/render");
            const result = await renderResume({ data, theme: plain ? { ...theme, ...PLAIN_THEME } : theme, title });
            closeDocument(result.doc);
            downloadBlob(result.blob, fileName(data.basics.name, plain ? `${title} plain` : title));
        } catch (error) {
            console.error("CV download failed:", error);
            toast.error("Couldn't create the PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const usedTypes = new Set(data.sections.map((section) => section.type));
    const panel = view === "style" ? "style" : "content";

    return (
        <div className="pt-4">
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/resume" aria-label="Back to My CVs">
                        <ChevronLeft />
                    </Link>
                </Button>
                <div className="flex min-w-48 flex-1 flex-col">
                    <label htmlFor="cv-title" className="text-xs text-muted-foreground">
                        CV name
                    </label>
                    <input
                        id="cv-title"
                        value={title}
                        maxLength={80}
                        onChange={(event) => setTitle(event.target.value)}
                        className="min-w-0 bg-transparent text-xl font-bold outline-none focus-visible:underline"
                    />
                </div>
                <SaveStatus state={saveState} />
                {template.atsSafe ? (
                    <Button onClick={() => download()} disabled={downloading}>
                        {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                        Download PDF
                    </Button>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={downloading}>
                                {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                                Download PDF
                                <ChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => download()}>{template.shortName} design</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => download(true)}>Plain copy for job portals</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <div role="tablist" aria-label="Editor views" className="mb-5 flex gap-1 rounded-lg bg-card p-1 lg:max-w-md">
                {VIEWS.map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={view === id}
                        onClick={() => setView(id)}
                        className={cn(
                            "h-10 flex-1 rounded-md text-sm transition-colors",
                            id === "preview" && "lg:hidden",
                            view === id ? "bg-neutral-700 font-semibold text-white" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <section
                    aria-label={panel === "style" ? "Style settings" : "CV content"}
                    className={cn("w-full space-y-2 lg:max-w-md lg:shrink-0 xl:max-w-lg", view === "preview" && "hidden lg:block")}
                >
                    {panel === "style" ? (
                        <StylePanel theme={theme} sections={data.sections} onChange={setTheme} />
                    ) : (
                        <>
                            <BasicsCard
                                basics={data.basics}
                                open={openSection === "basics"}
                                onToggle={() => setOpenSection(openSection === "basics" ? null : "basics")}
                                onChange={(basics) => setData((current) => ({ ...current, basics }))}
                            />
                            {data.sections.map((section, index) => (
                                <SectionCard
                                    key={section.id}
                                    section={section}
                                    index={index}
                                    count={data.sections.length}
                                    open={openSection === section.id}
                                    onToggle={() => setOpenSection(openSection === section.id ? null : section.id)}
                                    onChange={updateSection}
                                    onMove={(offset) => moveSection(index, offset)}
                                    onRemove={() => removeSection(section.id)}
                                    templateId={theme.templateId}
                                    headline={data.basics.headline}
                                    onSuggestSummary={draftSummary}
                                />
                            ))}
                            {data.sections.length < 20 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-11 w-full border-dashed">
                                            <Plus /> Add section
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-64">
                                        {Object.entries(SECTION_META).map(([type, meta]) => (
                                            <DropdownMenuItem
                                                key={type}
                                                disabled={type !== "custom" && usedTypes.has(type)}
                                                onSelect={() => addSection(type)}
                                            >
                                                {meta.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </>
                    )}
                </section>

                <section
                    aria-label="Preview"
                    className={cn(
                        "w-full flex-1 rounded-xl bg-neutral-900 p-4 md:p-6 lg:sticky lg:top-28",
                        view !== "preview" && "hidden lg:block"
                    )}
                >
                    {!template.atsSafe && (
                        <p className="mx-auto mb-4 flex max-w-[720px] gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-sm text-amber-200">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                            Two-column designs can confuse hiring software. The download menu also has a plain copy with the same content.
                        </p>
                    )}
                    <PdfPreview data={data} theme={theme} title={title} />
                </section>
            </div>
        </div>
    );
};

function SaveStatus({ state }) {
    if (state.status === "saving") {
        return (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Saving
            </span>
        );
    }
    if (state.status === "unsaved") return <span className="text-sm text-muted-foreground">Unsaved changes</span>;
    if (state.status === "invalid" || state.status === "error") {
        return (
            <span role="alert" className="flex max-w-xs items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {state.status === "invalid" ? `Not saved: ${state.message}` : "Couldn't save. Retrying when you edit again."}
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Check className="size-3.5 text-[#9EFF00]" strokeWidth={3} /> Saved
        </span>
    );
}

export default ResumeEditor;
