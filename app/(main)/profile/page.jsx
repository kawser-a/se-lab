import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getProfileDefaults } from "@/actions/user";
import ProfileForm from "../onboarding/_components/ProfileForm";

export const metadata = {
    title: "Edit profile | GrowthGrid",
};

const ProfilePage = async () => {
    const defaults = await getProfileDefaults();
    if (!defaults.industry) redirect("/onboarding");

    return (
        <div className="mx-auto max-w-3xl space-y-8 pt-6 pb-16">
            <div className="space-y-3">
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-white">
                    <ChevronLeft className="size-4" /> Industry Insights
                </Link>
                <h1 className="text-4xl font-bold gradient-title text-[#F4F4F5] md:text-5xl">Your profile</h1>
                <p className="max-w-2xl text-muted-foreground">Change your field, market or skills. Your insights update to match.</p>
            </div>
            <ProfileForm mode="edit" defaults={defaults} />
        </div>
    );
};

export default ProfilePage;
