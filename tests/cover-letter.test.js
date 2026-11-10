import { describe, expect, it } from "vitest";
import {
    backgroundFromProfile,
    backgroundFromResume,
    buildLetterPrompt,
    buildRewritePrompt,
    countWords,
    findPlaceholders,
    InvalidLetterError,
    letterFileName,
    letterRequestSchema,
    lengthVerdict,
    paragraphsOf,
    parseLetter,
} from "@/lib/cover-letter/letter";

const body = "I have spent three years building React interfaces for payment products, and I would like to bring that to your checkout team. ".repeat(3);

const cv = {
    basics: { name: "Ayesha Rahman", headline: "Frontend engineer" },
    sections: [
        { id: "s1", type: "summary", title: "Summary", visible: true, content: "Frontend engineer focused on payments." },
        {
            id: "s2",
            type: "experience",
            title: "Experience",
            visible: true,
            items: [
                { id: "e1", visible: true, role: "Frontend Engineer", organisation: "bKash", start: "2022-01", end: "", current: true, bullets: ["Cut checkout load time by 40%"] },
                { id: "e2", visible: false, role: "Intern", organisation: "Hidden Ltd", start: "2021-01", end: "2021-06", bullets: [] },
            ],
        },
        { id: "s3", type: "skills", title: "Skills", visible: true, items: [{ id: "k1", visible: true, group: "Frontend", keywords: ["React", "TypeScript"] }] },
        { id: "s4", type: "projects", title: "Projects", visible: false, items: [{ id: "p1", visible: true, name: "Secret project", bullets: [] }] },
    ],
};

describe("backgroundFromResume", () => {
    it("includes what the CV shows, in order", () => {
        const text = backgroundFromResume(cv);
        expect(text).toContain("Headline: Frontend engineer");
        expect(text).toContain("- Frontend Engineer at bKash (2022–present)");
        expect(text).toContain("  - Cut checkout load time by 40%");
        expect(text).toContain("- Frontend: React, TypeScript");
        expect(text.indexOf("Summary")).toBeLessThan(text.indexOf("Experience"));
    });

    it("leaves out hidden sections and items", () => {
        const text = backgroundFromResume(cv);
        expect(text).not.toContain("Hidden Ltd");
        expect(text).not.toContain("Secret project");
    });

    it("copes with an empty CV", () => {
        expect(backgroundFromResume({ basics: {}, sections: [] })).toBe("");
        expect(backgroundFromResume(null)).toBe("");
    });
});

describe("backgroundFromProfile", () => {
    it("lists what the profile has", () => {
        expect(backgroundFromProfile({ experience: 3, skills: ["React", "SQL"], bio: "Builds things." })).toBe("Years of experience: 3\nSkills: React, SQL\nAbout: Builds things.");
        expect(backgroundFromProfile({ experience: null, skills: [] })).toBe("");
    });
});

describe("letterRequestSchema", () => {
    const valid = { companyName: " Pathao ", jobTitle: "Frontend Engineer", jobDescription: "x".repeat(100) };

    it("fills in defaults and trims", () => {
        const result = letterRequestSchema.parse(valid);
        expect(result).toMatchObject({ companyName: "Pathao", tone: "confident", length: "standard", hiringManager: null, resumeId: null });
    });

    it("asks for enough of the job description", () => {
        const result = letterRequestSchema.safeParse({ ...valid, jobDescription: "React developer" });
        expect(result.success).toBe(false);
        expect(result.error.issues[0].path).toEqual(["jobDescription"]);
    });

    it("rejects an unknown tone", () => {
        expect(letterRequestSchema.safeParse({ ...valid, tone: "sarcastic" }).success).toBe(false);
    });
});

describe("buildLetterPrompt", () => {
    const job = { companyName: "Pathao", jobTitle: "Frontend Engineer", jobDescription: "Build rider apps with React.", hiringManager: "Nadia Karim" };

    it("greets the hiring manager by name and signs with the candidate's", () => {
        const prompt = buildLetterPrompt({ job, background: "React", tone: "warm", length: "short", name: "Ayesha Rahman" });
        expect(prompt).toContain('"Dear Nadia Karim,"');
        expect(prompt).toContain('"Ayesha Rahman"');
        expect(prompt).toContain("150 to 220 words");
        expect(prompt).toContain("warm and personable");
        expect(prompt).toContain("Never invent");
    });

    it("falls back to a generic greeting and a name placeholder", () => {
        const prompt = buildLetterPrompt({ job: { ...job, hiringManager: null }, background: "", tone: "nope", length: "nope" });
        expect(prompt).toContain('"Dear Hiring Manager,"');
        expect(prompt).toContain("[Your name]");
        expect(prompt).toContain("No background given.");
    });

    it("asks a rewrite to keep the candidate's edits and placeholders", () => {
        const prompt = buildRewritePrompt({ content: "Dear team,\n\nHello [your project]", mode: "shorter", job, background: "" });
        expect(prompt).toContain("two thirds");
        expect(prompt).toContain("keep their wording");
        expect(prompt).toContain("[placeholders]");
    });
});

describe("parseLetter", () => {
    it("joins paragraphs and strips stray markdown", () => {
        const { content, requirements } = parseLetter({
            paragraphs: ["Dear Hiring Manager,", `**${body}**`, "## Kind regards,\nAyesha"],
            requirements: [
                { requirement: "React", evidence: "Three years of React at bKash" },
                { requirement: "Mentoring", evidence: null },
                { requirement: "", evidence: "dropped" },
            ],
        });
        expect(content.startsWith("Dear Hiring Manager,\n\nI have spent")).toBe(true);
        expect(content).not.toContain("**");
        expect(content.endsWith("Kind regards,\nAyesha")).toBe(true);
        expect(requirements).toEqual([
            { requirement: "React", evidence: "Three years of React at bKash" },
            { requirement: "Mentoring", evidence: null },
        ]);
    });

    it("refuses a reply that isn't really a letter", () => {
        expect(() => parseLetter({ paragraphs: ["Dear Hiring Manager,", "Thanks."], requirements: [] })).toThrow(InvalidLetterError);
        expect(() => parseLetter({})).toThrow(InvalidLetterError);
    });
});

describe("editor helpers", () => {
    it("finds placeholders and where they are", () => {
        const text = "I led [a project you shipped] and [a result].";
        expect(findPlaceholders(text)).toEqual([
            { text: "[a project you shipped]", start: 6, end: 29 },
            { text: "[a result]", start: 34, end: 44 },
        ]);
        expect(findPlaceholders("No gaps here, [x] is too short.")).toEqual([]);
    });

    it("counts words and judges the length", () => {
        expect(countWords("  one two\n\nthree ")).toBe(3);
        expect(countWords("")).toBe(0);
        expect(lengthVerdict(120).tone).toBe("low");
        expect(lengthVerdict(300).tone).toBe("good");
        expect(lengthVerdict(500).tone).toBe("high");
    });

    it("splits paragraphs on blank lines", () => {
        expect(paragraphsOf("Dear team,\n\n First.\n  \nKind regards,\nAyesha")).toEqual(["Dear team,", "First.", "Kind regards,\nAyesha"]);
    });

    it("names the download after the person and the job", () => {
        expect(letterFileName({ name: "Ayesha Rahman", companyName: "Pathao Ltd.", jobTitle: "Frontend Engineer" }, "pdf")).toBe("Ayesha-Rahman-cover-letter-Pathao-Ltd-Frontend-Engineer.pdf");
        expect(letterFileName({}, "txt")).toBe("cover-letter.txt");
    });
});
