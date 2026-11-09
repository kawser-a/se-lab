import { z } from "zod";

export const SUMMARY_LEVELS = {
    student: "Student",
    graduate: "Fresh graduate",
    junior: "1–2 years of experience",
    mid: "3–5 years of experience",
    senior: "6+ years of experience",
    switching: "Changing careers",
};

export const summaryBriefSchema = z.object({
    role: z.string().trim().max(100).default(""),
    level: z.union([z.literal(""), z.enum(Object.keys(SUMMARY_LEVELS))]).default(""),
    keywords: z.array(z.string().trim().max(60)).max(12).default([]),
    about: z.string().trim().max(600).default(""),
});
