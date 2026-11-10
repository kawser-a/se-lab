import { notFound, redirect } from "next/navigation";
import { getVoiceFeedback } from "@/actions/voice-interview";
import FeedbackView from "../../_components/feedback-view";

export const metadata = {
    title: "Interview Feedback | GrowthGrid",
};

const VoiceFeedbackPage = async ({ params }) => {
    const { id } = await params;
    const interview = await getVoiceFeedback(id);

    if (!interview) notFound();
    if (interview.status === "IN_PROGRESS") redirect(`/interview/voice/${id}`);
    if (interview.status === "ABANDONED") redirect("/interview");

    return <FeedbackView interview={interview} />;
};

export default VoiceFeedbackPage;
