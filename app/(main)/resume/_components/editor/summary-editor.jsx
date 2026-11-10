"use client";

import { useRef, useState } from "react";
import { PenLine, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SUMMARY_LEVELS } from "@/lib/resume/summary";
import AiSuggestion from "./ai-suggestion";
import SkillPicker from "./skill-picker";

const MODES = [
    ["write", "Write it myself", PenLine],
    ["assist", "Help me write it", Sparkles],
];

const SummaryEditor = ({ section, headline, onChange, onSuggest }) => {
    const [mode, setMode] = useState(section.content ? "write" : "assist");
    const [brief, setBrief] = useState({ role: headline ?? "", level: "", keywords: [], about: "" });
    const [suggestion, setSuggestion] = useState(null);
    // Bumped on every request and on cancel, so a late reply can't reopen the card.
    const request = useRef(0);

    const setContent = (content) => onChange({ ...section, content });
    const ready = brief.role.trim() || brief.about.trim() || brief.keywords.length > 0;

    const generate = async () => {
        if (!ready) {
            toast.error("Add the role, a few keywords or a line about the job first");
            return;
        }
        const run = ++request.current;
        setSuggestion({ loading: true, text: "" });
        try {
            const text = await onSuggest(brief);
            if (run === request.current) setSuggestion({ loading: false, text });
        } catch (error) {
            if (run !== request.current) return;
            toast.error(error.message);
            setSuggestion(null);
        }
    };

    return (
        <div className="space-y-3">
            <div role="radiogroup" aria-label="How to write the summary" className="grid grid-cols-2 gap-1 rounded-lg border bg-background/40 p-1">
                {MODES.map(([id, label, Icon]) => (
                    <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={mode === id}
                        onClick={() => setMode(id)}
                        className={cn(
                            "flex h-9 items-center justify-center gap-2 rounded-md text-sm transition-colors",
                            mode === id ? "bg-neutral-700 font-semibold text-white" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        <Icon className={cn("size-4", id === "assist" && "text-[#C9F300]")} />
                        {label}
                    </button>
                ))}
            </div>

            {mode === "write" ? (
                <div className="space-y-1.5">
                    <Label htmlFor={`summary-${section.id}`}>Summary</Label>
                    <Textarea
                        id={`summary-${section.id}`}
                        value={section.content}
                        rows={5}
                        maxLength={2000}
                        placeholder="Two or three lines on who you are, what you're good at and the kind of role you want"
                        onChange={(event) => setContent(event.target.value)}
                    />
                    <p className="text-right text-xs text-muted-foreground">{section.content.length} / 600 recommended</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Answer what you can. The summary is written from these answers and the rest of your CV, and you can edit it
                        afterwards.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor={`role-${section.id}`}>Role you&apos;re applying for</Label>
                            <Input
                                id={`role-${section.id}`}
                                value={brief.role}
                                maxLength={100}
                                placeholder="Frontend Engineer"
                                onChange={(event) => setBrief({ ...brief, role: event.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`level-${section.id}`}>Where you are now</Label>
                            <Select value={brief.level} onValueChange={(level) => setBrief({ ...brief, level })}>
                                <SelectTrigger id={`level-${section.id}`} className="w-full">
                                    <SelectValue placeholder="Choose one" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(SUMMARY_LEVELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor={`keywords-${section.id}`}>Skills or keywords to mention</Label>
                        <SkillPicker
                            id={`keywords-${section.id}`}
                            values={brief.keywords}
                            max={12}
                            context={brief.role}
                            placeholder="React, teamwork, accessibility…"
                            onChange={(keywords) => setBrief({ ...brief, keywords })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor={`about-${section.id}`}>About the job (optional)</Label>
                        <Textarea
                            id={`about-${section.id}`}
                            value={brief.about}
                            rows={3}
                            maxLength={600}
                            placeholder="Paste a line or two from the job post, or describe the job in your own words"
                            onChange={(event) => setBrief({ ...brief, about: event.target.value })}
                        />
                    </div>
                    <Button type="button" onClick={generate} disabled={suggestion?.loading}>
                        <Sparkles />
                        {suggestion?.loading ? "Writing…" : "Write my summary"}
                    </Button>
                </div>
            )}

            {suggestion && (
                <AiSuggestion
                    suggestion={suggestion.text}
                    loading={suggestion.loading}
                    kind="summary"
                    onAccept={() => {
                        const before = section.content;
                        setContent(suggestion.text);
                        toast("Summary replaced", { action: { label: "Undo", onClick: () => setContent(before) } });
                        setSuggestion(null);
                        setMode("write");
                    }}
                    onRetry={generate}
                    onDismiss={() => {
                        request.current++;
                        setSuggestion(null);
                    }}
                />
            )}
        </div>
    );
};

export default SummaryEditor;
