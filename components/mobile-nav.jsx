"use client";

import Link from "next/link";
import { FileText, GraduationCap, LayoutDashboard, Menu, PenBox } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

const LINKS = [
    { href: "/dashboard", label: "Industry Insights", Icon: LayoutDashboard },
    { href: "/resume", label: "Build Resume", Icon: FileText },
    { href: "/ai-cover-letter", label: "Cover Letter", Icon: PenBox },
    { href: "/interview", label: "Mock Interview", Icon: GraduationCap },
];

// The desktop header shows these as buttons and a hover menu. On phones
// there isn't room for both, and hover doesn't exist on touch screens.
const MobileNav = () => (
    <DropdownMenu>
        <DropdownMenuTrigger
            aria-label="Open menu"
            className="flex size-10 items-center justify-center rounded-md border-2 border-[#C9F300] text-white outline-none focus-visible:ring-2 focus-visible:ring-[#9EFF00]"
        >
            <Menu className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={12} className="w-56 border-[#9EFF00]/20 bg-[#111]">
            {LINKS.map(({ href, label, Icon }) => (
                <DropdownMenuItem key={href} asChild className="h-11 font-semibold focus:bg-[#9EFF00] focus:text-black">
                    <Link href={href}>
                        <Icon />
                        {label}
                    </Link>
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
);

export default MobileNav;
