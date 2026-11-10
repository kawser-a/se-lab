"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AIUnavailableError } from "@/lib/ai";
import { ensureInsights, saveInsightsOnce } from "@/lib/insights/generate";
import { InvalidInsightsError } from "@/lib/insights/market";
import { addSkill, canonicalSkill } from "@/lib/insights/skills";
import { db } from "@/lib/prisma";

async function getCurrentUser() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found.");
    return user;
}

// Everything the insights page needs about the person and their market.
// Insights past their refresh date are shown as they are and rewritten in
// the background, so nobody waits on a refresh.
export async function getIndustryInsights() {
    const user = await getCurrentUser();
    const profile = { industry: user.industry, country: user.country, experience: user.experience, skills: user.skills ?? [] };
    if (!user.country) return { profile, needsCountry: true };

    try {
        const insight = await ensureInsights(user.industry, user.country);
        if (insight.nextUpdate < new Date()) {
            after(() => saveInsightsOnce(user.industry, user.country).catch((error) => console.error("Couldn't refresh insights:", error.message)));
        }
        return { profile, insight };
    } catch (error) {
        console.error("Couldn't write insights:", error.message);
        const busy = error instanceof AIUnavailableError;
        const shape = error instanceof InvalidInsightsError;
        return {
            profile,
            error: busy
                ? "The AI is busy right now, so your market insights couldn't be prepared. Please try again in a minute."
                : shape
                  ? "The insights came back incomplete. Please try again."
                  : "Couldn't prepare your market insights. Please try again.",
        };
    }
}

// From the skill gap list: "I already know this". Returns the new list so
// the page can update at once, and the old one can be put back with Undo.
export async function addProfileSkill(skill) {
    const user = await getCurrentUser();
    const name = String(skill ?? "").trim().slice(0, 40);
    if (!name) return { error: "Skill name is empty." };
    const skills = addSkill(user.skills ?? [], name);
    if (skills.length > 40) return { error: "You can list up to 40 skills." };
    await db.user.update({ where: { id: user.id }, data: { skills } });
    revalidatePath("/dashboard");
    return { skills };
}

export async function removeProfileSkill(skill) {
    const user = await getCurrentUser();
    const key = canonicalSkill(skill);
    const skills = (user.skills ?? []).filter((existing) => canonicalSkill(existing) !== key);
    await db.user.update({ where: { id: user.id }, data: { skills } });
    revalidatePath("/dashboard");
    return { skills };
}
