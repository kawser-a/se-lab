import { z } from "zod";

const id = z.string().min(1).max(40);
const short = z.string().trim().max(160).default("");
const long = z.string().trim().max(2000).default("");
const url = z.string().trim().max(300).default("");
// Dates come from <input type="month">, so they are "YYYY-MM" or empty.
const month = z
    .string()
    .regex(/^(\d{4}-\d{2})?$/, "Use the month picker")
    .default("");
const list = z.array(z.string().trim().max(400)).max(20).default([]);

const item = (shape) =>
    z.object({ id, visible: z.boolean().default(true), ...shape });

export const itemSchemas = {
    experience: item({
        role: short,
        organisation: short,
        location: short,
        start: month,
        end: month,
        current: z.boolean().default(false),
        bullets: list,
    }),
    education: item({
        degree: short,
        institution: short,
        location: short,
        start: month,
        end: month,
        result: short,
        thesis: short,
        highlights: list,
    }),
    projects: item({
        name: short,
        role: short,
        link: url,
        start: month,
        end: month,
        tech: list,
        bullets: list,
    }),
    skills: item({
        group: short,
        keywords: list,
    }),
    publications: item({
        authors: z.string().trim().max(600).default(""),
        title: z.string().trim().max(400).default(""),
        venue: short,
        year: z.string().trim().max(10).default(""),
        kind: z.enum(["journal", "conference", "preprint", "other"]).default("conference"),
        status: z.enum(["published", "accepted", "under-review"]).default("published"),
        link: url,
    }),
    awards: item({
        name: short,
        issuer: short,
        date: month,
        link: url,
        note: short,
    }),
    certifications: item({
        name: short,
        issuer: short,
        date: month,
        link: url,
        note: short,
    }),
    languages: item({
        language: short,
        level: short,
    }),
    portfolio: item({
        title: short,
        link: url,
        note: short,
    }),
    custom: item({
        title: short,
        subtitle: short,
        start: month,
        end: month,
        bullets: list,
    }),
};

export const SECTION_TYPES = ["summary", ...Object.keys(itemSchemas)];

const sectionBase = {
    id,
    title: z.string().trim().min(1, "Give the section a name").max(60),
    visible: z.boolean().default(true),
};

const summarySection = z.object({
    ...sectionBase,
    type: z.literal("summary"),
    content: long,
});

const itemSections = Object.entries(itemSchemas).map(([type, schema]) =>
    z.object({
        ...sectionBase,
        type: z.literal(type),
        items: z.array(schema).max(50).default([]),
    })
);

export const sectionSchema = z.discriminatedUnion("type", [summarySection, ...itemSections]);

export const resumeDataSchema = z.object({
    basics: z.object({
        name: short,
        headline: short,
        email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).default(""),
        phone: short,
        location: short,
        links: z
            .array(z.object({ id, label: z.string().trim().max(40).default(""), url }))
            .max(8)
            .default([]),
    }),
    sections: z.array(sectionSchema).max(20),
});

export const resumeThemeSchema = z.object({
    templateId: z.enum(["developer", "academic", "creative", "graduate"]),
    fontPair: z.enum(["inter", "grotesk", "serif"]),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    density: z.enum(["compact", "normal", "relaxed"]),
    margins: z.enum(["narrow", "normal", "wide"]),
    pageSize: z.enum(["A4", "LETTER"]),
    fitToOnePage: z.boolean(),
    citationStyle: z.enum(["ieee", "apa"]),
});

export const resumeTitleSchema = z.string().trim().min(1, "Give your CV a name").max(80);
