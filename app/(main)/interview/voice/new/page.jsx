import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getVoiceSetupDefaults } from "@/actions/voice-interview";
import SetupForm from "../_components/setup-form";

export const metadata = {
    title: "Voice Interview | GrowthGrid",
};

const NewVoiceInterviewPage = async () => {
    const defaults = await getVoiceSetupDefaults();

    return (
        <div className="mx-auto max-w-3xl pt-4 pb-16">
            <Link href="/interview" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white">
                <ChevronLeft className="size-4" /> Interview Preparation
            </Link>
            <h1 className="mb-2 text-4xl font-bold gradient-title text-[#F4F4F5] md:text-5xl">Voice interview</h1>
            <p className="mb-8 text-muted-foreground">
                Practise answering out loud. The interviewer asks questions for your role, follows up when an answer needs more, and gives you
                feedback on each answer at the end.
            </p>
            <SetupForm defaults={defaults} />
        </div>
    );
};

export default NewVoiceInterviewPage;
