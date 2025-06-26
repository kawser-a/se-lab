import { getIndustryInsights } from '@/actions/dashboard';
import { getUserOnboardingStatus } from '@/actions/user';
import { redirect } from 'next/navigation';
import React from 'react'
import DashboardView from './_components/DashboardView';

const IndustryInsightsPage = async () => {

    //check if user is already onboard
    const { isOnboarded } = await getUserOnboardingStatus();

    if (!isOnboarded) {
        redirect("/onboarding");
        return null;
    }

    const insights = await getIndustryInsights();


    return (
        <div className='conatiner mx-auto'>
            <DashboardView insights={insights} />
        </div>
    )
}

export default IndustryInsightsPage
