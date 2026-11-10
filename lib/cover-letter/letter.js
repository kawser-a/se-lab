import { z } from "zod";

export const TONES = {
    confident: { label: "Confident", hint: "Direct and assured. Leads with results.", prompt: "confident and direct, leading with results, without bragging" },
    warm: { label: "Warm", hint: "Friendly and personal. Good for startups.", prompt: "warm and personable, showing genuine interest in the team and its work" },
    formal: { label: "Formal", hint: "Traditional and polished. Good for corporate roles.", prompt: "formal and polished, as for a traditional corporate or public-sector employer" },
};

export const LENGTHS = {
    short: { label: "Short", words: [150, 220], paragraphs: 3 },
    standard: { label: "Standard", words: [250, 330], paragraphs: 4 },
    detailed: { label: "Detailed", words: [350, 430], paragraphs: 5 },
};

export const MIN_DESCRIPTION = 80;
export const MAX_DESCRIPTION = 8000;

const optional = (max) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((value) => value || null);

export const letterRequestSchema = z.object({
    companyName: z.string().trim().min(1, "Add the company's name").max(120, "Keep the company name under 120 characters"),
    jobTitle: z.string().trim().min(2, "Add the job title").max(120, "Keep the job title under 120 characters"),
    hiringManager: optional(120),
    jobDescription: z
        .string()
        .trim()
        .min(MIN_DESCRIPTION, "Paste the job description, or at least its main requirements, so the letter can answer them")
        .max(MAX_DESCRIPTION, `That's a long description. Keep it under ${MAX_DESCRIPTION.toLocaleString("en")} characters by leaving out the company boilerplate`),
    resumeId: optional(40),
    tone: z.enum(Object.keys(TONES)).default("confident"),
    length: z.enum(Object.keys(LENGTHS)).default("standard"),
});

export const letterDetailsSchema = z.object({
    companyName: letterRequestSchema.shape.companyName,
    jobTitle: letterRequestSchema.shape.jobTitle,
    hiringManager: optional(120),
});

export const letterContentSchema = z.string().max(12000, "The letter is too long to save. Try trimming it.");

// ---------------------------------------------------------------------------
// The candidate's background, as the AI sees it.

const MAX_BACKGROUND = 7000;

const period = (item) => {
    const start = item.start?.slice(0, 4);
    const end = item.current ? "present" : item.end?.slice(0, 4);
    return start || end ? ` (${[start, end].filter(Boolean).join("–")})` : "";
};

const bullets = (list = []) => list.filter(Boolean).map((line) => `  - ${line}`);

// Turns a CV into short plain text: what someone did, where and when, in
// the order the CV lists it. Hidden sections and items stay out, as they do
// on the CV itself.
export function backgroundFromResume(data) {
    const lines = [];
    const { basics = {}, sections = [] } = data ?? {};
    if (basics.headline) lines.push(`Headline: ${basics.headline}`);

    for (const section of sections) {
        if (section.visible === false) continue;
        if (section.type === "summary") {
            if (section.content) lines.push("", `${section.title}:`, section.content);
            continue;
        }

        const items = (section.items ?? []).filter((item) => item.visible !== false);
        if (!items.length) continue;
        lines.push("", `${section.title}:`);

        for (const item of items) {
            switch (section.type) {
                case "experience":
                    lines.push(`- ${[item.role, item.organisation].filter(Boolean).join(" at ")}${period(item)}`, ...bullets(item.bullets));
                    break;
                case "projects":
                    lines.push(`- ${item.name}${item.role ? `, ${item.role}` : ""}${item.tech?.length ? ` [${item.tech.join(", ")}]` : ""}`, ...bullets(item.bullets));
                    break;
                case "education":
                    lines.push(`- ${[item.degree, item.institution].filter(Boolean).join(", ")}${period(item)}${item.result ? `, ${item.result}` : ""}`, ...bullets(item.highlights));
                    break;
                case "skills":
                    lines.push(`- ${item.group ? `${item.group}: ` : ""}${item.keywords.join(", ")}`);
                    break;
                case "publications":
                    lines.push(`- ${item.title}${item.venue ? `, ${item.venue}` : ""}${item.year ? ` (${item.year})` : ""}`);
                    break;
                case "awards":
                case "certifications":
                    lines.push(`- ${item.name}${item.issuer ? `, ${item.issuer}` : ""}${item.note ? `: ${item.note}` : ""}`);
                    break;
                case "languages":
                    lines.push(`- ${item.language}${item.level ? ` (${item.level})` : ""}`);
                    break;
                case "custom":
                    lines.push(`- ${[item.title, item.subtitle].filter(Boolean).join(", ")}${period(item)}`, ...bullets(item.bullets));
                    break;
                default:
                    break;
            }
        }
    }

    const text = lines.join("\n").trim();
    return text.length > MAX_BACKGROUND ? `${text.slice(0, MAX_BACKGROUND)}\n…` : text;
}

export function backgroundFromProfile(user) {
    return [
        user.experience != null && `Years of experience: ${user.experience}`,
        user.skills?.length && `Skills: ${user.skills.join(", ")}`,
        user.bio && `About: ${user.bio}`,
    ]
        .filter(Boolean)
        .join("\n");
}

// ---------------------------------------------------------------------------
// Asking for the letter.

export const LETTER_JSON_SCHEMA = {
    type: "object",
    properties: {
        requirements: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    requirement: { type: "string" },
                    evidence: { type: ["string", "null"] },
                },
                required: ["requirement", "evidence"],
                additionalProperties: false,
            },
        },
        paragraphs: { type: "array", items: { type: "string" } },
    },
    required: ["requirements", "paragraphs"],
    additionalProperties: false,
};

const RULES = `Rules for the letter:
- Only use facts from the candidate's background. Never invent employers, numbers, dates, degrees or achievements.
- Where a specific detail would help but isn't in the background, write a short placeholder in square brackets for the candidate to fill in, such as [a project where you led the release]. Use at most three placeholders.
- Open with why this role at this company, not with "I am writing to apply".
- Tie each body paragraph to one or two of the job's main requirements, with evidence from the background.
- Be honest about gaps: don't claim a skill the background doesn't show. Show related experience instead, or leave it out.
- Plain text. No markdown, no bullet points, no headings, no contact details or date (those are added separately).
- No clichés such as "I am a perfect fit", "passionate", "team player", "hit the ground running" or "dynamic".`;

export function buildLetterPrompt({ job, background, tone, length, name }) {
    const size = LENGTHS[length] ?? LENGTHS.standard;
    const greeting = job.hiringManager ? `Dear ${job.hiringManager},` : "Dear Hiring Manager,";

    return `You are an experienced recruiter helping a candidate write a cover letter they will send under their own name.

The job: ${job.jobTitle} at ${job.companyName}.
Job description:
"""
${job.jobDescription}
"""

The candidate${name ? ` (${name})` : ""}:
"""
${background || "No background given."}
"""

First, list the 4 to 7 most important requirements in the job description, each in a few words. For each, quote or closely paraphrase the strongest evidence from the candidate's background in one short sentence, or null if the background doesn't show it.

Then write the letter in ${size.paragraphs} paragraphs and ${size.words[0]} to ${size.words[1]} words, in a ${TONES[tone]?.prompt ?? TONES.confident.prompt} tone.
The first paragraph is exactly "${greeting}". The last paragraph is the sign-off, "Kind regards," or "Sincerely," followed by a newline and ${name ? `"${name}"` : "[Your name]"}.

${RULES}

Reply with JSON: {"requirements": [{"requirement": "...", "evidence": "..." or null}], "paragraphs": ["..."]}`;
}

export const REWRITES = {
    shorter: { done: "Made it shorter", label: "Make it shorter", prompt: "Cut it to about two thirds of its length. Keep the strongest evidence and the sign-off." },
    stronger: { done: "Rewrote the opening", label: "Make the opening stronger", prompt: "Rewrite only the first body paragraph so it opens with a specific reason for wanting this role and one concrete result. Leave the rest as it is." },
    formal: { done: "Made it more formal", label: "Make it more formal", prompt: "Make the tone more formal and polished without making it stiff." },
    warm: { done: "Made it warmer", label: "Make it warmer", prompt: "Make the tone warmer and more personal without becoming casual." },
    proofread: { done: "Fixed the grammar", label: "Fix grammar only", prompt: "Correct spelling, grammar and punctuation only. Change nothing else." },
};

export const REWRITE_JSON_SCHEMA = {
    type: "object",
    properties: { paragraphs: { type: "array", items: { type: "string" } } },
    required: ["paragraphs"],
    additionalProperties: false,
};

export function buildRewritePrompt({ content, mode, job, background }) {
    return `You are editing a cover letter for ${job.jobTitle} at ${job.companyName}. The candidate has already edited it, so keep their wording wherever the change doesn't need it to move.

The letter:
"""
${content}
"""

The candidate's background, for facts only:
"""
${background || "No background given."}
"""

The change: ${REWRITES[mode].prompt}
Keep the greeting, the sign-off and any [placeholders] the candidate hasn't filled in yet.

${RULES}

Reply with JSON: {"paragraphs": ["..."]}`;
}

// ---------------------------------------------------------------------------
// Reading the reply.

export class InvalidLetterError extends Error {
    constructor(message = "The letter came back incomplete") {
        super(message);
        this.name = "InvalidLetterError";
    }
}

const clean = (text) =>
    String(text ?? "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/^#+\s*/gm, "")
        .replace(/[ \t]+\n/g, "\n")
        .trim();

export function joinParagraphs(paragraphs) {
    const text = (paragraphs ?? []).map(clean).filter(Boolean).join("\n\n");
    if (text.split(/\s+/).length < 40) throw new InvalidLetterError();
    return text;
}

export function parseLetter(raw) {
    const content = joinParagraphs(raw?.paragraphs);
    const requirements = (raw?.requirements ?? [])
        .map((item) => ({
            requirement: clean(item?.requirement).slice(0, 120),
            evidence: item?.evidence ? clean(item.evidence).slice(0, 300) || null : null,
        }))
        .filter((item) => item.requirement)
        .slice(0, 8);
    return { content, requirements };
}

// ---------------------------------------------------------------------------
// Helpers for the editor.

const PLACEHOLDER = /\[[^\]\n]{2,80}\]/g;

export function findPlaceholders(text) {
    return [...String(text ?? "").matchAll(PLACEHOLDER)].map((match) => ({ text: match[0], start: match.index, end: match.index + match[0].length }));
}

export function countWords(text) {
    const words = String(text ?? "").trim().match(/\S+/g);
    return words ? words.length : 0;
}

// Where a letter's length sits against what employers usually read.
export function lengthVerdict(words) {
    if (words < 150) return { tone: "low", label: "Quite short" };
    if (words <= 420) return { tone: "good", label: "Good length" };
    return { tone: "high", label: "Long. Most readers skim past 400 words" };
}

export const paragraphsOf = (text) =>
    String(text ?? "")
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

export function letterFileName({ companyName, jobTitle, name }, extension) {
    const slug = [name, "cover letter", companyName, jobTitle]
        .filter(Boolean)
        .join(" ")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-|-$/g, "");
    return `${slug || "cover-letter"}.${extension}`;
}
