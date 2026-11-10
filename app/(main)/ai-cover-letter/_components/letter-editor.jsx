"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    AlertCircle,
    Check,
    ChevronDown,
    ChevronLeft,
    CircleDashed,
    Copy,
    Download,
    FileText,
    Loader2,
    Pencil,
    RefreshCw,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { rewriteCoverLetter, updateCoverLetter } from "@/actions/cover-letter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { countWords, findPlaceholders, LENGTHS, lengthVerdict, letterFileName, REWRITES, TONES } from "@/lib/cover-letter/letter";
import { cn } from "@/lib/utils";

const SAVE_AFTER_MS = 900;

function SaveStatus({ state, onRetry }) {
    if (state === "error") {
        return (
            <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:underline">
                <AlertCircle className="size-4" /> Not saved. Try again
            </button>
        );
    }
    return (
        <span role="status" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            {state === "saved" ? <Check className="size-4 text-[#9EFF00]" /> : <Loader2 className="size-4 animate-spin" />}
            {state === "saved" ? "Saved" : "Saving…"}
        </span>
    );
}

function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DetailsDialog({ open, details, onClose, onSave }) {
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSaving(true);
        const message = await onSave({ companyName: form.get("companyName"), jobTitle: form.get("jobTitle"), hiringManager: form.get("hiringManager") });
        setSaving(false);
        setError(message);
    };

    return (
        <AlertDialog open={open} onOpenChange={(next) => !next && (setError(null), onClose())}>
            <AlertDialogContent>
                <form onSubmit={submit} className="space-y-4">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Job details</AlertDialogTitle>
                        <AlertDialogDescription>These go in the letter&apos;s heading. Change the greeting in the letter itself.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="details-company">Company</Label>
                        <Input id="details-company" name="companyName" defaultValue={details.companyName} maxLength={120} autoFocus />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="details-title">Job title</Label>
                        <Input id="details-title" name="jobTitle" defaultValue={details.jobTitle} maxLength={120} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="details-manager">
                            Addressed to <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Input id="details-manager" name="hiringManager" defaultValue={details.hiringManager ?? ""} maxLength={120} />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="animate-spin" />} Save
                        </Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// What the job asks for, and where the CV shows it. Gaps are said plainly,
// with what to do about them, rather than papered over in the letter.
function JobMatch({ requirements, resumeId }) {
    if (!requirements.length) return null;
    const shown = requirements.filter((item) => item.evidence).length;

    return (
        <section aria-labelledby="match-heading" className="space-y-4 rounded-3xl border border-white/10 bg-card p-5">
            <div className="space-y-1">
                <h2 id="match-heading" className="font-semibold">
                    What the job asks for
                </h2>
                <p className="text-sm text-muted-foreground">
                    Your CV shows {shown} of the {requirements.length} main requirements.
                </p>
            </div>
            <ul className="space-y-3">
                {requirements.map((item) => (
                    <li key={item.requirement} className="flex gap-2.5 text-sm">
                        {item.evidence ? (
                            <Check className="mt-0.5 size-4 shrink-0 text-[#9EFF00]" aria-label="Shown on your CV" />
                        ) : (
                            <CircleDashed className="mt-0.5 size-4 shrink-0 text-amber-300" aria-label="Not on your CV" />
                        )}
                        <div className="space-y-0.5">
                            <p className="font-medium">{item.requirement}</p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                {item.evidence ?? "Not on your CV, so the letter doesn't claim it. If you do have it, add it to the letter and your CV."}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
            {resumeId && shown < requirements.length && (
                <Link href={`/resume/${resumeId}`} className="inline-flex items-center gap-1 text-sm text-[#C9F300] underline-offset-4 hover:underline">
                    <FileText className="size-4" /> Open the CV
                </Link>
            )}
        </section>
    );
}

const LetterEditor = ({ letter, sender, resume }) => {
    const [content, setContent] = useState(letter.content);
    const [details, setDetails] = useState({ companyName: letter.companyName, jobTitle: letter.jobTitle, hiringManager: letter.hiringManager });
    const [saveState, setSaveState] = useState("saved");
    const [rewriting, setRewriting] = useState(null);
    const [editingDetails, setEditingDetails] = useState(false);
    const [pendingExport, setPendingExport] = useState(null);
    const [exporting, setExporting] = useState(false);
    const savedRef = useRef(letter.content);
    const textareaRef = useRef(null);
    const timerRef = useRef(null);

    const placeholders = findPlaceholders(content);
    const words = countWords(content);
    const verdict = lengthVerdict(words);
    const date = format(new Date(), "d MMMM yyyy");
    const recipient = [details.hiringManager, details.companyName].filter(Boolean);

    const save = useCallback(async (text) => {
        clearTimeout(timerRef.current);
        if (text === savedRef.current) return setSaveState("saved");
        setSaveState("saving");
        try {
            const result = await updateCoverLetter(letter.id, { content: text });
            if (result.error) throw new Error(result.error);
            savedRef.current = text;
            setSaveState((state) => (state === "saving" ? "saved" : state));
        } catch (error) {
            setSaveState("error");
            toast.error(error.message || "Couldn't save your changes. Check your connection.");
        }
    }, [letter.id]);

    const edit = (text) => {
        setContent(text);
        setSaveState("saving");
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => save(text), SAVE_AFTER_MS);
    };

    // Grows with the letter, so the page scrolls rather than a small box.
    useLayoutEffect(() => {
        const area = textareaRef.current;
        if (!area) return;
        area.style.height = "auto";
        area.style.height = `${area.scrollHeight}px`;
    }, [content]);

    // Ctrl/Cmd+S saves straight away, and leaving with unsaved edits asks first.
    useEffect(() => {
        const onKey = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
                event.preventDefault();
                save(textareaRef.current?.value ?? "");
            }
        };
        const onLeave = (event) => {
            if (textareaRef.current && textareaRef.current.value !== savedRef.current) event.preventDefault();
        };
        window.addEventListener("keydown", onKey);
        window.addEventListener("beforeunload", onLeave);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("beforeunload", onLeave);
        };
    }, [save]);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const selectPlaceholder = (placeholder) => {
        const area = textareaRef.current;
        if (!area) return;
        area.focus();
        area.setSelectionRange(placeholder.start, placeholder.end);
        // Selecting doesn't scroll the page to it, since the box itself never scrolls.
        const lines = content.slice(0, placeholder.start).split("\n").length;
        const lineHeight = parseFloat(getComputedStyle(area).lineHeight) || 24;
        window.scrollTo({ top: area.getBoundingClientRect().top + window.scrollY + lines * lineHeight - window.innerHeight / 2, behavior: "smooth" });
    };

    const nextPlaceholder = () => {
        const caret = textareaRef.current?.selectionEnd ?? 0;
        selectPlaceholder(placeholders.find((placeholder) => placeholder.start >= caret) ?? placeholders[0]);
    };

    const rewrite = async (mode) => {
        if (rewriting) return;
        setRewriting(mode);
        const before = content;
        try {
            const result = await rewriteCoverLetter(letter.id, mode, before);
            if (result.error) return toast.error(result.error);
            if (textareaRef.current?.value !== before) return toast("You kept typing, so that change wasn't applied. Try again when you're ready.");
            edit(result.content);
            toast.success(REWRITES[mode].done, {
                duration: 10000,
                action: { label: "Undo", onClick: () => edit(before) },
            });
        } catch {
            toast.error("Couldn't make that change just now. Your letter hasn't changed.");
        } finally {
            setRewriting(null);
        }
    };

    const saveDetails = async (values) => {
        const result = await updateCoverLetter(letter.id, { details: values });
        if (result.error) return result.error;
        setDetails({ companyName: values.companyName.trim(), jobTitle: values.jobTitle.trim(), hiringManager: values.hiringManager?.trim() || null });
        setEditingDetails(false);
        toast.success("Job details updated");
        return null;
    };

    const fullText = () => [sender.name, [sender.email, sender.phone, sender.location].filter(Boolean).join(" · "), "", date, "", ...recipient, "", content].filter((line, index, all) => line !== "" || all[index - 1] !== "").join("\n").trim();
    const fileInfo = { ...details, name: sender.name };

    const exports = {
        copy: async () => {
            try {
                await navigator.clipboard.writeText(content);
                toast.success("Copied. Paste it into the application form or an email.");
            } catch {
                toast.error("Couldn't copy. Select the text and copy it yourself.");
            }
        },
        text: () => download(new Blob([fullText()], { type: "text/plain;charset=utf-8" }), letterFileName(fileInfo, "txt")),
        pdf: async () => {
            setExporting(true);
            try {
                const { renderCoverLetter } = await import("@/lib/cover-letter/pdf");
                const blob = await renderCoverLetter({ sender, recipient, date, content, theme: resume?.theme, title: `Cover letter: ${details.jobTitle} at ${details.companyName}` });
                download(blob, letterFileName(fileInfo, "pdf"));
            } catch (error) {
                console.error(error);
                toast.error("Couldn't make the PDF. Try again, or download it as text.");
            } finally {
                setExporting(false);
            }
        },
    };

    // Sending a letter with "[a project you led]" still in it is the one
    // mistake that really costs, so check before it leaves.
    const exportAs = (kind) => (placeholders.length ? setPendingExport(kind) : exports[kind]());

    const busy = Boolean(rewriting);

    return (
        <div className="mx-auto max-w-6xl space-y-6 pt-4 pb-16">
            <div className="space-y-4">
                <Link href="/ai-cover-letter" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-white">
                    <ChevronLeft className="size-4" /> Cover Letters
                </Link>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold gradient-title text-[#F4F4F5] md:text-4xl">{details.jobTitle}</h1>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                            <span className="text-[#C9F300]">{details.companyName}</span>
                            <button type="button" onClick={() => setEditingDetails(true)} className="inline-flex items-center gap-1 text-sm transition-colors hover:text-white">
                                <Pencil className="size-3.5" /> Edit details
                            </button>
                            <SaveStatus state={saveState} onRetry={() => save(content)} />
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:flex">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={busy} className="rounded-full px-3">
                                    {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ? "Rewriting…" : "Improve"} <ChevronDown className="hidden opacity-60 sm:block" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60">
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">You can undo any of these</DropdownMenuLabel>
                                {Object.entries(REWRITES).map(([mode, option]) => (
                                    <DropdownMenuItem key={mode} onSelect={() => rewrite(mode)}>
                                        {option.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" className="rounded-full px-3" onClick={() => exportAs("copy")}>
                            <Copy /> Copy
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={exporting} className="rounded-full bg-[#9EFF00] px-3 text-black hover:bg-[#b4ff33]">
                                    {exporting ? <Loader2 className="animate-spin" /> : <Download />} Download <ChevronDown className="hidden opacity-60 sm:block" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => exportAs("pdf")}>PDF{resume ? ", matching your CV" : ""}</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => exportAs("text")}>Plain text (.txt)</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-3">
                    {placeholders.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/[0.05] px-4 py-3 text-sm">
                            <span>
                                <span className="font-semibold text-amber-200">
                                    {placeholders.length} {placeholders.length === 1 ? "detail" : "details"} to fill in.
                                </span>{" "}
                                <span className="text-muted-foreground">Your CV didn&apos;t say, so they&apos;re left in [brackets] rather than made up.</span>
                            </span>
                            <button type="button" onClick={nextPlaceholder} className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-200 transition-colors hover:bg-amber-300/10">
                                Go to next
                            </button>
                        </div>
                    )}

                    {/* Edited on a page that looks like the one being sent. */}
                    <div className="relative rounded-2xl bg-[#FAFAF7] px-6 py-8 text-neutral-900 shadow-[0_30px_80px_-40px_rgba(158,255,0,0.35)] sm:px-12 sm:py-12">
                        <div className="mb-6 border-b-2 pb-3" style={{ borderColor: resume?.theme?.accent ?? "#1F6FEB" }}>
                            <p className="text-xl font-bold">{sender.name || "Your name"}</p>
                            <p className="text-sm text-neutral-500">{[sender.email, sender.phone, sender.location].filter(Boolean).join("  ·  ")}</p>
                        </div>
                        <p suppressHydrationWarning className="mb-4 text-sm text-neutral-500">
                            {date}
                        </p>
                        <div className="mb-6 text-[15px]">
                            {recipient.map((line) => (
                                <p key={line}>{line}</p>
                            ))}
                        </div>
                        <label htmlFor="letter-body" className="sr-only">
                            Your letter
                        </label>
                        <textarea
                            id="letter-body"
                            ref={textareaRef}
                            value={content}
                            onChange={(event) => edit(event.target.value)}
                            readOnly={busy}
                            spellCheck
                            rows={12}
                            className={cn(
                                "block w-full resize-none overflow-hidden bg-transparent text-[15px] leading-7 outline-none selection:bg-[#9EFF00]/60 transition-opacity",
                                busy && "opacity-40"
                            )}
                        />
                        {busy && (
                            <div className="absolute inset-0 flex items-center justify-center" role="status">
                                <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white">
                                    <Loader2 className="size-4 animate-spin text-[#9EFF00]" /> {REWRITES[rewriting].label}…
                                </span>
                            </div>
                        )}
                    </div>

                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="tabular-nums">{words} words</span>
                        <span aria-hidden="true">·</span>
                        <span className={cn(verdict.tone === "good" ? "text-[#C9F300]" : "text-amber-300")}>{verdict.label}</span>
                        <span aria-hidden="true" className="hidden sm:inline">
                            ·
                        </span>
                        <span className="hidden sm:inline">Saves as you type. Leave a blank line between paragraphs.</span>
                    </p>
                </div>

                <aside className="space-y-4 lg:sticky lg:top-28">
                    <JobMatch requirements={letter.requirements ?? []} resumeId={resume ? letter.resumeId : null} />

                    {letter.jobDescription && (
                        <details className="group rounded-3xl border border-white/10 bg-card p-5">
                            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                                The job description <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                            </summary>
                            <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{letter.jobDescription}</p>
                        </details>
                    )}

                    <section className="space-y-3 rounded-3xl border border-white/10 bg-card p-5 text-sm">
                        <p className="text-muted-foreground">
                            Written from <span className="text-white">{resume ? resume.title : "your profile"}</span>, {TONES[letter.tone]?.label.toLowerCase() ?? "confident"} and{" "}
                            {LENGTHS[letter.length]?.label.toLowerCase() ?? "standard"} length.
                        </p>
                        <Link href={`/ai-cover-letter/new?from=${letter.id}`} className="inline-flex items-center gap-1.5 text-[#C9F300] underline-offset-4 hover:underline">
                            <RefreshCw className="size-4" /> Write a new version
                        </Link>
                        <p className="text-xs text-muted-foreground">Starts a separate letter with these details, so this one stays as it is.</p>
                    </section>
                </aside>
            </div>

            <DetailsDialog open={editingDetails} details={details} onClose={() => setEditingDetails(false)} onSave={saveDetails} />

            <AlertDialog open={!!pendingExport} onOpenChange={(open) => !open && setPendingExport(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {placeholders.length} {placeholders.length === 1 ? "detail is" : "details are"} still in [brackets]
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {placeholders.map((placeholder) => placeholder.text).join(", ")}. {placeholders.length === 1 ? "Fill it in or delete it, or an employer will see it as it is." : "Fill them in or delete them, or an employer will see them as they are."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                const kind = pendingExport;
                                setPendingExport(null);
                                exports[kind]();
                            }}
                        >
                            {pendingExport === "copy" ? "Copy anyway" : "Download anyway"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setPendingExport(null);
                                setTimeout(() => selectPlaceholder(placeholders[0]), 50);
                            }}
                            className="bg-[#9EFF00] text-black hover:bg-[#b4ff33]"
                        >
                            {placeholders.length === 1 ? "Fill it in" : "Fill them in"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default LetterEditor;
