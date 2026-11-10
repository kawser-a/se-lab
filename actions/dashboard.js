"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"
import { generateJSON } from "@/lib/ai";
import { strictObject, stringList } from "@/lib/interview/schema-helpers";

const INSIGHTS_JSON_SCHEMA = strictObject({
    salaryRanges: {
        type: "array",
        items: strictObject({ role: { type: "string" }, min: { type: "number" }, max: { type: "number" }, median: { type: "number" }, location: { type: "string" } }),
    },
    growthRate: { type: "number" },
    demandLevel: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
    topSkills: stringList,
    marketOutlook: { type: "string", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"] },
    keyTrends: stringList,
    recommendedSkills: stringList,
});


export const generateAIInsights = async (industry) => {
    const prompt = `
            Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
            {
            "salaryRanges": [
                { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "HIGH" | "MEDIUM" | "LOW",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
            }

            IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
            Include at least 5 common roles for salary ranges.
            Growth rate should be a percentage.
            Include at least 5 skills and trends.
        `;

        // Groq first with the shape enforced: this runs while someone waits on
        // the onboarding form, and Gemini can take a lot longer.
        return generateJSON(prompt, { speed: "fast", schema: INSIGHTS_JSON_SCHEMA, maxTokens: 1500, timeoutMs: 20000 });
};


export async function getIndustryInsights() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
        include: {
            industryInsight: true,
        }
    });

    if (!user) throw new Error("User not found.");

    if (!user.industryInsight) {
        const insights = await generateAIInsights(user.industry);

        const industryInsight = await db.industryInsight.create({
            data: {
                industry: user.industry,
                ...insights,
                nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return industryInsight;
    }
    return user.industryInsight;
}