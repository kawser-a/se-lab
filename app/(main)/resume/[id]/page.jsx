import { notFound } from "next/navigation";
import { getResume } from "@/actions/resume";
import ResumeEditor from "../_components/editor/resume-editor";

export const metadata = {
    title: "Edit CV | GrowthGrid",
};

const EditResumePage = async ({ params }) => {
    const { id } = await params;
    const resume = await getResume(id);
    if (!resume) notFound();

    return <ResumeEditor resume={{ id: resume.id, title: resume.title, data: resume.data, theme: resume.theme }} />;
};

export default EditResumePage;
