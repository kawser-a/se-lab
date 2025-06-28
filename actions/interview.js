"use server"
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

/*
1. Authenticate a user.
2. Find that user in the database.
3. Fetch all the assessments for that user, ordered by creation date (oldest first).
 */
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

/**
 * Generates a list of AI-powered interview questions for a voice interview.
 *
 * This function:
 * - Authenticates the current user.
 * - Fetches the user's industry from the database.
 * - Builds a custom prompt based on the given config.
 * - Calls an AI model to generate the questions.
 * - Parses and returns the generated questions as an array.
 */
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
  Instructions:
  1. The question must be a single, clear question. Maximum 20 words / question.
  2. Start the questions with a short human-like remark
  3. Return JSON only:
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

/**
 * Saves the results of a voice interview to the database.
 *
 * Authenticates the user, finds their record, and creates a new voiceInterview entry with
 * details including interview config, user responses, AI-generated feedback, transcript,
 * and AI-generated audio URLs.
 *
 * @async
 * @function saveVoiceInterviewResult
 * @param {Object} config - Configuration of the interview.
 * @param {string} config.role - Role title (e.g., "Frontend Developer").
 * @param {string} config.level - Job level (e.g., "Senior").
 * @param {string[]} config.techStack - List of technologies used.
 * @param {string} config.type - Interview type (e.g., "Technical").
 * @param {Array<{ question: string, answer: string }>} responses - User’s Q&A responses.
 * @param {Object} feedback - AI-generated feedback object.
 * @param {number} feedback.overallScore - Overall interview score (0-100).
 * @param {string} feedback.strengths - Strengths identified.
 * @param {string} feedback.areasForImprovement - Areas to improve.
 * @param {Object} feedback.breakdown - Detailed scoring breakdown.
 * @param {Array} transcript - Transcript of the voice interview (optional).
 * @param {Array<string>} aiAudioUrls - URLs to AI-generated audio files (optional).
 * @returns {Promise<Object>} The newly saved voice interview database record.
 * @throws {Error} Throws if unauthorized, user not found, or database save fails.
 */

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

/**
 * Generates detailed AI feedback for a completed voice interview.
 *
 * Constructs a prompt including the interview context and Q&A responses,
 * then requests the AI model to provide a JSON summary with scores and feedback.
 *
 * @async
 * @function generateVoiceFeedback
 * @param {Object} config - Interview configuration.
 * @param {string} config.level - Job level (e.g., "Junior", "Senior").
 * @param {string} config.role - Role title (e.g., "Backend Developer").
 * @param {string} config.type - Interview type (e.g., "Technical").
 * @param {Array<{ question: string, answer: string }>} responses - Array of Q&A objects.
 * @returns {Promise<Object>} Parsed feedback JSON containing overall score, strengths, areas for improvement, and breakdown.
 * @throws {Error} Throws if feedback generation or JSON parsing fails.
 */
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

/**
 * Retrieves all voice interviews for the authenticated user.
 *
 * This function:
 * - Authenticates the user.
 * - Finds the user in the database by their Clerk user ID.
 * - Retrieves all voice interview records linked to the user.
 * - Returns the interviews sorted by creation date in descending order (most recent first).
 *
 * @async
 * @function getVoiceInterviews
 * @returns {Promise<Array>} Array of voice interview objects belonging to the user.
 * @throws {Error} Throws if the user is unauthorized or not found.
 */
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
