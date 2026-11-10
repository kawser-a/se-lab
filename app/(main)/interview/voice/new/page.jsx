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
            <Link href="/interview" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-white">
                <ChevronLeft className="size-4" /> Interview Preparation
            </Link>
            <div className="mb-8 space-y-3">
                <h1 className="text-4xl font-bold gradient-title text-[#F4F4F5] md:text-5xl">Voice interview</h1>
                <p className="max-w-2xl text-muted-foreground">
                    A spoken mock interview for your role. Answer out loud, get follow-up questions like a real interviewer would ask, and see how
                    you did on understanding, technical depth and communication.
                </p>
            </div>
            <SetupForm defaults={defaults} />
        </div>
    );
};

export default NewVoiceInterviewPage;
