import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getResumes } from "@/actions/resume";
import TemplatePicker from "../_components/template-picker";

export const metadata = {
    title: "New CV | GrowthGrid",
};

const NewResumePage = async () => {
    const resumes = await getResumes();

    return (
        <div className="pt-4">
            <Link href="/resume" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white">
                <ChevronLeft className="size-4" /> My CVs
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold gradient-title text-[#F4F4F5] mb-2">Choose a template</h1>
            <p className="text-muted-foreground mb-8">
                Pick the one that fits the job you want. You can switch any time without losing what you&apos;ve written.
            </p>

            <TemplatePicker resumes={resumes.map(({ id, title }) => ({ id, title }))} />
        </div>
    );
};

export default NewResumePage;
