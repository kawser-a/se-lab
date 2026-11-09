"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { generateText } from "@/lib/gemini";
import { resumeDataSchema, resumeThemeSchema, resumeTitleSchema } from "@/lib/resume/schema";
import { emptyResumeData, SECTION_META } from "@/lib/resume/sections";
import { TEMPLATES, defaultTheme } from "@/lib/resume/templates";

async function getCurrentUser() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    return user;
}

async function getOwnResume(userId, id) {
    const resume = await db.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new Error("CV not found");
    return resume;
}

function firstError(result) {
    return result.error.issues[0]?.message ?? "Invalid input";
}

export async function getResumes() {
    const user = await getCurrentUser();

    return db.resume.findMany({
        where: { userId: user.id },
        select: { id: true, title: true, theme: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getResume(id) {
    const user = await getCurrentUser();
    const resume = await db.resume.findFirst({ where: { id, userId: user.id } });
    return resume;
}

export async function createResume({ title, templateId, copyFromId }) {
    const user = await getCurrentUser();

    const template = TEMPLATES[templateId];
    if (!template) throw new Error("Unknown template");

    const parsedTitle = resumeTitleSchema.safeParse(title);
    if (!parsedTitle.success) throw new Error(firstError(parsedTitle));

    let data;
    if (copyFromId) {
        const source = await getOwnResume(user.id, copyFromId);
        data = source.data;
    } else {
        data = emptyResumeData(template.defaultSections, {
            name: user.name ?? "",
            email: user.email ?? "",
        });
        for (const section of data.sections) {
            section.title = template.defaultTitles?.[section.type] ?? SECTION_META[section.type].label;
        }
    }

    const resume = await db.resume.create({
        data: {
            userId: user.id,
            title: parsedTitle.data,
            data,
            theme: defaultTheme(template.id),
        },
        select: { id: true },
    });

    revalidatePath("/resume");
    return resume;
}

export async function updateResume(id, { title, data, theme }) {
    const user = await getCurrentUser();
    await getOwnResume(user.id, id);

    const changes = {};

    if (title !== undefined) {
        const parsed = resumeTitleSchema.safeParse(title);
        if (!parsed.success) throw new Error(firstError(parsed));
        changes.title = parsed.data;
    }
    if (data !== undefined) {
        const parsed = resumeDataSchema.safeParse(data);
        if (!parsed.success) throw new Error(firstError(parsed));
        changes.data = parsed.data;
    }
    if (theme !== undefined) {
        const parsed = resumeThemeSchema.safeParse(theme);
        if (!parsed.success) throw new Error(firstError(parsed));
        changes.theme = parsed.data;
    }

    const updated = await db.resume.update({
        where: { id },
        data: changes,
        select: { updatedAt: true },
    });

    revalidatePath("/resume");
    return updated;
}

export async function duplicateResume(id) {
    const user = await getCurrentUser();
    const source = await getOwnResume(user.id, id);

    const copy = await db.resume.create({
        data: {
            userId: user.id,
            title: `${source.title} (copy)`.slice(0, 80),
            data: source.data,
            theme: source.theme,
        },
        select: { id: true },
    });

    revalidatePath("/resume");
    return copy;
}

export async function deleteResume(id) {
    const user = await getCurrentUser();
    await getOwnResume(user.id, id);

    await db.resume.delete({ where: { id } });
    revalidatePath("/resume");
}

const TONES = {
    developer: "clear and technical, naming tools and outcomes",
    academic: "formal and precise, as used in academic CVs",
    creative: "vivid but professional, focused on the work and its audience",
    graduate: "plain and confident, suited to a first job",
};

export async function suggestBullet({ text, templateId }) {
    await getCurrentUser();

    const bullet = String(text ?? "").trim().slice(0, 400);
    if (!bullet) throw new Error("Write the bullet point first");

    const prompt = `
        Rewrite this CV bullet point. Tone: ${TONES[templateId] ?? TONES.developer}.

        Bullet: "${bullet}"

        Rules:
        - Start with a strong past-tense verb, or present tense if the original is ongoing work.
        - Keep every fact from the original and add no new facts, tools, employers or numbers.
        - If a number would make it stronger, leave a placeholder in square brackets such as [X%], [number] or [time saved] for the person to fill in.
        - At most 30 words. One sentence. No full stop at the end.

        Reply with the rewritten bullet only.
    `;

    const suggestion = await generateText(prompt);
    return suggestion.replace(/^[-•*\s"]+|["\s]+$/g, "").replace(/\.$/, "");
}

export async function suggestSummary(id) {
    const user = await getCurrentUser();
    const resume = await getOwnResume(user.id, id);

    const parsed = resumeDataSchema.safeParse(resume.data);
    if (!parsed.success) throw new Error("Save your CV first");

    const { basics, sections } = parsed.data;
    const facts = sections
        .filter((section) => section.type !== "summary" && section.visible)
        .map((section) => `${section.title}: ${JSON.stringify(section.items.filter((item) => item.visible))}`)
        .join("\n");

    if (!facts.trim()) throw new Error("Add some experience, projects or education first");

    const templateId = resume.theme?.templateId;
    const prompt = `
        Write a 2 to 3 sentence professional summary for the top of a CV.
        Tone: ${TONES[templateId] ?? TONES.developer}.
        ${basics.headline ? `Their headline: ${basics.headline}` : ""}

        Use only facts that appear below. Do not invent numbers, years of experience, employers or skills.
        Write in the first person without using "I". No quotation marks.

        ${facts.slice(0, 6000)}
    `;

    return generateText(prompt);
}
