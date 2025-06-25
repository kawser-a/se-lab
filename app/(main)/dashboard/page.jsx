
import { getIndustryInsights } from '@/actions/dashboard';
import { getUserOnboardingStatus } from '@/actions/user';
import { redirect } from 'next/navigation';
import DashboardView from './_components/DashboardView';

export const dynamic = 'force-dynamic';

const IndustryInsightsPage = async () => {
  // 1. First check onboarding status
  const { isOnboarded } = await getUserOnboardingStatus();

  // 2. Immediate redirect with return
  if (!isOnboarded) {
    redirect("/onboarding");
    return null; // This line is theoretically unreachable but helps TypeScript
  }

  // 3. Only proceed if onboarded
  const insights = await getIndustryInsights();

  return (
    <div className='container mx-auto'>
      <DashboardView insights={insights} />
    </div>
  )
}

export default IndustryInsightsPage;
