"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { AIUnavailableError, generateJSON } from "@/lib/ai";
import { isTranscriptionConfigured } from "@/lib/ai/transcribe";
import { answerInputSchema, dailyLimit, interviewConfigSchema } from "@/lib/interview/config";
import {
    answeredCount,
    buildFollowUpPrompt,
    buildTurn,
    classifyAnswer,
    nextStep,
    parseFollowUp,
    shouldConsiderFollowUp,
} from "@/lib/interview/engine";
import { answerMetrics } from "@/lib/interview/metrics";
import { buildPlanPrompt, normalizePlan } from "@/lib/interview/plan";
import { buildEvaluationPrompt, buildFeedback, parseEvaluation } from "@/lib/interview/scoring";

// Actions return { error } for anything the user can act on, rather than
// throwing, so the message reaches them instead of a generic error page.

const BUSY = "The AI interviewer is busy right now. Please try again in a minute.";

async function getCurrentUser() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    return user;
}

async function getOwnInterview(userId, id) {
    const interview = await db.voiceInterview.findFirst({ where: { id, userId } });
    if (!interview) throw new Error("Interview not found");
    return interview;
}

// What the browser gets to see. The plan's scoring notes stay on the server.
function toView(interview) {
    const { plan, turns } = interview;
    return {
        id: interview.id,
        role: interview.role,
        type: interview.type,
        level: interview.level,
        status: interview.status,
        step: nextStep(plan, turns),
        turnIndex: turns.length,
        turns: turns.map(({ questionId, kind, prompt, answer, skipped }) => ({ questionId, kind, prompt, answer, skipped })),
        answered: answeredCount(turns),
        total: plan.questions.length,
        hasFeedback: Boolean(interview.feedback),
    };
}

// Gives up waiting after `ms`. Used where a late answer is worth less than
// moving on, since the fallback chain can otherwise retry for a while.
function withinTime(promise, ms) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`No answer within ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Models occasionally return JSON that doesn't match. One more try usually fixes it.
async function generateValidated(prompt, parse, options) {
    for (let attempt = 0; ; attempt++) {
        try {
            return parse(await generateJSON(prompt, options));
        } catch (error) {
            if (error instanceof AIUnavailableError || attempt === 1) throw error;
            console.warn("Retrying after an unusable AI response:", error.message);
        }
    }
}

export async function getVoiceCapabilities() {
    return { serverTranscription: isTranscriptionConfigured() };
}

// Sensible starting values for the setup form, from the user's profile and
// their most recent CV.
export async function getVoiceSetupDefaults() {
    const user = await getCurrentUser();
    const resume = await db.resume.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { data: true },
    });

    const experience = user.experience ?? 0;
    return {
        role: resume?.data?.basics?.headline?.slice(0, 80) ?? "",
        level: experience < 2 ? "entry" : experience <= 5 ? "mid" : "senior",
        skills: (user.skills ?? []).slice(0, 10),
    };
}

export async function startVoiceInterview(input) {
    const user = await getCurrentUser();

    const parsed = interviewConfigSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the interview settings" };
    const config = parsed.data;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await db.voiceInterview.count({ where: { userId: user.id, createdAt: { gte: since } } });
    if (recent >= dailyLimit()) {
        return { error: `You've started ${recent} interviews in the last 24 hours, which is the daily limit. Please come back tomorrow.` };
    }

    let plan;
    try {
        plan = await generateValidated(buildPlanPrompt(config, user), (raw) => normalizePlan(raw, config), {
            maxTokens: 1800,
        });
    } catch (error) {
        console.error("Couldn't plan the interview:", error);
        return { error: error instanceof AIUnavailableError ? BUSY : "Couldn't prepare the interview this time. Please try again." };
    }

    const interview = await db.voiceInterview.create({
        data: { userId: user.id, role: config.role, type: config.type, level: config.level, focus: config.focus, plan, turns: [] },
        select: { id: true },
    });

    revalidatePath("/interview");
    return { id: interview.id };
}

export async function getVoiceInterview(id) {
    const user = await getCurrentUser();
    const interview = await db.voiceInterview.findFirst({ where: { id, userId: user.id } });
    return interview ? toView(interview) : null;
}

export async function submitVoiceAnswer(id, input) {
    const user = await getCurrentUser();

    const parsed = answerInputSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Couldn't read that answer" };
    const answer = parsed.data;

    const interview = await getOwnInterview(user.id, id);
    if (interview.status !== "IN_PROGRESS") return { error: "This interview has already finished.", view: toView(interview) };

    const turns = interview.turns;
    const placement = classifyAnswer(turns, answer);
    if (placement === "duplicate") return { view: toView(interview) };
    if (placement === "stale") return { view: toView(interview), notice: "This interview moved on in another tab, so it's been brought up to date." };

    const step = nextStep(interview.plan, turns);
    if (step.type === "complete") return { view: toView(interview) };

    if (!answer.skipped && !answer.answer) return { error: "Say or type an answer first, or skip the question." };

    let followUp = null;
    if (shouldConsiderFollowUp(step, answer)) {
        const question = interview.plan.questions.find((q) => q.id === step.questionId);
        try {
            // A slow follow-up isn't worth the wait. Without one, the interview just moves on.
            followUp = parseFollowUp(
                await withinTime(
                    generateJSON(buildFollowUpPrompt(interview, question, answer.answer), {
                        speed: "fast",
                        maxTokens: 120,
                        timeoutMs: 6000,
                    }),
                    8000
                )
            );
        } catch (error) {
            console.warn("Skipping the follow-up question:", error.message);
        }
    }

    const nextTurns = [...turns, buildTurn(step, answer, followUp)];

    // Only save if nobody else has changed the interview since it was read.
    const { count } = await db.voiceInterview.updateMany({
        where: { id, userId: user.id, updatedAt: interview.updatedAt, status: "IN_PROGRESS" },
        data: { turns: nextTurns },
    });

    if (count === 0) {
        const latest = await getOwnInterview(user.id, id);
        return { view: toView(latest), notice: "This interview moved on in another tab, so it's been brought up to date." };
    }

    return { view: toView({ ...interview, turns: nextTurns }) };
}

async function writeFeedback(interview) {
    const evaluation = await generateValidated(
        buildEvaluationPrompt(interview, interview.plan, interview.turns),
        parseEvaluation,
        { maxTokens: 6000, timeoutMs: 60000 }
    );
    const feedback = buildFeedback(interview.plan, interview.turns, evaluation);

    await db.voiceInterview.update({
        where: { id: interview.id },
        data: { feedback, score: feedback.score },
    });
}

// Ends the interview, whether every question was reached or not. The
// interview is marked finished before the feedback is written, so if the
// AI is busy the answers are safe and the feedback can be retried.
export async function finishVoiceInterview(id) {
    const user = await getCurrentUser();
    const interview = await getOwnInterview(user.id, id);

    if (interview.status === "ABANDONED") return { error: "This interview was ended without any answers." };
    if (interview.status === "COMPLETED" && interview.feedback) return { ok: true };

    if (answeredCount(interview.turns) === 0) {
        await db.voiceInterview.update({ where: { id }, data: { status: "ABANDONED", completedAt: new Date() } });
        revalidatePath("/interview");
        return { ok: true, abandoned: true };
    }

    if (interview.status === "IN_PROGRESS") {
        await db.voiceInterview.update({
            where: { id },
            data: { status: "COMPLETED", completedAt: new Date(), metrics: answerMetrics(interview.turns) },
        });
    }

    revalidatePath("/interview");

    try {
        await writeFeedback(interview);
        return { ok: true };
    } catch (error) {
        console.error("Couldn't write interview feedback:", error);
        return { ok: true, feedbackPending: true };
    }
}

export async function retryVoiceFeedback(id) {
    const user = await getCurrentUser();
    const interview = await getOwnInterview(user.id, id);

    if (interview.status !== "COMPLETED") return { error: "Finish the interview first." };
    if (interview.feedback) return { ok: true };

    try {
        await writeFeedback(interview);
        revalidatePath(`/interview/voice/${id}/feedback`);
        return { ok: true };
    } catch (error) {
        console.error("Couldn't write interview feedback:", error);
        return { error: error instanceof AIUnavailableError ? BUSY : "Couldn't write the feedback this time. Please try again." };
    }
}

export async function getVoiceFeedback(id) {
    const user = await getCurrentUser();
    const interview = await db.voiceInterview.findFirst({ where: { id, userId: user.id } });
    if (!interview) return null;

    return {
        id: interview.id,
        role: interview.role,
        type: interview.type,
        level: interview.level,
        status: interview.status,
        score: interview.score,
        feedback: interview.feedback,
        metrics: interview.metrics,
        turns: interview.turns.map(({ questionId, kind, prompt, answer, skipped, inputMode }) => ({
            questionId,
            kind,
            prompt,
            answer,
            skipped,
            inputMode,
        })),
        completedAt: interview.completedAt,
        createdAt: interview.createdAt,
    };
}

export async function getVoiceInterviews() {
    const user = await getCurrentUser();

    const interviews = await db.voiceInterview.findMany({
        where: { userId: user.id, status: { not: "ABANDONED" } },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return interviews.map((interview) => ({
        id: interview.id,
        role: interview.role,
        type: interview.type,
        level: interview.level,
        status: interview.status,
        score: interview.score,
        answered: answeredCount(interview.turns),
        total: interview.plan.questions.length,
        hasFeedback: Boolean(interview.feedback),
        createdAt: interview.createdAt,
    }));
}

export async function deleteVoiceInterview(id) {
    const user = await getCurrentUser();
    await db.voiceInterview.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/interview");
    return { ok: true };
}
