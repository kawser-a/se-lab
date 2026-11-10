import { getAssesments } from "@/actions/interview";
import { getVoiceInterviews } from "@/actions/voice-interview";
import History from "./_components/History";
import PracticeModes from "./_components/PracticeModes";
import ProgressOverview from "./_components/ProgressOverview";
import ResumeBanner from "./_components/ResumeBanner";

export const metadata = {
    title: "Interview Preparation | GrowthGrid",
};

const InterviewPage = async () => {
    const [assessments, voiceInterviews] = await Promise.all([getAssesments(), getVoiceInterviews()]);
    // The most recent unfinished interview, if there is one, is the first thing worth doing.
    const unfinished = voiceInterviews.find((interview) => interview.status === "IN_PROGRESS");
    // Only what the client components need, with dates as strings.
    const quizzes = (assessments ?? []).map((quiz) => ({
        id: quiz.id,
        quizScore: quiz.quizScore,
        questions: quiz.questions,
        improvementTip: quiz.improvementTip,
        createdAt: quiz.createdAt.toISOString(),
    }));
    const interviews = voiceInterviews.map((interview) => ({ ...interview, createdAt: interview.createdAt.toISOString() }));

    return (
        <div className="mx-auto max-w-6xl space-y-10 pt-6 pb-16">
            <header className="space-y-4">
                <h1 className="text-4xl font-bold gradient-title text-[#F4F4F5] md:text-6xl">
                    Interview{" "}
                    <span className="relative inline-block">
                        <span className="absolute inset-0 -z-10 rotate-2 bg-[#9EFF00] px-1" />
                        <strong className="text-black">Preparation</strong>
                    </span>
                </h1>
                <p className="max-w-2xl text-muted-foreground">
                    Practise out loud with an AI interviewer, or sharpen what you know with a quick quiz. Every session adds to your progress below.
                </p>
            </header>

            {unfinished && <ResumeBanner interview={unfinished} />}

            <PracticeModes />

            <ProgressOverview interviews={interviews} quizzes={quizzes} />

            <History interviews={interviews} quizzes={quizzes} />
        </div>
    );
};

export default InterviewPage;
