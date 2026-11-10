import { z } from "zod";

export const INTERVIEW_TYPES = {
    technical: { label: "Technical", description: "Concepts, problem solving and how you'd build things." },
    behavioral: { label: "Behavioral", description: "Teamwork, conflict, ownership and past experience." },
    mixed: { label: "Mixed", description: "A bit of both, like most first-round interviews." },
};

export const LEVELS = {
    entry: { label: "Entry level", description: "Internships, graduate and junior roles." },
    mid: { label: "Mid level", description: "Two to five years of experience." },
    senior: { label: "Senior", description: "Leading projects and making design calls." },
};

// How many main questions an interview has. Follow-ups come on top.
export const QUESTION_COUNT = { min: 3, max: 10, default: 5 };

// A spoken answer plus the odd follow-up comes to roughly three minutes a question.
export const minutesFor = (count) => Math.round((count * 3) / 5) * 5 || 5;

// Voices are Groq's Orpheus voices. Without them the browser's voice is used.
export const INTERVIEWERS = {
    hannah: { name: "Hannah", voice: "hannah", pronoun: "she", description: "Warm and steady" },
    daniel: { name: "Daniel", voice: "daniel", pronoun: "he", description: "Calm and direct" },
};

// At most one follow-up per question, so an interview can't run away.
export const MAX_FOLLOW_UPS_PER_QUESTION = 1;

// Long enough for a thorough spoken answer, short enough to keep prompts sane.
export const MAX_ANSWER_CHARS = 4000;

export const dailyLimit = () => Number(process.env.VOICE_INTERVIEW_DAILY_LIMIT) || 5;

export const interviewConfigSchema = z.object({
    role: z.string().trim().min(2, "Enter the role you're preparing for").max(80, "Keep the role under 80 characters"),
    type: z.enum(Object.keys(INTERVIEW_TYPES)),
    level: z.enum(Object.keys(LEVELS)),
    questionCount: z.coerce
        .number()
        .int("Pick a whole number of questions")
        .min(QUESTION_COUNT.min, `Pick at least ${QUESTION_COUNT.min} questions`)
        .max(QUESTION_COUNT.max, `Pick at most ${QUESTION_COUNT.max} questions`),
    focus: z
        .array(z.string().trim().min(1).max(40))
        .max(5, "Pick up to five topics")
        .default([]),
    interviewer: z.enum(Object.keys(INTERVIEWERS)).default("hannah"),
});

export const answerInputSchema = z.object({
    turnIndex: z.number().int().min(0),
    answer: z.string().trim().max(MAX_ANSWER_CHARS, "That answer is too long. Try to keep it under a few minutes."),
    inputMode: z.enum(["voice", "typed"]),
    durationMs: z.number().int().min(0).max(30 * 60 * 1000).default(0),
    skipped: z.boolean().default(false),
});
