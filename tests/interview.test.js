import { describe, expect, it } from "vitest";
import { answerInputSchema, interviewConfigSchema } from "@/lib/interview/config";
import { buildTurn, classifyAnswer, nextStep, parseFollowUp, shouldConsiderFollowUp } from "@/lib/interview/engine";
import { answerMetrics, countWords, findFillers, paceLabel } from "@/lib/interview/metrics";
import { InvalidPlanError, normalizePlan } from "@/lib/interview/plan";
import { closingLine, interviewerFor, leadIn, openingLine } from "@/lib/interview/script";
import { searchRoles } from "@/lib/interview/roles";
import { splitForSpeech } from "@/lib/interview/speech";
import { buildFeedback, parseEvaluation, scoreFromRatings } from "@/lib/interview/scoring";

const plan = {
    questions: [
        { id: "q1", kind: "behavioral", topic: "Teamwork", text: "Tell me about a time you disagreed with a teammate.", lookFor: ["a", "b"] },
        { id: "q2", kind: "technical", topic: "APIs", text: "How would you design a rate limiter for an API?", lookFor: ["a", "b"] },
    ],
};

const voice = (answer, durationMs = 60000) => ({ answer, inputMode: "voice", durationMs, skipped: false });

function answer(turns, input, followUp = null) {
    const step = nextStep(plan, turns);
    return [...turns, buildTurn(step, input, { followUp })];
}

describe("interview config", () => {
    it("accepts a normal setup and fills defaults", () => {
        const parsed = interviewConfigSchema.parse({ role: " Frontend Developer ", type: "mixed", level: "entry", questionCount: "5" });
        expect(parsed).toEqual({ role: "Frontend Developer", type: "mixed", level: "entry", questionCount: 5, focus: [], interviewer: "hannah" });
    });

    it("rejects lengths that aren't offered", () => {
        expect(interviewConfigSchema.safeParse({ role: "QA", type: "mixed", level: "entry", questionCount: 40 }).success).toBe(false);
    });

    it("caps answer length", () => {
        const result = answerInputSchema.safeParse({ turnIndex: 0, answer: "a".repeat(5000), inputMode: "voice" });
        expect(result.success).toBe(false);
    });
});

describe("normalizePlan", () => {
    const config = { questionCount: 2 };
    const question = { kind: "technical", topic: "React", text: "What does useEffect do and when does it run?", lookFor: ["x", "y"] };

    it("numbers the questions and drops extras", () => {
        const result = normalizePlan({ questions: [question, question, question] }, config);
        expect(result.questions.map((q) => q.id)).toEqual(["q1", "q2"]);
    });

    it("rejects a plan with too few questions", () => {
        expect(() => normalizePlan({ questions: [question] }, config)).toThrow(InvalidPlanError);
    });

    it("rejects a malformed plan", () => {
        expect(() => normalizePlan({ questions: [{ text: "hi" }] }, config)).toThrow(InvalidPlanError);
    });

    it("accepts the loose shapes models really return", () => {
        const loose = [
            { kind: "Behavioural", topic: "Conflict", text: "Tell me about a disagreement with a teammate.", lookFor: ["situation", "action", "result", "lesson", "reflection", "extra"] },
            { kind: "TECHNICAL", text: "Explain how you would cache an expensive API call.", lookFor: "not a list" },
        ];
        const result = normalizePlan(loose, config);
        expect(result.questions.map((q) => q.kind)).toEqual(["behavioral", "technical"]);
        expect(result.questions[0].lookFor).toHaveLength(5);
        expect(result.questions[1]).toMatchObject({ topic: "General", lookFor: ["not a list"] });
    });

    it("skips one broken question when there are enough good ones", () => {
        const result = normalizePlan({ questions: [{ text: "?" }, question, question] }, config);
        expect(result.questions).toHaveLength(2);
    });
});

describe("nextStep", () => {
    it("starts with the first question", () => {
        expect(nextStep(plan, [])).toMatchObject({ type: "question", kind: "main", questionId: "q1", number: 1, total: 2 });
    });

    it("asks the follow-up before moving on", () => {
        const turns = answer([], voice("We disagreed about the API shape"), "What did you do to resolve it?");
        expect(nextStep(plan, turns)).toMatchObject({ kind: "follow-up", questionId: "q1", prompt: "What did you do to resolve it?" });
    });

    it("asks at most one follow-up per question", () => {
        let turns = answer([], voice("We disagreed"), "Why?");
        turns = answer(turns, voice("Because of deadlines"));
        expect(nextStep(plan, turns)).toMatchObject({ kind: "main", questionId: "q2", number: 2 });
    });

    it("finishes after the last question", () => {
        let turns = answer([], voice("one"));
        turns = answer(turns, { ...voice(""), skipped: true });
        expect(nextStep(plan, turns)).toEqual({ type: "complete", total: 2 });
    });
});

describe("classifyAnswer", () => {
    const turns = answer([], voice("first answer"));

    it("accepts the next turn", () => {
        expect(classifyAnswer(turns, { turnIndex: 1, answer: "next" })).toBe("new");
    });

    it("recognises a retried submission", () => {
        expect(classifyAnswer(turns, { turnIndex: 0, answer: "first answer", skipped: false })).toBe("duplicate");
    });

    it("rejects an answer for a turn that's already been answered differently", () => {
        expect(classifyAnswer(turns, { turnIndex: 0, answer: "something else" })).toBe("stale");
        expect(classifyAnswer(turns, { turnIndex: 5, answer: "from the future" })).toBe("stale");
    });
});

describe("follow-ups", () => {
    const step = { kind: "main" };

    it("only considers real answers to main questions", () => {
        expect(shouldConsiderFollowUp(step, voice("I led the migration to TypeScript across three services last year"))).toBe(true);
        expect(shouldConsiderFollowUp(step, voice("Not sure"))).toBe(false);
        expect(shouldConsiderFollowUp({ kind: "follow-up" }, voice("I led the migration to TypeScript across three services"))).toBe(false);
        expect(shouldConsiderFollowUp(step, { ...voice("long enough answer here with many words in it"), skipped: true })).toBe(false);
    });

    it("reads the follow-up and the acknowledgment", () => {
        expect(parseFollowUp({ acknowledgment: " Interesting that you  chose context. ", followUp: "  How did   you measure that? " })).toEqual({
            ack: "Interesting that you chose context.",
            followUp: "How did you measure that?",
        });
        expect(parseFollowUp({ followUp: null })).toEqual({ followUp: null, ack: null });
    });

    it("treats anything malformed as no follow-up", () => {
        expect(parseFollowUp({ question: "Why?" })).toEqual({ followUp: null, ack: null });
        expect(parseFollowUp("not json")).toEqual({ followUp: null, ack: null });
    });
});

describe("metrics", () => {
    it("counts words and fillers without catching normal uses of like", () => {
        expect(countWords("I've built two REST APIs.")).toBe(5);
        expect(findFillers("Um, so it was, like, you know, hard. I like Go.")).toEqual(["um", "you know", "like"]);
    });

    it("labels pace", () => {
        expect(paceLabel(90)).toBe("slow");
        expect(paceLabel(140)).toBe("steady");
        expect(paceLabel(200)).toBe("fast");
        expect(paceLabel(null)).toBeNull();
    });

    it("works out pace only from spoken answers", () => {
        const turns = [
            { ...voice("one two three four five six seven eight nine ten ".repeat(14).trim(), 60000) },
            { answer: "typed answer with a few words", inputMode: "typed", durationMs: 0, skipped: false },
            { answer: "", inputMode: "voice", durationMs: 0, skipped: true },
        ];
        const metrics = answerMetrics(turns);
        expect(metrics.wordsPerMinute).toBe(140);
        expect(metrics.pace).toBe("steady");
        expect(metrics.answers).toBe(2);
        expect(metrics.skipped).toBe(1);
    });
});

describe("scoring", () => {
    const ratings = (n) => ({ relevance: n, depth: n, structure: n, communication: n });

    it("maps ratings onto 0 to 100", () => {
        expect(scoreFromRatings(ratings(1))).toBe(0);
        expect(scoreFromRatings(ratings(3))).toBe(50);
        expect(scoreFromRatings(ratings(5))).toBe(100);
        expect(scoreFromRatings({ relevance: 5, depth: 5, structure: 1, communication: 1 })).toBe(60);
    });

    it("counts skipped questions as zero and ignores ratings the model gave them", () => {
        let turns = answer([], voice("A solid answer about resolving a disagreement"));
        turns = answer(turns, { ...voice(""), skipped: true });

        const evaluation = parseEvaluation({
            summary: "Good start.",
            questions: [
                { questionId: "q1", scores: ratings(5), strengths: ["Clear"], improvements: [], strongerAnswer: "..." },
                { questionId: "q2", scores: ratings(5) },
            ],
        });

        const feedback = buildFeedback(plan, turns, evaluation);
        expect(feedback.questions.map((q) => q.score)).toEqual([100, 0]);
        expect(feedback.questions[1].skipped).toBe(true);
        expect(feedback.score).toBe(50);
        expect(feedback.criteria.relevance).toBe(5);
    });

    it("leaves out questions that were never reached", () => {
        const turns = answer([], voice("Only answered the first one"));
        const feedback = buildFeedback(plan, turns, parseEvaluation({ summary: "Ended early.", questions: [{ questionId: "q1", scores: ratings(3) }] }));
        expect(feedback.questions).toHaveLength(1);
        expect(feedback.score).toBe(50);
    });

    it("pulls out-of-range ratings into 1 to 5 and trims long text", () => {
        const evaluation = parseEvaluation({
            summary: "x".repeat(900),
            questions: [{ questionId: "q1", scores: { relevance: 0, depth: 4.6, structure: "3", communication: 7 }, strengths: ["a", "b", "c", "d"] }],
        });
        expect(evaluation.questions[0].scores).toEqual({ relevance: 1, depth: 5, structure: 3, communication: 5 });
        expect(evaluation.questions[0].strengths).toHaveLength(3);
        expect(evaluation.summary.length).toBeLessThanOrEqual(800);
    });

    it("rejects malformed feedback", () => {
        expect(() => parseEvaluation({ summary: "x", questions: [{ questionId: "q1", scores: { relevance: 9 } }] })).toThrow();
    });
});

describe("splitForSpeech", () => {
    it("keeps short text whole", () => {
        expect(splitForSpeech("Tell me about yourself.")).toEqual(["Tell me about yourself."]);
    });

    it("splits long text on sentence boundaries", () => {
        const sentence = "This sentence is exactly long enough to matter here. ";
        const chunks = splitForSpeech(sentence.repeat(8), 120);
        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.every((chunk) => chunk.length <= 120)).toBe(true);
        expect(chunks.join(" ")).toBe(sentence.repeat(8).trim());
    });

    it("breaks a single long sentence at commas, then between words", () => {
        const long = "When the team disagreed, I wrote down both options, built a small prototype of each, measured them on a slow phone, and shared the numbers before we decided anything at all together";
        const chunks = splitForSpeech(long, 60);
        expect(chunks.every((chunk) => chunk.length <= 60)).toBe(true);
        expect(chunks[0]).toBe("When the team disagreed, I wrote down both options,");
        expect(chunks.join(" ")).toBe(long);
    });
});

describe("conversation script", () => {
    const step = (number, kind = "main") => ({ type: "question", kind, number, total: 3 });
    const turn = (extra = {}) => ({ answer: "x", skipped: false, ...extra });

    it("opens and closes by name", () => {
        expect(openingLine({ interviewer: "Hannah", candidate: "Kawser", role: "QA Engineer", type: "technical", total: 5 })).toMatch(
            /^Hi Kawser, I'm Hannah\. .*technical interview for the QA Engineer role\. I've got 5 questions/
        );
        expect(openingLine({ interviewer: "Daniel", candidate: "", role: "QA", type: "mixed", total: 3 })).toMatch(/^Hi, I'm Daniel\. .* an interview for/);
        expect(closingLine({ candidate: "Kawser" })).toMatch(/Thanks, Kawser/);
    });

    it("leads into each question naturally", () => {
        expect(leadIn(step(1), [])).toBe("Let's start with this one.");
        expect(leadIn(step(1, "follow-up"), [turn({ ack: "Interesting that you chose context." })])).toBe("Interesting that you chose context.");
        expect(leadIn(step(3), [turn(), turn()])).toMatch(/Last question\.$/);
        expect(leadIn(step(2), [turn({ skipped: true })])).toMatch(/^No problem\./);
    });

    it("falls back to the default interviewer", () => {
        expect(interviewerFor({ questions: [] }).name).toBe("Hannah");
        expect(interviewerFor({ interviewer: "daniel" }).voice).toBe("daniel");
    });
});

describe("searchRoles", () => {
    it("ranks roles that start with the query first", () => {
        expect(searchRoles("dev").map((r) => r.role).slice(0, 2)).toEqual(["DevOps Engineer", "Backend Developer"]);
        expect(searchRoles("data")[0].role).toBe("Data Analyst");
    });

    it("finds words inside a role and returns nothing for an empty query", () => {
        expect(searchRoles("ux").map((r) => r.role)).toContain("UI/UX Designer");
        expect(searchRoles("  ")).toEqual([]);
    });
});
