import { redirect } from "next/navigation";
import { getIndustryInsights } from "@/actions/dashboard";
import DashboardView from "./_components/DashboardView";

export const metadata = {
    title: "Industry Insights | GrowthGrid",
};

const IndustryInsightsPage = async () => {
    const result = await getIndustryInsights();
    if (!result.profile.industry) redirect("/onboarding");

    // Dates as strings for the client components.
    const insight = result.insight && {
        ...result.insight,
        lastUpdated: result.insight.lastUpdated.toISOString(),
        nextUpdate: result.insight.nextUpdate.toISOString(),
    };

    return <DashboardView profile={result.profile} insight={insight} needsCountry={result.needsCountry} error={result.error} />;
};

export default IndustryInsightsPage;
