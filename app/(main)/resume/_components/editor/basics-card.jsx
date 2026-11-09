"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/resume/sections";

const FIELDS = [
    { name: "name", label: "Full name", autoComplete: "name" },
    { name: "headline", label: "Headline", placeholder: "Full-stack Developer" },
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
    { name: "location", label: "Location", placeholder: "Dhaka, Bangladesh" },
];

const BasicsCard = ({ basics, open, onToggle, onChange }) => {
    const set = (name, value) => onChange({ ...basics, [name]: value });
    const setLinks = (links) => onChange({ ...basics, links });

    return (
        <div className={cn("rounded-xl border bg-card", open && "border-neutral-600")}>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="flex min-h-12 w-full items-center gap-2 px-3 text-left"
            >
                {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                <span className="flex-1 font-semibold">Basics</span>
                <span className="text-sm text-muted-foreground">Name, contact, links</span>
            </button>

            {open && (
                <div className="space-y-4 border-t px-3 pb-3 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {FIELDS.map((field) => (
                            <div key={field.name} className="space-y-1.5">
                                <Label htmlFor={`basics-${field.name}`}>{field.label}</Label>
                                <Input
                                    id={`basics-${field.name}`}
                                    type={field.type ?? "text"}
                                    value={basics[field.name]}
                                    maxLength={160}
                                    placeholder={field.placeholder}
                                    autoComplete={field.autoComplete}
                                    onChange={(event) => set(field.name, event.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <span className="text-sm font-medium">Links</span>
                        {basics.links.map((link, index) => (
                            <div key={link.id} className="flex gap-2">
                                <Input
                                    aria-label={`Link ${index + 1} name`}
                                    value={link.label}
                                    placeholder="GitHub"
                                    maxLength={40}
                                    className="w-28 shrink-0"
                                    onChange={(event) =>
                                        setLinks(basics.links.map((entry) => (entry.id === link.id ? { ...entry, label: event.target.value } : entry)))
                                    }
                                />
                                <Input
                                    aria-label={`Link ${index + 1} address`}
                                    value={link.url}
                                    placeholder="github.com/you"
                                    maxLength={300}
                                    onChange={(event) =>
                                        setLinks(basics.links.map((entry) => (entry.id === link.id ? { ...entry, url: event.target.value } : entry)))
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Remove link ${index + 1}`}
                                    onClick={() => setLinks(basics.links.filter((entry) => entry.id !== link.id))}
                                >
                                    <X />
                                </Button>
                            </div>
                        ))}
                        {basics.links.length < 8 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full border-dashed"
                                onClick={() => setLinks([...basics.links, { id: newId(), label: "", url: "" }])}
                            >
                                <Plus /> Add link
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BasicsCard;
