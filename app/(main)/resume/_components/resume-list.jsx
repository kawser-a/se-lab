"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Copy, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteResume, duplicateResume, updateResume } from "@/actions/resume";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TEMPLATES } from "@/lib/resume/templates";
import { TemplateThumbnail } from "./template-thumbnail";

const ResumeList = ({ resumes }) => {
    const router = useRouter();
    const [busyId, setBusyId] = useState(null);
    const [renaming, setRenaming] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const duplicate = async (resume) => {
        setBusyId(resume.id);
        try {
            await duplicateResume(resume.id);
            toast.success(`Copied "${resume.title}"`);
            router.refresh();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setBusyId(null);
        }
    };

    const rename = async (event) => {
        event.preventDefault();
        const title = new FormData(event.currentTarget).get("title");
        try {
            await updateResume(renaming.id, { title });
            setRenaming(null);
            router.refresh();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const remove = async () => {
        try {
            await deleteResume(deleting.id);
            toast.success(`Deleted "${deleting.title}"`);
            setDeleting(null);
            router.refresh();
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {resumes.map((resume) => {
                    const template = TEMPLATES[resume.theme?.templateId] ?? TEMPLATES.developer;
                    return (
                        <article key={resume.id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
                            <Link
                                href={`/resume/${resume.id}`}
                                className="flex h-52 items-end justify-center bg-neutral-800 pt-5"
                                aria-label={`Open ${resume.title}`}
                            >
                                <TemplateThumbnail
                                    templateId={template.id}
                                    accent={resume.theme?.accent ?? "#1F6FEB"}
                                    className="h-44 w-36"
                                />
                            </Link>
                            <div className="flex flex-1 flex-col gap-2 p-4">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 font-medium">{template.shortName}</span>
                                    <span className="text-muted-foreground">
                                        {template.atsSafe ? "ATS-safe" : "Plain copy included"}
                                    </span>
                                </div>
                                <h2 className="font-semibold text-lg leading-snug">{resume.title}</h2>
                                <p className="text-sm text-muted-foreground">
                                    Edited {formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })}
                                </p>
                                <div className="mt-auto flex gap-2 pt-2">
                                    <Button asChild className="flex-1">
                                        <Link href={`/resume/${resume.id}`}>Open</Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        aria-label={`Duplicate ${resume.title}`}
                                        disabled={busyId === resume.id}
                                        onClick={() => duplicate(resume)}
                                    >
                                        {busyId === resume.id ? <Loader2 className="animate-spin" /> : <Copy />}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" aria-label={`More actions for ${resume.title}`}>
                                                <MoreHorizontal />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => setRenaming(resume)}>
                                                <Pencil /> Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(resume)}>
                                                <Trash2 /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </article>
                    );
                })}

                <Link
                    href="/resume/new"
                    className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-neutral-700 p-6 text-center text-muted-foreground transition-colors hover:border-[#9EFF00] hover:text-white"
                >
                    <span className="flex size-12 items-center justify-center rounded-full bg-neutral-800 text-white">
                        <Plus />
                    </span>
                    <span className="font-semibold text-white">New CV</span>
                    <span className="max-w-52 text-sm">
                        {resumes.length
                            ? "Start from a template, or copy one of your CVs and tailor it to a job."
                            : "Pick a template to get started. You can switch later without losing anything."}
                    </span>
                </Link>
            </div>

            <AlertDialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
                <AlertDialogContent>
                    <form onSubmit={rename} className="space-y-4">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Rename CV</AlertDialogTitle>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="rename-title">Name</Label>
                            <Input id="rename-title" name="title" defaultValue={renaming?.title} maxLength={80} autoFocus />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                            <Button type="submit">Save</Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete &quot;{deleting?.title}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ResumeList;
