import { industries } from "@/data/industries"
import OnBoardingForm from "./_components/OnBoardingForm"

const OnboardingPage = () => {
    return (
        <main>
            <OnBoardingForm industries={industries} />
        </main>
    )
}

export default OnboardingPage
