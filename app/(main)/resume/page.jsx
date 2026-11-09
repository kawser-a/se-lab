import { getResumes } from "@/actions/resume";
import ResumeList from "./_components/resume-list";

export const metadata = {
    title: "My CVs | GrowthGrid",
};

const ResumesPage = async () => {
    const resumes = await getResumes();

    return (
        <div className="pt-4">
            <h1 className="text-5xl md:text-6xl font-bold gradient-title text-[#F4F4F5]">
                My{" "}
                <span className="relative inline-block mb-6">
                    <span className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1" />
                    <strong className="text-black">CVs</strong>
                </span>
            </h1>
            <p className="text-muted-foreground mb-8">
                Fill in your details once, then make a version for each kind of job.
            </p>

            <ResumeList resumes={resumes} />
        </div>
    );
};

export default ResumesPage;
