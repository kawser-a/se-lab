"use server"
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateQuiz() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
    });

    if (!user) throw new Error("User not found");

    const prompt = `
                Generate 2 technical interview questions for a ${user.industry
        } professional${user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""}.

                Each question should be multiple choice with 4 options.

                Return the response in this JSON format only, no additional text:
                {
                    "questions": [
                        {
                        "question": "string",
                        "options": ["string", "string", "string", "string"],
                        "correctAnswer": "string",
                        "explanation": "string"
                        }
                    ]
                }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
        const quiz = JSON.parse(cleanedText);

        return quiz.questions;
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Failed to generate quiz questions");
    }

}

export async function saveQuizResult(questions, answers, score) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const questionResults = questions.map((q, index) => ({
        question: q.question,
        answer: q.correctAnswer,
        userAnswer: answers[index],
        isCorrect: q.correctAnswer === answers[index],
        explanation: q.explanation,
    }));

    // Get wrong answers
    const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

    // Only generate improvement tips if there are wrong answers
    let improvementTip = null;
    if (wrongAnswers.length > 0) {
        const wrongQuestionsText = wrongAnswers
            .map(
                (q) =>
                    `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
            )
            .join("\n\n");

        const improvementPrompt = `
                        The user got the following ${user.industry} technical interview questions wrong:

                            ${wrongQuestionsText}

                            Based on these mistakes, provide a concise, specific improvement tip.
                            Focus on the knowledge gaps revealed by these wrong answers.
                            Keep the response under 2 sentences and make it encouraging.
                            Don't explicitly mention the mistakes, instead focus on what to learn/practice.
        `;

        try {
            const tipResult = await model.generateContent(improvementPrompt);

            improvementTip = tipResult.response.text().trim();
            console.log(improvementTip);
        } catch (error) {
            console.error("Error generating improvement tip:", error);
            // Continue without improvement tip if generation fails
        }
    }

    try {
        const assessment = await db.assessment.create({
            data: {
                userId: user.id,
                quizScore: score,
                questions: questionResults,
                category: "Technical",
                improvementTip,
            },
        });

        return assessment;
    } catch (error) {
        console.error("Error saving quiz result:", error);
        throw new Error("Failed to save quiz result");
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

export async function generateVoiceInterview(config) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    const prompt = `
  Generate ${config.amount} ${config.type.toLowerCase()} interview questions
  for a ${config.level} ${config.role} in ${user.industry}.
  Use this tech stack: ${config.techStack.join(", ")}

  Return JSON only:
  {
    "questions": [
      { "question": "string" }
    ]
  }
  `;

    try {
        const result = await model.generateContent(prompt);
        const raw = result.response.text();
        console.log("Gemini raw output:", raw);
        const clean = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(clean);
        return parsed.questions;
    } catch (error) {
        console.error("Gemini question generation failed:", error.message);
        throw new Error("Gemini error: " + error.message);
    }
}

export async function saveVoiceInterviewResult(config, responses, feedback, transcript, aiAudioUrls) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId },
    });
    if (!user) throw new Error("User not found");

    try {
        console.log("Saving with:", { config, responses, feedback });
        const interview = await db.voiceInterview.create({
            data: {
                userId: user.id,
                role: config.role,
                level: config.level,
                techStack: config.techStack,
                type: config.type,
                score: feedback.overallScore,
                strengths: feedback.strengths || "N/A",
                areasForImprovement: feedback.areasForImprovement || "N/A",
                feedbackJson: feedback.breakdown,
                transcriptJson: transcript || [],
                aiAudioUrls: aiAudioUrls || [],
            },
        });
        return interview;
    } catch (error) {
        console.error("Save voice interview error:", error);
        throw new Error("Failed to save voice interview");
    }
}

export async function generateVoiceFeedback(config, responses) {
    const prompt = `
  User just completed a ${config.level} ${config.role} ${config.type} voice interview.

  Here are the Q&A:
  ${responses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join("\n\n")}

  Provide JSON ONLY:
  {
    "overallScore": float (0-100),
    "strengths": "string",
    "areasForImprovement": "string",
    "breakdown": {
      "communication": float (0-100),
      "technicalKnowledge": float (0-100),
      "problemSolving": float (0-100),
      "confidence": float (0-100)
    }
  }
  `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```(?:json)?\n?/g, "").trim();
        return JSON.parse(text);
    } catch (err) {
        console.error("Feedback gen error:", err);
        throw new Error("Failed to generate feedback");
    }
}

export async function getVoiceInterviews() {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId },
    });
    if (!user) throw new Error("User not found");

    return await db.voiceInterview.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
    });
}
