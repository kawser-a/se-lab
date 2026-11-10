"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { AIUnavailableError } from "@/lib/ai";
import { ensureInsights } from "@/lib/insights/generate";
import { industrySlug, profileSchema } from "@/lib/insights/profile";
import { db } from "@/lib/prisma";

async function getCurrentUser() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");
    return user;
}

// Saves the profile, then prepares the insights for that market if nobody
// has needed them yet. The profile is saved either way: if the AI is busy,
// the insights page offers to try again.
export async function updateUser(values) {
    const user = await getCurrentUser();
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

    const { industry, subIndustry, country, experience, skills, bio } = parsed.data;
    const slug = industrySlug(industry, subIndustry);

    await db.user.update({
        where: { id: user.id },
        data: { industry: slug, country, experience, skills, bio: bio || null },
    });
    revalidatePath("/dashboard");

    try {
        await ensureInsights(slug, country);
        return { success: true };
    } catch (error) {
        console.error("Profile saved, but the insights couldn't be written:", error.message);
        return {
            success: true,
            notice:
                error instanceof AIUnavailableError
                    ? "Profile saved. Your market insights will be ready shortly; the AI is busy right now."
                    : "Profile saved. Your market insights couldn't be prepared yet; you can try again from the page.",
        };
    }
}

// What the profile form starts with. Skills from the newest CV are offered
// as suggestions, so people don't have to type them twice.
export async function getProfileDefaults() {
    const user = await getCurrentUser();
    const resume = await db.resume.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, select: { data: true } });
    const cvSkills = (resume?.data?.sections ?? [])
        .filter((section) => section.type === "skills")
        .flatMap((section) => section.items ?? [])
        .flatMap((item) => item.keywords ?? [])
        .filter((skill) => typeof skill === "string" && skill.trim())
        .map((skill) => skill.trim());

    return {
        industry: user.industry,
        country: user.country,
        experience: user.experience,
        skills: user.skills ?? [],
        bio: user.bio ?? "",
        cvSkills: [...new Set(cvSkills)].slice(0, 20),
    };
}
