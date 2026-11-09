"use client";

import { useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { suggestBullet } from "@/actions/resume";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AiSuggestion from "./ai-suggestion";

// Bullet points, one textarea each, with an optional AI rewrite per line.
const ListInput = ({ label, values, onChange, templateId, allowAi = true, max = 12, placeholder }) => {
    const [suggesting, setSuggesting] = useState(null);

    const update = (index, value) => onChange(values.map((line, i) => (i === index ? value : line)));
    const remove = (index) => onChange(values.filter((_, i) => i !== index));

    const suggest = async (index) => {
        const text = values[index];
        if (!text?.trim()) {
            toast.error("Write the bullet point first");
            return;
        }

        setSuggesting({ index, loading: true, text: "" });
        try {
            const result = await suggestBullet({ text, templateId });
            if (result.error) throw new Error(result.error);
            setSuggesting({ index, loading: false, text: result.text });
        } catch (error) {
            toast.error(error.message || "Couldn't write a suggestion. Please try again.");
            setSuggesting(null);
        }
    };

    return (
        <div className="space-y-2">
            <span className="text-sm font-medium">{label}</span>
            {values.map((line, index) => (
                <div key={index} className="space-y-2">
                    <div className="flex items-start gap-2">
                        <Textarea
                            aria-label={`${label} ${index + 1}`}
                            value={line}
                            rows={2}
                            maxLength={400}
                            placeholder={index === 0 ? placeholder : undefined}
                            onChange={(event) => update(index, event.target.value)}
                            className="min-h-11 resize-y"
                        />
                        <div className="flex flex-col gap-1">
                            {allowAi && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    aria-label={`Improve ${label.toLowerCase()} ${index + 1}`}
                                    title="Suggest a stronger version"
                                    onClick={() => suggest(index)}
                                    className="text-[#C9F300] hover:text-[#C9F300]"
                                >
                                    <Sparkles />
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                                onClick={() => remove(index)}
                            >
                                <X />
                            </Button>
                        </div>
                    </div>
                    {suggesting?.index === index && (
                        <AiSuggestion
                            suggestion={suggesting.text}
                            loading={suggesting.loading}
                            onAccept={() => {
                                update(index, suggesting.text);
                                setSuggesting(null);
                            }}
                            onRetry={() => suggest(index)}
                            onDismiss={() => setSuggesting(null)}
                        />
                    )}
                </div>
            ))}
            {values.length < max && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => onChange([...values, ""])}
                >
                    <Plus /> Add {label.toLowerCase().replace(/s$/, "")}
                </Button>
            )}
        </div>
    );
};

export default ListInput;
