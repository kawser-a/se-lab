import { describe, expect, it } from "vitest";
import { buildQuizPrompt, combineQuizHalves, parseQuizQuestions, QUIZ_HALVES } from "@/lib/interview/quiz";

const question = (text, extra = {}) => ({
    question: text,
    options: ["useState", "useEffect", "useMemo", "useRef"],
    correctAnswer: "useMemo",
    explanation: "It caches a computed value between renders.",
    ...extra,
});

describe("parseQuizQuestions", () => {
    it("keeps well-formed questions", () => {
        expect(parseQuizQuestions({ questions: [question("Which hook caches a computed value?")] })).toHaveLength(1);
    });

    it("accepts a letter as the answer and maps it to the option", () => {
        const [parsed] = parseQuizQuestions([question("Which hook caches a computed value?", { correctAnswer: "c" })]);
        expect(parsed.correctAnswer).toBe("useMemo");
    });

    it("drops questions without four options or a matching answer", () => {
        const broken = [
            question("Too few options here?", { options: ["a", "b", "c"] }),
            question("Answer isn't one of the options?", { correctAnswer: "useCallback" }),
            question("Repeated options in this one?", { options: ["a", "a", "b", "c"], correctAnswer: "a" }),
        ];
        expect(parseQuizQuestions({ questions: broken })).toEqual([]);
        expect(parseQuizQuestions("nonsense")).toEqual([]);
    });
});

describe("combineQuizHalves", () => {
    const half = (prefix, n) => Array.from({ length: n }, (_, i) => parseQuizQuestions([question(`${prefix} question number ${i + 1}?`)])[0]);

    it("joins the halves and removes repeats", () => {
        const first = half("Alpha", 5);
        const combined = combineQuizHalves([first, [...half("Beta", 4), first[0]]]);
        expect(combined).toHaveLength(9);
    });

    it("still works when one half failed, as long as enough came back", () => {
        expect(() => combineQuizHalves([half("Alpha", 5), []])).toThrow();
        expect(combineQuizHalves([half("Alpha", 6), []])).toHaveLength(6);
    });
});

it("gives each half its own angle", () => {
    const [a, b] = QUIZ_HALVES.map((h) => buildQuizPrompt({ industry: "tech", skills: ["React"] }, h));
    expect(a).not.toBe(b);
    expect(a).toMatch(/React/);
});
