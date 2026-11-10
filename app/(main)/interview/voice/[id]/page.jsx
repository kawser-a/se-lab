import { notFound, redirect } from "next/navigation";
import { getVoiceCapabilities, getVoiceInterview } from "@/actions/voice-interview";
import InterviewSession from "../_components/interview-session";

export const metadata = {
    title: "Voice Interview | GrowthGrid",
};

const VoiceInterviewPage = async ({ params }) => {
    const { id } = await params;
    const [view, capabilities] = await Promise.all([getVoiceInterview(id), getVoiceCapabilities()]);

    if (!view) notFound();
    if (view.status === "COMPLETED") redirect(`/interview/voice/${id}/feedback`);
    if (view.status === "ABANDONED") redirect("/interview");

    return <InterviewSession initialView={view} capabilities={capabilities} />;
};

export default VoiceInterviewPage;
