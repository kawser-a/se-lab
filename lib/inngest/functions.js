import { db } from "../prisma";
import { saveInsights } from "../insights/generate";
import { inngest } from "./client";

// Weekly refresh of every market someone has looked at. Markets are also
// refreshed when someone opens one past its refresh date, so this mainly
// keeps quiet markets current.
export const generateIndustryInsights = inngest.createFunction(
    { name: "Generate Industry Insights" },
    { cron: "0 0 * * 0" },
    async ({ step }) => {
        const markets = await step.run("Find markets due a refresh", () =>
            db.industryInsight.findMany({ where: { nextUpdate: { lte: new Date() } }, select: { industry: true, country: true } })
        );

        for (const { industry, country } of markets) {
            // Each market in its own step, so one failure doesn't stop the rest
            // and a retry only repeats the one that failed.
            await step.run(`Refresh ${industry} in ${country}`, async () => {
                await saveInsights(industry, country);
            });
        }

        return { refreshed: markets.length };
    }
);
