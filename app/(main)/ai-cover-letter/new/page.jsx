import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCoverLetter, getLetterSources } from "@/actions/cover-letter";
import LetterForm from "../_components/letter-form";

export const metadata = {
    title: "New Cover Letter | GrowthGrid",
};

// ?from=<id> starts the form with another letter's job and settings, for
// writing a fresh version in a different tone or from a different CV.
const NewCoverLetterPage = async ({ searchParams }) => {
    const { from } = await searchParams;
    const [sources, previous] = await Promise.all([getLetterSources(), typeof from === "string" ? getCoverLetter(from) : null]);
    const start = previous?.letter;

    return (
        <div className="mx-auto max-w-3xl pt-4 pb-16">
            <Link href="/ai-cover-letter" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-white">
                <ChevronLeft className="size-4" /> Cover Letters
            </Link>
            <div className="mb-8 space-y-3">
                <h1 className="text-4xl font-bold gradient-title text-[#F4F4F5] md:text-5xl">{start ? "Write a new version" : "New cover letter"}</h1>
                <p className="max-w-2xl text-muted-foreground">
                    The letter is written from your CV and answers what the job actually asks for. Anything your CV doesn&apos;t show is left in
                    [brackets] for you to fill in, never made up.
                </p>
            </div>
            <LetterForm
                sources={sources}
                initial={
                    start && {
                        companyName: start.companyName,
                        jobTitle: start.jobTitle,
                        hiringManager: start.hiringManager ?? "",
                        jobDescription: start.jobDescription ?? "",
                        resumeId: start.resumeId,
                        tone: start.tone,
                        length: start.length,
                    }
                }
            />
        </div>
    );
};

export default NewCoverLetterPage;
