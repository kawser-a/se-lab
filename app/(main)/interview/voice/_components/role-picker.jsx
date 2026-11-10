"use client";

import { useId, useRef, useState } from "react";
import { ChevronDown, CornerDownLeft, FileText } from "lucide-react";
import { ROLE_GROUPS, searchRoles } from "@/lib/interview/roles";
import { cn } from "@/lib/utils";

// A text box with a list of roles under it. The list filters as you type,
// and whatever's typed can be used even when it isn't in the list.
const RolePicker = ({ id, value, onChange, suggestedRole }) => {
    const listId = useId();
    const inputRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);

    const typed = value.trim();
    const matches = searchRoles(value);
    const exact = matches.some((match) => match.role.toLowerCase() === typed.toLowerCase());

    // With nothing typed, show everything grouped; otherwise show matches.
    const options = typed
        ? [...matches, ...(exact ? [] : [{ role: typed, custom: true }])]
        : [
              ...(suggestedRole ? [{ role: suggestedRole, group: "From your CV", fromCv: true }] : []),
              ...ROLE_GROUPS.flatMap((group) => group.roles.map((role) => ({ role, group: group.label }))),
          ];

    const choose = (role) => {
        onChange(role);
        setOpen(false);
        setActive(-1);
    };

    const onKeyDown = (event) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(index + 1, options.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter" && open) {
            event.preventDefault();
            if (options[active]) choose(options[active].role);
            else setOpen(false);
        } else if (event.key === "Escape") {
            setOpen(false);
        }
    };

    let lastGroup = null;

    return (
        <div className="relative">
            <div className="relative">
                <input
                    ref={inputRef}
                    id={id}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
                    value={value}
                    maxLength={80}
                    autoComplete="off"
                    placeholder="Search or type a role, e.g. Frontend Developer"
                    onChange={(event) => {
                        onChange(event.target.value);
                        setOpen(true);
                        setActive(event.target.value.trim() ? 0 : -1);
                    }}
                    onKeyDown={onKeyDown}
                    onFocus={() => setOpen(true)}
                    onClick={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 120)}
                    className="h-11 w-full rounded-md border border-input bg-input/30 pl-3 pr-10 text-base outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                />
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Show roles"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                        setOpen((current) => !current);
                        inputRef.current?.focus();
                    }}
                    className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-white"
                >
                    <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
                </button>
            </div>

            {open && options.length > 0 && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
                >
                    {options.map((option, index) => {
                        const heading = !typed && option.group !== lastGroup ? option.group : null;
                        lastGroup = option.group;
                        return (
                            <li key={`${option.role}-${index}`} role="presentation">
                                {heading && <p className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">{heading}</p>}
                                <div
                                    id={`${listId}-${index}`}
                                    role="option"
                                    aria-selected={index === active}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setActive(index)}
                                    onClick={() => choose(option.role)}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm",
                                        index === active && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    {option.custom ? (
                                        <>
                                            <CornerDownLeft className="size-3.5 text-[#C9F300]" /> Use &quot;{option.role}&quot;
                                        </>
                                    ) : (
                                        <>
                                            {option.fromCv && <FileText className="size-3.5 text-[#C9F300]" />}
                                            <span className="flex-1">{option.role}</span>
                                            {typed && <span className="text-xs text-muted-foreground">{option.group}</span>}
                                        </>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default RolePicker;
