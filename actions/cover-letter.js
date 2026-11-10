"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { AIUnavailableError, generateJSON } from "@/lib/ai";
import {
    backgroundFromProfile,
    backgroundFromResume,
    buildLetterPrompt,
    buildRewritePrompt,
    InvalidLetterError,
    joinParagraphs,
    LETTER_JSON_SCHEMA,
    letterContentSchema,
    letterDetailsSchema,
    letterRequestSchema,
    parseLetter,
    REWRITE_JSON_SCHEMA,
    REWRITES,
} from "@/lib/cover-letter/letter";

async function getCurrentUser() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    return user;
}

async function getOwnLetter(userId, id) {
    const letter = await db.coverLetter.findFirst({ where: { id, userId } });
    if (!letter) throw new Error("Cover letter not found");
    return letter;
}

const firstError = (result) => result.error.issues[0]?.message ?? "Please check the form";

// What the letter is written from: the chosen CV if it still exists,
// otherwise the profile. The CV's name goes on the letter too.
async function backgroundFor(user, resumeId) {
    const resume = resumeId ? await db.resume.findFirst({ where: { id: resumeId, userId: user.id }, select: { id: true, data: true } }) : null;
    const fromCv = resume ? backgroundFromResume(resume.data) : "";
    const fromProfile = backgroundFromProfile(user);
    return {
        resumeId: resume?.id ?? null,
        name: resume?.data?.basics?.name || user.name || "",
        background: [fromCv, fromProfile && `From their profile:\n${fromProfile}`].filter(Boolean).join("\n\n"),
    };
}

const aiMessage = (error, fallback) => {
    if (error instanceof AIUnavailableError) return error.message;
    if (error instanceof InvalidLetterError) return "The AI's letter came back incomplete. Please try again.";
    console.error(fallback, error);
    return fallback;
};

export async function getCoverLetters() {
    const user = await getCurrentUser();
    return db.coverLetter.findMany({
        where: { userId: user.id },
        select: { id: true, companyName: true, jobTitle: true, content: true, updatedAt: true, createdAt: true },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getCoverLetter(id) {
    const user = await getCurrentUser();
    const letter = await db.coverLetter.findFirst({ where: { id, userId: user.id } });
    if (!letter) return null;

    // The sender's details for the letter heading and the PDF's look come
    // from the CV it was written with, falling back to the profile.
    const resume = letter.resumeId ? await db.resume.findFirst({ where: { id: letter.resumeId, userId: user.id }, select: { title: true, data: true, theme: true } }) : null;
    const basics = resume?.data?.basics ?? {};
    return {
        letter,
        sender: {
            name: basics.name || user.name || "",
            email: basics.email || user.email || "",
            phone: basics.phone || "",
            location: basics.location || "",
        },
        resume: resume ? { title: resume.title, theme: resume.theme } : null,
    };
}

// The CVs someone can write from, newest first, and whether the profile has
// enough to go on without one.
export async function getLetterSources() {
    const user = await getCurrentUser();
    const resumes = await db.resume.findMany({
        where: { userId: user.id },
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
    });
    return { resumes, profileSkills: user.skills?.length ?? 0, hasProfile: Boolean(user.industry) };
}

export async function generateCoverLetter(values) {
    const user = await getCurrentUser();

    const parsed = letterRequestSchema.safeParse(values);
    if (!parsed.success) return { error: firstError(parsed), field: parsed.error.issues[0]?.path?.[0] };
    const request = parsed.data;

    const { resumeId, name, background } = await backgroundFor(user, request.resumeId);
    const prompt = buildLetterPrompt({ job: request, background, tone: request.tone, length: request.length, name });
    const ask = () => generateJSON(prompt, { speed: "fast", schema: LETTER_JSON_SCHEMA, maxTokens: 1800, timeoutMs: 25000 });

    let written;
    try {
        try {
            written = parseLetter(await ask());
        } catch (error) {
            if (!(error instanceof InvalidLetterError) && !(error instanceof SyntaxError)) throw error;
            written = parseLetter(await ask());
        }
    } catch (error) {
        return { error: aiMessage(error, "Couldn't write the letter just now. Your details are still here, so please try again.") };
    }

    const letter = await db.coverLetter.create({
        data: {
            userId: user.id,
            resumeId,
            companyName: request.companyName,
            jobTitle: request.jobTitle,
            hiringManager: request.hiringManager,
            jobDescription: request.jobDescription,
            tone: request.tone,
            length: request.length,
            content: written.content,
            requirements: written.requirements,
        },
        select: { id: true },
    });

    revalidatePath("/ai-cover-letter");
    return { id: letter.id };
}

export async function updateCoverLetter(id, { content, details }) {
    const user = await getCurrentUser();
    await getOwnLetter(user.id, id);

    const data = {};
    if (content !== undefined) {
        const parsed = letterContentSchema.safeParse(content);
        if (!parsed.success) return { error: firstError(parsed) };
        data.content = parsed.data;
    }
    if (details) {
        const parsed = letterDetailsSchema.safeParse(details);
        if (!parsed.success) return { error: firstError(parsed), field: parsed.error.issues[0]?.path?.[0] };
        Object.assign(data, parsed.data);
    }

    const saved = await db.coverLetter.update({ where: { id }, data, select: { updatedAt: true } });
    return { updatedAt: saved.updatedAt };
}

// Returns a revised letter without saving it: the editor shows it with an
// undo, and saves it like any other edit.
export async function rewriteCoverLetter(id, mode, content) {
    const user = await getCurrentUser();
    if (!REWRITES[mode]) return { error: "Unknown change" };
    const parsedContent = letterContentSchema.safeParse(content);
    if (!parsedContent.success || !content.trim()) return { error: "Write something first, then ask for changes." };

    const letter = await getOwnLetter(user.id, id);
    const { background } = await backgroundFor(user, letter.resumeId);

    try {
        const reply = await generateJSON(buildRewritePrompt({ content, mode, job: letter, background }), {
            speed: "fast",
            schema: REWRITE_JSON_SCHEMA,
            maxTokens: 1500,
            timeoutMs: 20000,
        });
        return { content: joinParagraphs(reply.paragraphs) };
    } catch (error) {
        return { error: aiMessage(error, "Couldn't make that change just now. Your letter hasn't changed.") };
    }
}

// Deletes and hands back what was deleted, so the list can offer an undo.
export async function deleteCoverLetter(id) {
    const user = await getCurrentUser();
    const letter = await getOwnLetter(user.id, id);
    await db.coverLetter.delete({ where: { id } });
    revalidatePath("/ai-cover-letter");
    return letter;
}

export async function restoreCoverLetter(letter) {
    const user = await getCurrentUser();
    const { id, createdAt, updatedAt, ...rest } = letter;
    const details = letterDetailsSchema.safeParse(rest);
    if (!details.success || !letterContentSchema.safeParse(rest.content).success) throw new Error("Couldn't restore that letter");
    await db.coverLetter.create({
        data: {
            id,
            userId: user.id,
            resumeId: rest.resumeId ?? null,
            companyName: rest.companyName,
            jobTitle: rest.jobTitle,
            hiringManager: rest.hiringManager ?? null,
            jobDescription: rest.jobDescription ?? null,
            tone: rest.tone,
            length: rest.length,
            content: rest.content,
            requirements: rest.requirements ?? [],
            status: rest.status ?? "draft",
            createdAt: new Date(createdAt),
        },
    });
    revalidatePath("/ai-cover-letter");
}
