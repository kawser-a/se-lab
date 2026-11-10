import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getVoiceSetupDefaults } from "@/actions/voice-interview";
import SetupForm from "../_components/setup-form";

export const metadata = {
    title: "Voice Interview | GrowthGrid",
};

// ?focus=Kubernetes (from the skill gaps on the insights page) starts the
// form with that topic already added.
const NewVoiceInterviewPage = async ({ searchParams }) => {
    const [defaults, { focus }] = await Promise.all([getVoiceSetupDefaults(), searchParams]);
    const initialFocus = typeof focus === "string" && focus.trim() ? [focus.trim().slice(0, 40)] : [];

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
            <SetupForm defaults={defaults} initialFocus={initialFocus} />
        </div>
    );
};

export default NewVoiceInterviewPage;
