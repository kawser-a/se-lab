import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, PlayCircle } from "lucide-react";
import { INTERVIEW_TYPES } from "@/lib/interview/config";

// An unfinished interview is the most likely thing someone came back for.
const ResumeBanner = ({ interview }) => (
    <section className="flex flex-col gap-4 rounded-2xl border border-amber-300/30 bg-amber-300/[0.05] p-5 sm:flex-row sm:items-center">
        <PlayCircle className="hidden size-8 shrink-0 text-amber-300 sm:block" />
        <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold">You have an unfinished interview</p>
            <p className="text-sm text-muted-foreground">
                {interview.role} · {INTERVIEW_TYPES[interview.type]?.label} · {interview.answered} of {interview.total} answered · started{" "}
                {format(new Date(interview.createdAt), "d MMM, HH:mm")}
            </p>
        </div>
        <Link
            href={`/interview/voice/${interview.id}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-amber-300 px-6 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-amber-200 active:translate-y-0 active:scale-[0.98]"
        >
            Resume <ArrowRight className="size-4" />
        </Link>
    </section>
);

export default ResumeBanner;
