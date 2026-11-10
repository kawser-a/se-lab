import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Quiz from "../_components/Quiz";

export const metadata = {
    title: "Knowledge Quiz | GrowthGrid",
};

const MockInterviewPage = async ({ searchParams }) => {
    const { topic } = await searchParams;
    const focus = typeof topic === "string" ? topic.trim().slice(0, 40) : "";

    return (
        <div className="mx-auto max-w-3xl space-y-6 pt-6 pb-16">
            <Link href="/interview" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-white">
                <ChevronLeft className="size-4" /> Interview Preparation
            </Link>
            <div className="space-y-2">
                <h1 className="text-4xl font-bold gradient-title text-[#F4F4F5] md:text-5xl">Knowledge quiz</h1>
                <p className="text-muted-foreground">Test what you know with questions for your industry, and learn from each answer as you go.</p>
            </div>
            <Quiz topic={focus || undefined} />
        </div>
    );
};

export default MockInterviewPage;
