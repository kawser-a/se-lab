import { redirect } from "next/navigation";
import { getProfileDefaults } from "@/actions/user";
import ProfileForm from "./_components/ProfileForm";

export const metadata = {
    title: "Set up your profile | GrowthGrid",
};

const OnboardingPage = async () => {
    const defaults = await getProfileDefaults();
    if (defaults.industry && defaults.country) redirect("/dashboard");

    return (
        <div className="mx-auto max-w-3xl space-y-8 pt-6 pb-16">
            <div className="space-y-3">
                <h1 className="text-4xl font-bold gradient-title text-[#F4F4F5] md:text-5xl">Set up your profile</h1>
                <p className="max-w-2xl text-muted-foreground">
                    Tell us your field, where you work and what you know. You&apos;ll get salaries for your market, the skills employers there ask for,
                    and how your skills compare.
                </p>
            </div>
            <ProfileForm mode="onboarding" defaults={defaults} />
        </div>
    );
};

export default OnboardingPage;
