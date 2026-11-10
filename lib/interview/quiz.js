import { z } from "zod";
import { clippedText, strictObject, stringList } from "./schema-helpers";

// The knowledge quiz: multiple-choice questions written for the person's
// industry and skills. The ten questions are written as two halves at the
// same time, each with its own angle so they don't overlap, which roughly
// halves the wait.

export const QUIZ_HALVES = [
    { count: 5, angle: "core concepts and fundamentals: definitions, how things work, and why" },
    { count: 5, angle: "practical, scenario-based questions: debugging, trade-offs, tooling and best practice" },
];

export const QUIZ_JSON_SCHEMA = strictObject({
    questions: {
        type: "array",
        items: strictObject({
            question: { type: "string" },
            options: stringList,
            correctAnswer: { type: "string" },
            explanation: { type: "string" },
        }),
    },
});

const questionSchema = z
    .object({
        question: clippedText(400).pipe(z.string().min(8)),
        options: z.array(z.coerce.string().trim().min(1).max(200)),
        correctAnswer: z.coerce.string().trim(),
        explanation: clippedText(600).catch(""),
    })
    .transform((question, context) => {
        const options = [...new Set(question.options)];
        // Models sometimes answer with the letter ("B") instead of the text.
        const letter = /^[A-D]$/i.test(question.correctAnswer) ? options["ABCD".indexOf(question.correctAnswer.toUpperCase())] : null;
        const correctAnswer = letter ?? options.find((option) => option.toLowerCase() === question.correctAnswer.toLowerCase());
        if (options.length !== 4 || !correctAnswer) {
            context.addIssue({ code: "custom", message: "Needs four distinct options and one of them correct" });
            return z.NEVER;
        }
        return { ...question, options, correctAnswer };
    });

// A topic narrows the whole quiz to one skill, e.g. a gap picked out on
// the insights page.
export function buildQuizPrompt({ industry, skills }, { count, angle }, topic) {
    return `Write ${count} multiple-choice questions for a technical interview practice quiz.

Candidate: ${industry ? `works in ${industry}` : "a software professional"}${skills?.length ? `, with skills in ${skills.join(", ")}` : ""}.
${topic ? `Every question is about ${topic}, at a level an interviewer would expect.\n` : ""}Focus of these questions: ${angle}.

Rules:
- Each question has exactly 4 options and exactly one correct answer.
- correctAnswer is the full text of the correct option, copied exactly.
- Mix easy, medium and hard. Keep each question under 40 words and each option under 20 words.
- explanation: one or two sentences on why the answer is right.

Return JSON only: {"questions":[{"question":"","options":["","","",""],"correctAnswer":"","explanation":""}]}`;
}

// Keeps the usable questions from a reply and drops the rest.
export function parseQuizQuestions(raw) {
    const list = Array.isArray(raw) ? raw : raw?.questions;
    if (!Array.isArray(list)) return [];
    return list.map((question) => questionSchema.safeParse(question)).flatMap((result) => (result.success ? [result.data] : []));
}

// Joins the halves, drops repeats, and refuses a quiz that's too short to be worth taking.
export function combineQuizHalves(halves, minimum = 6) {
    const seen = new Set();
    const questions = halves.flat().filter((question) => {
        const key = question.question.toLowerCase().replace(/\W+/g, " ").trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    if (questions.length < minimum) throw new Error(`Only ${questions.length} usable questions came back`);
    return questions.slice(0, 10);
}
