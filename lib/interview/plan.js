import { z } from "zod";
import { INTERVIEW_TYPES, LEVELS } from "./config";
import { clippedText, describeIssue, stringList, strictObject, textList } from "./schema-helpers";

// "Behavioural", "Technical", "situational" and so on all land in one of the two.
const kind = z
    .string()
    .transform((value) => (/behav|situation|soft|culture|hr/i.test(value) ? "behavioral" : "technical"));

const questionSchema = z.object({
    kind: kind.catch("technical"),
    topic: clippedText(60).catch("General"),
    text: z.string().trim().min(10).max(600),
    // What a strong answer covers. Never shown during the interview; used for scoring.
    lookFor: textList(5, 200),
});

// Some models return the list on its own instead of inside { questions }.
const planSchema = z.preprocess(
    (raw) => (Array.isArray(raw) ? { questions: raw } : raw),
    z.object({ questions: z.array(z.unknown()) })
);

// What the model is asked to return, enforced by providers that support it.
export const PLAN_JSON_SCHEMA = strictObject({
    questions: {
        type: "array",
        items: strictObject({
            kind: { type: "string", enum: ["technical", "behavioral"] },
            topic: { type: "string" },
            text: { type: "string" },
            lookFor: stringList,
        }),
    },
});

export class InvalidPlanError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidPlanError";
    }
}

function describeProfile(profile) {
    const lines = [];
    if (profile.industry) lines.push(`Industry: ${profile.industry.replace(/-/g, " ")}`);
    if (profile.experience != null) lines.push(`Years of experience: ${profile.experience}`);
    if (profile.skills?.length) lines.push(`Skills: ${profile.skills.slice(0, 15).join(", ")}`);
    if (profile.bio) lines.push(`About them: ${profile.bio.slice(0, 500)}`);
    return lines.length ? lines.join("\n") : "No profile details.";
}

const MIX = {
    technical: "All questions are technical.",
    behavioral: "All questions are behavioral.",
    mixed: "Roughly half technical and half behavioral, starting with a short behavioral warm-up.",
};

export function buildPlanPrompt(config, profile) {
    return `You are planning a realistic spoken job interview.

Role: ${config.role}
Level: ${LEVELS[config.level].label}
Interview type: ${INTERVIEW_TYPES[config.type].label}. ${MIX[config.type]}
Number of questions: ${config.questionCount}
${config.focus.length ? `Topics the candidate wants to practise: ${config.focus.join(", ")}` : ""}

Candidate profile:
${describeProfile(profile)}

Write exactly ${config.questionCount} questions an interviewer would ask out loud.
- Each question must be answerable by speaking for one to three minutes. No coding exercises, no "write a function".
- Match the difficulty to the level. Order them from easier to harder.
- Phrase them the way a person talks: one question at a time, under 40 words, no lists or markdown.
- Don't repeat a topic.
- For each, list 2 to 5 short points a strong answer would cover.

Return JSON only, in this shape:
{"questions":[{"kind":"technical"|"behavioral","topic":"short topic","text":"the question","lookFor":["point","point"]}]}`;
}

// Checks what the model returned and turns it into the stored plan. Extra
// questions are dropped; too few is an error so the caller can try again.
export function normalizePlan(raw, config) {
    const parsed = planSchema.safeParse(raw);
    if (!parsed.success) throw new InvalidPlanError(`The interview plan wasn't in the expected format (${describeIssue(parsed.error)})`);

    // Keep every usable question, skipping any single broken one.
    const questions = parsed.data.questions
        .map((question) => questionSchema.safeParse(question))
        .filter((result) => result.success)
        .map((result) => result.data)
        .slice(0, config.questionCount);
    if (questions.length < config.questionCount) {
        throw new InvalidPlanError(`Expected ${config.questionCount} questions, got ${questions.length}`);
    }

    return {
        questions: questions.map((question, index) => ({ id: `q${index + 1}`, ...question })),
    };
}
