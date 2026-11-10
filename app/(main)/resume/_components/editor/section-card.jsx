"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SECTION_META, emptyItem, newId } from "@/lib/resume/sections";
import { TEMPLATES, isSectionShown } from "@/lib/resume/templates";
import Collapse from "./collapse";
import ItemFields, { itemSummary } from "./item-fields";
import SummaryEditor from "./summary-editor";

function move(list, index, offset) {
    const target = index + offset;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}

function IconButton({ label, children, ...props }) {
    return (
        <Button type="button" variant="ghost" size="icon" aria-label={label} title={label} {...props}>
            {children}
        </Button>
    );
}

const SectionCard = ({ section, index, count, open, onToggle, onChange, onMove, onRemove, onRemoveItem, templateId, headline, onSuggestSummary }) => {
    const [openItem, setOpenItem] = useState(section.items?.[0]?.id ?? null);

    const meta = SECTION_META[section.type];
    const shown = isSectionShown(templateId, section.type);

    const setItems = (items) => onChange({ ...section, items });

    const addItem = () => {
        const item = emptyItem(section.type);
        setItems([...section.items, item]);
        setOpenItem(item.id);
    };

    return (
        <div className={cn("rounded-xl border bg-card transition-colors duration-300", open && "border-neutral-600")}>
            <div className="flex min-h-12 items-center gap-1 pl-3 pr-1">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    className="flex min-h-12 flex-1 items-center gap-2 text-left"
                >
                    <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
                    <span className={cn("font-semibold", !section.visible && "text-muted-foreground line-through")}>
                        {section.title}
                    </span>
                    {section.items && <span className="text-xs text-muted-foreground">{section.items.length}</span>}
                    {!shown && (
                        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-muted-foreground">
                            Not in {TEMPLATES[templateId].shortName}
                        </span>
                    )}
                </button>
                <IconButton
                    label={section.visible ? `Hide ${section.title}` : `Show ${section.title}`}
                    onClick={() => onChange({ ...section, visible: !section.visible })}
                >
                    {section.visible ? <Eye /> : <EyeOff />}
                </IconButton>
                <IconButton label={`Move ${section.title} up`} disabled={index === 0} onClick={() => onMove(-1)}>
                    <ChevronUp />
                </IconButton>
                <IconButton label={`Move ${section.title} down`} disabled={index === count - 1} onClick={() => onMove(1)}>
                    <ChevronDown />
                </IconButton>
            </div>

            <Collapse open={open}>
                <div className="space-y-4 border-t px-3 pb-3 pt-4">
                    <div className="space-y-1.5">
                        <Label htmlFor={`title-${section.id}`}>Section name</Label>
                        <Input
                            id={`title-${section.id}`}
                            value={section.title}
                            maxLength={60}
                            onChange={(event) => onChange({ ...section, title: event.target.value })}
                        />
                    </div>

                    {section.type === "summary" ? (
                        <SummaryEditor section={section} headline={headline} onChange={onChange} onSuggest={onSuggestSummary} />
                    ) : (
                        <div className="space-y-2">
                            {section.items.map((item, itemIndex) => {
                                const summary = itemSummary(section.type, item);
                                const expanded = openItem === item.id;
                                return (
                                    <div key={item.id} className="rounded-lg border bg-background/40">
                                        <div className="flex min-h-12 items-center gap-1 pl-3 pr-1">
                                            <button
                                                type="button"
                                                aria-expanded={expanded}
                                                onClick={() => setOpenItem(expanded ? null : item.id)}
                                                className="flex min-h-12 min-w-0 flex-1 flex-col justify-center text-left"
                                            >
                                                <span className={cn("truncate text-sm font-medium", !item.visible && "text-muted-foreground line-through")}>
                                                    {summary.title}
                                                </span>
                                                {(summary.detail || !item.visible) && (
                                                    <span className="truncate text-xs text-muted-foreground">
                                                        {item.visible ? summary.detail : "Hidden from this CV"}
                                                    </span>
                                                )}
                                            </button>
                                            <IconButton
                                                label={item.visible ? `Hide ${summary.title}` : `Show ${summary.title}`}
                                                onClick={() =>
                                                    setItems(section.items.map((entry) => (entry.id === item.id ? { ...entry, visible: !entry.visible } : entry)))
                                                }
                                            >
                                                {item.visible ? <Eye /> : <EyeOff />}
                                            </IconButton>
                                            <IconButton
                                                label={`Move ${summary.title} up`}
                                                disabled={itemIndex === 0}
                                                onClick={() => setItems(move(section.items, itemIndex, -1))}
                                            >
                                                <ChevronUp />
                                            </IconButton>
                                            <IconButton
                                                label={`Move ${summary.title} down`}
                                                disabled={itemIndex === section.items.length - 1}
                                                onClick={() => setItems(move(section.items, itemIndex, 1))}
                                            >
                                                <ChevronDown />
                                            </IconButton>
                                        </div>
                                        <Collapse open={expanded}>
                                            <div className="space-y-3 border-t p-3">
                                                <ItemFields
                                                    type={section.type}
                                                    item={item}
                                                    templateId={templateId}
                                                    onChange={(next) =>
                                                        setItems(section.items.map((entry) => (entry.id === item.id ? next : entry)))
                                                    }
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            const copy = { ...structuredClone(item), id: newId() };
                                                            const items = [...section.items];
                                                            items.splice(itemIndex + 1, 0, copy);
                                                            setItems(items);
                                                            setOpenItem(copy.id);
                                                        }}
                                                    >
                                                        <Copy /> Duplicate
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => onRemoveItem(item.id)}
                                                    >
                                                        <Trash2 /> Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </Collapse>
                                    </div>
                                );
                            })}
                            <Button type="button" variant="outline" className="w-full" onClick={addItem}>
                                <Plus /> Add {meta.itemLabel}
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-end border-t pt-3">
                        <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onRemove}>
                            <Trash2 /> Remove section
                        </Button>
                    </div>
                </div>
            </Collapse>
        </div>
    );
};

export { move };
export default SectionCard;
