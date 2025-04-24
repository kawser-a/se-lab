import { getUserOnboardingStatus } from '@/actions/user';
import { redirect } from 'next/navigation';
import React from 'react'

const IndustryInsightsPage = async () => {

    //check if user is already onboard
        const { isOnboarded } = await getUserOnboardingStatus();

        if (!isOnboarded) {
            redirect("/onboarding");
        }

    return (
        <div>
            IndustryInsightsPage
        </div>
    )
}

export default IndustryInsightsPage
