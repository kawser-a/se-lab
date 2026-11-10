"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ClipboardPaste, FileText, Loader2, PenLine, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCoverLetter, restoreCoverLetter } from "@/actions/cover-letter";
import { Button } from "@/components/ui/button";
import { countWords, findPlaceholders, paragraphsOf } from "@/lib/cover-letter/letter";

const STEPS = [
    { icon: ClipboardPaste, title: "Paste the job advert", text: "The letter answers what this job actually asks for." },
    { icon: FileText, title: "Choose a CV to write from", text: "Only what's on it is used. Gaps are left for you to fill." },
    { icon: PenLine, title: "Edit, then download", text: "Tweak it yourself or ask for changes, then copy it or get a PDF." },
];

// The first paragraph after the greeting, which says the most about a letter.
const preview = (content) => paragraphsOf(content).find((paragraph, index) => index > 0 || !/^dear\b/i.test(paragraph)) ?? "";

function EmptyState() {
    return (
        <div className="rounded-3xl border border-dashed border-white/15 p-6 sm:p-10">
            <div className="mx-auto max-w-3xl space-y-8 text-center">
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Write your first cover letter</h2>
                    <p className="text-muted-foreground">About ten seconds to a draft that&apos;s about you and the job, not a template.</p>
                </div>
                <ol className="grid gap-4 text-left sm:grid-cols-3">
                    {STEPS.map(({ icon: Icon, title, text }, index) => (
                        <li key={title} className="space-y-2 rounded-2xl bg-white/[0.03] p-4">
                            <span className="flex items-center gap-2 text-sm font-semibold">
                                <span className="flex size-7 items-center justify-center rounded-full bg-[#9EFF00]/10 text-[#C9F300]">
                                    <Icon className="size-4" />
                                </span>
                                {index + 1}. {title}
                            </span>
                            <p className="text-sm text-muted-foreground">{text}</p>
                        </li>
                    ))}
                </ol>
                <Link
                    href="/ai-cover-letter/new"
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-[#9EFF00] px-7 font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-[#b4ff33]"
                >
                    <Plus className="size-5" /> New cover letter
                </Link>
            </div>
        </div>
    );
}

const CoverLetterList = ({ letters }) => {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState(null);

    // Deleting is immediate, with a few seconds to undo, rather than an
    // "are you sure?" every time.
    const remove = async (letter) => {
        setDeletingId(letter.id);
        try {
            const deleted = await deleteCoverLetter(letter.id);
            router.refresh();
            toast(`Deleted the letter to ${letter.companyName}`, {
                duration: 8000,
                action: {
                    label: "Undo",
                    onClick: async () => {
                        try {
                            await restoreCoverLetter(deleted);
                            router.refresh();
                        } catch {
                            toast.error("Couldn't bring it back, sorry.");
                        }
                    },
                },
            });
        } catch (error) {
            toast.error(error.message || "Couldn't delete that letter.");
        } finally {
            setDeletingId(null);
        }
    };

    if (!letters.length) return <EmptyState />;

    return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {letters.map((letter) => {
                const gaps = findPlaceholders(letter.content).length;
                return (
                    <article key={letter.id} className="group flex flex-col rounded-xl border bg-card transition-colors hover:border-white/25">
                        <Link href={`/ai-cover-letter/${letter.id}`} className="flex flex-1 flex-col gap-3 p-5" aria-label={`Open the letter for ${letter.jobTitle} at ${letter.companyName}`}>
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold leading-snug">{letter.jobTitle}</h2>
                                <p className="text-sm text-[#C9F300]">{letter.companyName}</p>
                            </div>
                            <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{preview(letter.content)}</p>
                            <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                                <span>{countWords(letter.content)} words</span>
                                <span aria-hidden="true">·</span>
                                <span>edited {formatDistanceToNow(new Date(letter.updatedAt), { addSuffix: true })}</span>
                                {gaps > 0 && <span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-amber-300">{gaps} to fill in</span>}
                            </div>
                        </Link>
                        <div className="flex gap-2 border-t border-white/10 p-3">
                            <Button asChild className="flex-1">
                                <Link href={`/ai-cover-letter/${letter.id}`}>Open</Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label={`Delete the letter for ${letter.jobTitle} at ${letter.companyName}`}
                                title="Delete"
                                disabled={deletingId === letter.id}
                                onClick={() => remove(letter)}
                            >
                                {deletingId === letter.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                            </Button>
                        </div>
                    </article>
                );
            })}

            <Link
                href="/ai-cover-letter/new"
                className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-neutral-700 p-6 text-center text-muted-foreground transition-colors hover:border-[#9EFF00] hover:text-white"
            >
                <span className="flex size-12 items-center justify-center rounded-full bg-neutral-800 text-white">
                    <Plus />
                </span>
                <span className="font-semibold text-white">New cover letter</span>
                <span className="max-w-52 text-sm">Paste another job advert and get a draft written for it.</span>
            </Link>
        </div>
    );
};

export default CoverLetterList;
