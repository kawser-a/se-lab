import { industries } from "@/data/industries"
import OnBoardingForm from "./_components/OnBoardingForm"
import { getUserOnboardingStatus } from "@/actions/user"
import { redirect } from "next/navigation";

const OnboardingPage = async () => {

    //check if user is already onboard
    const { isOnboarded } = await getUserOnboardingStatus();

    if (isOnboarded) {
        redirect("/dashboard");
    }

    return (
        <main>
            <OnBoardingForm industries={industries} />
        </main>
    )
}

export default OnboardingPage
