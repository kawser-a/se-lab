"use client";

import { useId, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { suggestSkills } from "@/lib/resume/skill-suggestions";

// Chips plus a text box. Suggestions appear as you type, and anything not
// in the list can be added with Enter or a comma.
const SkillPicker = ({ id, values, onChange, context, placeholder = "Type a skill", max = 30 }) => {
    const listId = useId();
    const inputRef = useRef(null);
    const [query, setQuery] = useState("");
    const [focused, setFocused] = useState(false);
    const [active, setActive] = useState(0);

    const suggestions = suggestSkills(query, { context, exclude: values });
    const typed = query.trim();
    const typedIsNew = typed && !values.some((value) => value.toLowerCase() === typed.toLowerCase());
    const showCustom = typedIsNew && !suggestions.some((skill) => skill.toLowerCase() === typed.toLowerCase());
    const options = [...suggestions, ...(showCustom ? [typed] : [])];
    const open = focused && options.length > 0 && values.length < max;

    const add = (skill) => {
        const value = skill.trim();
        if (!value || values.length >= max) return;
        if (!values.some((existing) => existing.toLowerCase() === value.toLowerCase())) onChange([...values, value]);
        setQuery("");
        setActive(0);
        inputRef.current?.focus();
    };

    const onKeyDown = (event) => {
        if (event.key === "ArrowDown" && open) {
            event.preventDefault();
            setActive((index) => (index + 1) % options.length);
        } else if (event.key === "ArrowUp" && open) {
            event.preventDefault();
            setActive((index) => (index - 1 + options.length) % options.length);
        } else if (event.key === "Enter") {
            event.preventDefault();
            // Enter takes the highlighted suggestion only once the user has started typing.
            if (typed) add(open ? options[active] ?? typed : typed);
        } else if (event.key === "," || event.key === "Tab") {
            if (typed) {
                event.preventDefault();
                add(typed);
            }
        } else if (event.key === "Backspace" && !query && values.length) {
            onChange(values.slice(0, -1));
        } else if (event.key === "Escape") {
            setFocused(false);
        }
    };

    return (
        <div className="relative">
            <div
                onClick={() => inputRef.current?.focus()}
                className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-input/30 px-2 py-1.5 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
            >
                {values.map((value) => (
                    <span key={value} className="flex items-center gap-1 rounded-md bg-neutral-700 py-0.5 pl-2 pr-1 text-sm">
                        {value}
                        <button
                            type="button"
                            aria-label={`Remove ${value}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                onChange(values.filter((entry) => entry !== value));
                            }}
                            className="rounded p-0.5 text-muted-foreground hover:bg-neutral-600 hover:text-white"
                        >
                            <X className="size-3.5" />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    id={id}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={open ? `${listId}-${active}` : undefined}
                    value={query}
                    maxLength={60}
                    placeholder={values.length ? "" : placeholder}
                    onChange={(event) => {
                        setQuery(event.target.value.replace(",", ""));
                        setActive(0);
                    }}
                    onKeyDown={onKeyDown}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 120)}
                    className="min-w-28 flex-1 bg-transparent py-0.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
                />
            </div>

            {open && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
                >
                    {!typed && <li className="px-2 pb-1 pt-1.5 text-xs text-muted-foreground">Suggestions</li>}
                    {options.map((option, index) => {
                        const custom = showCustom && index === options.length - 1;
                        return (
                            <li
                                key={`${option}-${index}`}
                                id={`${listId}-${index}`}
                                role="option"
                                aria-selected={index === active}
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() => setActive(index)}
                                onClick={() => add(option)}
                                className={cn(
                                    "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm",
                                    index === active && "bg-accent text-accent-foreground"
                                )}
                            >
                                {custom ? (
                                    <>
                                        <Plus className="size-3.5 text-[#C9F300]" /> Add &quot;{option}&quot;
                                    </>
                                ) : (
                                    option
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default SkillPicker;
