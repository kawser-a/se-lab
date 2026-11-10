import { generateJSON } from "@/lib/ai";
import { db } from "@/lib/prisma";
import { buildInsightsPrompt, INSIGHTS_JSON_SCHEMA, InvalidInsightsError, nextRefresh, normalizeInsights } from "./market";

// Asks for fresh insights and checks them; one retry if the reply isn't usable.
export async function generateInsights(industry, country) {
    const prompt = buildInsightsPrompt(industry, country);
    const ask = () => generateJSON(prompt, { speed: "fast", schema: INSIGHTS_JSON_SCHEMA, maxTokens: 2400, timeoutMs: 25000 });
    try {
        return normalizeInsights(await ask(), country);
    } catch (error) {
        if (!(error instanceof InvalidInsightsError)) throw error;
        return normalizeInsights(await ask(), country);
    }
}

// Writes (or rewrites) the insights for one industry in one country.
export async function saveInsights(industry, country) {
    const insights = await generateInsights(industry, country);
    const data = { ...insights, lastUpdated: new Date(), nextUpdate: nextRefresh() };
    return db.industryInsight.upsert({
        where: { industry_country: { industry, country } },
        create: { industry, country, ...data },
        update: data,
    });
}

// Work already under way, so two people opening the same market at once
// share one AI call. Per server process.
const inFlight = new Map();

export function saveInsightsOnce(industry, country) {
    const key = `${industry}:${country}`;
    if (!inFlight.has(key)) {
        inFlight.set(
            key,
            saveInsights(industry, country).finally(() => inFlight.delete(key))
        );
    }
    return inFlight.get(key);
}

// The stored insights for a market, written first if there are none yet.
export async function ensureInsights(industry, country) {
    const existing = await db.industryInsight.findUnique({ where: { industry_country: { industry, country } } });
    return existing ?? saveInsightsOnce(industry, country);
}
