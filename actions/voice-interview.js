"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/prisma";
import { AIUnavailableError, generateJSON } from "@/lib/ai";
import { isSpeechConfigured } from "@/lib/ai/speech";
import { isTranscriptionConfigured } from "@/lib/ai/transcribe";
import { answerInputSchema, dailyLimit, interviewConfigSchema } from "@/lib/interview/config";
import {
    answeredCount,
    buildFollowUpPrompt,
    buildTurn,
    classifyAnswer,
    FOLLOW_UP_JSON_SCHEMA,
    nextStep,
    parseFollowUp,
    shouldReact,
} from "@/lib/interview/engine";
import { answerMetrics } from "@/lib/interview/metrics";
import { buildPlanPrompt, normalizePlan, PLAN_JSON_SCHEMA } from "@/lib/interview/plan";
import { closingLine, firstName, interviewerFor, leadIn, openingLine, resumeLine } from "@/lib/interview/script";
import { buildEvaluationPrompt, buildFeedback, EVALUATION_JSON_SCHEMA, parseEvaluation } from "@/lib/interview/scoring";

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

// What the browser gets to see, including what the interviewer says next.
// The plan's scoring notes stay on the server.
function toView(interview, user) {
    const { plan, turns } = interview;
    // Questions are written while the candidate is in the lobby.
    const preparing = plan.questions.length === 0;
    const total = preparing ? plan.questionCount : plan.questions.length;
    const step = preparing ? { type: "preparing", total } : nextStep(plan, turns);
    const interviewer = interviewerFor(plan);
    const candidate = firstName(user.name);
    const lines = { interviewer: interviewer.name, candidate, role: interview.role, type: interview.type, total };

    return {
        id: interview.id,
        role: interview.role,
        type: interview.type,
        level: interview.level,
        status: interview.status,
        interviewer,
        candidate: { name: candidate, imageUrl: user.imageUrl ?? null },
        script: {
            opening: openingLine(lines),
            resume: resumeLine(lines),
            closing: closingLine(lines),
        },
        step: step.type === "question" ? { ...step, ...leadIn(step, turns) } : step,
        turnIndex: turns.length,
        turns: turns.map(({ questionId, kind, prompt, answer, skipped }) => ({ questionId, kind, prompt, answer, skipped })),
        answered: answeredCount(turns),
        total,
        preparing,
        // The next main question, so its audio can load while this one's answered.
        upcoming: preparing ? null : upcomingQuestion(plan, turns),
        hasFeedback: Boolean(interview.feedback),
    };
}

function upcomingQuestion(plan, turns) {
    const asked = new Set(turns.filter((turn) => turn.kind === "main").map((turn) => turn.questionId));
    const remaining = plan.questions.filter((question) => !asked.has(question.id));
    // The current one is remaining[0]; the one after that is worth preparing.
    return remaining[1]?.text ?? null;
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

// Work that's already under way for an interview, so a second request for
// the same thing waits for it instead of paying for it again. Per server
// process; if a request lands elsewhere it simply does the work itself.
const inFlight = new Map();

function once(key, work) {
    if (!inFlight.has(key)) {
        const promise = work().finally(() => inFlight.delete(key));
        inFlight.set(key, promise);
    }
    return inFlight.get(key);
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
    return { serverTranscription: isTranscriptionConfigured(), serverVoice: isSpeechConfigured() };
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
        // Offered first in the role list, not filled in for them.
        suggestedRole: resume?.data?.basics?.headline?.slice(0, 80) || null,
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

    // Saved straight away with an empty plan, so the candidate goes to the
    // lobby at once. The questions are written while they check their mic.
    const interview = await db.voiceInterview.create({
        data: {
            userId: user.id,
            role: config.role,
            type: config.type,
            level: config.level,
            focus: config.focus,
            plan: { questions: [], questionCount: config.questionCount, interviewer: config.interviewer },
            turns: [],
        },
        select: { id: true },
    });

    // Start writing the questions now rather than when the lobby loads, so
    // they're usually ready by the time the microphone is checked.
    after(() => once(`plan:${interview.id}`, () => writePlan(user, interview.id)).catch(() => {}));

    revalidatePath("/interview");
    return { id: interview.id };
}

// Writes the questions for an interview that doesn't have them yet and
// returns the interview as saved. Whichever write finishes first is kept.
async function writePlan(user, id) {
    const interview = await getOwnInterview(user.id, id);
    if (interview.plan.questions.length > 0) return interview;

    const config = {
        role: interview.role,
        type: interview.type,
        level: interview.level,
        focus: interview.focus,
        questionCount: interview.plan.questionCount,
    };

    const { questions } = await generateValidated(buildPlanPrompt(config, user), (raw) => normalizePlan(raw, config), {
        speed: "fast",
        schema: PLAN_JSON_SCHEMA,
        // Roughly 150 tokens a question, with room to spare.
        maxTokens: 400 + config.questionCount * 220,
        timeoutMs: 20000,
    });

    const plan = { ...interview.plan, questions };
    const { count } = await db.voiceInterview.updateMany({
        where: { id, userId: user.id, updatedAt: interview.updatedAt },
        data: { plan },
    });
    return count === 0 ? getOwnInterview(user.id, id) : { ...interview, plan };
}

// Called from the lobby. Joins the preparation started with the interview
// if it's still running, or starts it if it never did (or failed).
export async function prepareVoiceInterview(id) {
    const user = await getCurrentUser();
    try {
        const interview = await once(`plan:${id}`, () => writePlan(user, id));
        return { view: toView(interview, user) };
    } catch (error) {
        console.error("Couldn't plan the interview:", error.message);
        return { error: error instanceof AIUnavailableError ? BUSY : "Couldn't prepare your questions this time. Please try again." };
    }
}

export async function getVoiceInterview(id) {
    const user = await getCurrentUser();
    const interview = await db.voiceInterview.findFirst({ where: { id, userId: user.id } });
    return interview ? toView(interview, user) : null;
}

export async function submitVoiceAnswer(id, input) {
    const user = await getCurrentUser();

    const parsed = answerInputSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Couldn't read that answer" };
    const answer = parsed.data;

    const interview = await getOwnInterview(user.id, id);
    if (interview.status !== "IN_PROGRESS") return { error: "This interview has already finished.", view: toView(interview, user) };

    const turns = interview.turns;
    const placement = classifyAnswer(turns, answer);
    if (placement === "duplicate") return { view: toView(interview, user) };
    if (placement === "stale") return { view: toView(interview, user), notice: "This interview moved on in another tab, so it's been brought up to date." };

    if (interview.plan.questions.length === 0) return { error: "Your questions are still being prepared." };

    const step = nextStep(interview.plan, turns);
    if (step.type === "complete") return { view: toView(interview, user) };

    if (!answer.skipped && !answer.answer) return { error: "Say or type an answer first, or skip the question." };

    let reply = { followUp: null, ack: null };
    if (shouldReact(step, answer)) {
        const question = interview.plan.questions.find((q) => q.id === step.questionId);
        const asking = { asked: step.prompt, allowFollowUp: step.kind === "main" };
        try {
            // A slow reply isn't worth the wait. Without one, the interview just moves on.
            reply = parseFollowUp(
                await withinTime(
                    generateJSON(buildFollowUpPrompt(interview, question, answer.answer, asking), {
                        speed: "instant",
                        schema: FOLLOW_UP_JSON_SCHEMA,
                        maxTokens: 200,
                        timeoutMs: 4000,
                    }),
                    5000
                )
            );
        } catch (error) {
            console.warn("Moving on without a written reaction:", error.message);
        }
    }

    const nextTurns = [...turns, buildTurn(step, answer, reply)];

    // Only save if nobody else has changed the interview since it was read.
    const { count } = await db.voiceInterview.updateMany({
        where: { id, userId: user.id, updatedAt: interview.updatedAt, status: "IN_PROGRESS" },
        data: { turns: nextTurns },
    });

    if (count === 0) {
        const latest = await getOwnInterview(user.id, id);
        return { view: toView(latest, user), notice: "This interview moved on in another tab, so it's been brought up to date." };
    }

    const saved = { ...interview, turns: nextTurns };
    // That was the last answer. Start on the feedback while the interviewer
    // says goodbye, so it's often ready by the time they finish.
    if (nextStep(interview.plan, nextTurns).type === "complete") {
        after(() => once(`feedback:${id}`, () => writeFeedback(saved)).catch(() => {}));
    }

    return { view: toView(saved, user) };
}

async function writeFeedback(interview) {
    const evaluation = await generateValidated(
        buildEvaluationPrompt(interview, interview.plan, interview.turns),
        parseEvaluation,
        // Groq first: it writes this in a few seconds, where Gemini can take much longer.
        { speed: "fast", schema: EVALUATION_JSON_SCHEMA, maxTokens: 5000, timeoutMs: 45000 }
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
    if (interview.feedback && interview.status !== "IN_PROGRESS") return { ok: true };

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
    // Already written while the interviewer was saying goodbye.
    if (interview.feedback) return { ok: true };

    try {
        // Joins the feedback already being written after the last answer, if there is one.
        await once(`feedback:${id}`, () => writeFeedback(interview));
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

    // Leave out interviews whose questions were never written.
    return interviews.filter((interview) => interview.plan.questions.length > 0).map((interview) => ({
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
