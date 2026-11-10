"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AIUnavailableError, generateJSON, generateText } from "@/lib/ai";
import { buildQuizPrompt, combineQuizHalves, parseQuizQuestions, QUIZ_HALVES, QUIZ_JSON_SCHEMA } from "@/lib/interview/quiz";

async function getCurrentUser() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");
    return user;
}

async function writeQuizHalf(user, half, topic) {
    const raw = await generateJSON(buildQuizPrompt(user, half, topic), { speed: "fast", schema: QUIZ_JSON_SCHEMA, maxTokens: 1800, timeoutMs: 15000 });
    return parseQuizQuestions(raw);
}

export async function generateQuiz({ topic } = {}) {
    const user = await getCurrentUser();
    const focus = typeof topic === "string" ? topic.trim().slice(0, 40) : "";

    // Both halves at once; a quiz is still worth taking if one comes back short.
    const halves = await Promise.allSettled(QUIZ_HALVES.map((half) => writeQuizHalf(user, half, focus)));
    try {
        return combineQuizHalves(halves.map((half) => (half.status === "fulfilled" ? half.value : [])));
    } catch (error) {
        const busy = halves.some((half) => half.status === "rejected" && half.reason instanceof AIUnavailableError);
        console.error("Couldn't write the quiz:", error.message);
        throw new Error(busy ? "The AI is busy right now. Please try again in a minute." : "Couldn't write your quiz this time. Please try again.");
    }
}

// Saves straight away so the score shows at once. The improvement tip is
// written separately, after, by writeQuizTip.
export async function saveQuizResult(questions, answers, score) {
    const user = await getCurrentUser();

    const questionResults = questions.map((q, index) => ({
        question: q.question,
        answer: q.correctAnswer,
        userAnswer: answers[index],
        isCorrect: q.correctAnswer === answers[index],
        explanation: q.explanation,
    }));

    try {
        return await db.assessment.create({
            data: {
                userId: user.id,
                quizScore: score,
                questions: questionResults,
                category: "Technical",
                improvementTip: null,
            },
        });
    } catch (error) {
        console.error("Error saving quiz result:", error);
        throw new Error("Failed to save quiz result");
    }
}

// A short, encouraging tip based on the questions they got wrong.
export async function writeQuizTip(assessmentId) {
    const user = await getCurrentUser();
    const assessment = await db.assessment.findFirst({ where: { id: assessmentId, userId: user.id } });
    if (!assessment) return { tip: null };
    if (assessment.improvementTip) return { tip: assessment.improvementTip };

    const wrong = assessment.questions.filter((q) => !q.isCorrect);
    if (wrong.length === 0) return { tip: null };

    const prompt = `The user got these ${user.industry ?? "technical"} interview questions wrong:

${wrong.map((q) => `Question: "${q.question}"\nCorrect answer: "${q.answer}"\nTheir answer: "${q.userAnswer}"`).join("\n\n")}

Write one concise, specific improvement tip, under 2 sentences, encouraging in tone.
Focus on what to learn or practise next. Don't list the mistakes themselves.
Reply with the tip only.`;

    try {
        const tip = (await generateText(prompt, { speed: "instant", maxTokens: 150 })).replace(/^["\s]+|["\s]+$/g, "");
        await db.assessment.update({ where: { id: assessment.id }, data: { improvementTip: tip } });
        return { tip };
    } catch (error) {
        console.error("Couldn't write the quiz tip:", error.message);
        return { tip: null };
    }
}

export async function getAssesments() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    try {
        const assessments = await db.assessment.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return assessments;
    } catch (error) {
        console.error("Error fetching assessments: ", error);
        throw new Error("Failed to fetch assessments.");
    }
}
