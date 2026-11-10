import { z } from "zod";
import { countryByCode } from "@/data/countries";
import { industries } from "@/data/industries";
import { clippedText, strictObject, stringList, textList } from "@/lib/interview/schema-helpers";

// Market insights for one industry in one country: salaries in local
// currency, how in demand each skill is, and what's changing. These are AI
// estimates, and the page says so. They're shared by everyone with the
// same industry and country, and refreshed weekly.

export const REFRESH_AFTER_DAYS = 7;
export const nextRefresh = (from = Date.now()) => new Date(from + REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000);

// "tech-software-development" -> { field: "Technology", specialization: "Software Development" }
export function describeIndustry(slug) {
    if (!slug) return null;
    const field = industries.find((industry) => slug === industry.id || slug.startsWith(`${industry.id}-`));
    const rest = field ? slug.slice(field.id.length + 1) : slug;
    const specialization = field?.subIndustries.find((sub) => matchesSpecialization(sub, rest)) ?? rest.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { field: field?.name ?? null, specialization };
}

export const toSlug = (text) => text.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Profiles saved before slugs were cleaned up only lowercased and swapped
// spaces for dashes ("ai/machine-learning", "data-science-&-analytics").
export const matchesSpecialization = (subIndustry, slugPart) => toSlug(subIndustry) === slugPart || subIndustry.toLowerCase().replace(/ /g, "-") === slugPart;

const DIRECTIONS = ["RISING", "STEADY", "FALLING"];

export const INSIGHTS_JSON_SCHEMA = strictObject({
    summary: { type: "string" },
    salaryRanges: {
        type: "array",
        items: strictObject({ role: { type: "string" }, min: { type: "number" }, median: { type: "number" }, max: { type: "number" } }),
    },
    growthRate: { type: "number" },
    demandLevel: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
    marketOutlook: { type: "string", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"] },
    skillDemand: {
        type: "array",
        items: strictObject({ skill: { type: "string" }, demand: { type: "number" }, direction: { type: "string", enum: DIRECTIONS } }),
    },
    trends: { type: "array", items: strictObject({ name: { type: "string" }, detail: { type: "string" } }) },
    recommendedSkills: stringList,
});

export function buildInsightsPrompt(industrySlug, countryCode) {
    const industry = describeIndustry(industrySlug);
    const country = countryByCode(countryCode) ?? countryByCode("US");
    const market = country.code === "REMOTE" ? "remote roles hired internationally" : `the job market in ${country.name}`;

    return `You are a labour market analyst. Describe ${market} for ${industry.specialization}${industry.field ? ` (${industry.field})` : ""} as it is today.

Return JSON with:
- summary: 2 to 3 plain sentences on hiring right now: how competitive it is, what employers look for, where it's heading.
- salaryRanges: 5 to 7 common roles in this field, from entry to senior. Yearly gross pay in ${country.currency} as plain numbers (no symbols, not in thousands): min, median, max for ${market}.
- growthRate: expected yearly growth in jobs for this field in this market, as a percentage number (e.g. 6.5).
- demandLevel: HIGH, MEDIUM or LOW, for hiring demand.
- marketOutlook: POSITIVE, NEUTRAL or NEGATIVE.
- skillDemand: the 10 skills employers here ask for most, each with demand from 0 to 100 (how often it's asked for, relative to the others) and direction RISING, STEADY or FALLING. Use short, common names ("React", "SQL", "Stakeholder management").
- trends: 4 to 5 trends, each with a short name and one sentence on what it means for someone working in this field.
- recommendedSkills: 5 skills worth learning next to stay employable here, not already in skillDemand.

Be realistic for this specific market and currency. Return JSON only.`;
}

const roundTo = (value) => {
    const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(Math.abs(value) || 1)) - 1);
    return Math.round(value / magnitude) * magnitude;
};

const salarySchema = z
    .object({ role: clippedText(80).pipe(z.string().min(2)), min: z.coerce.number().positive(), median: z.coerce.number().positive(), max: z.coerce.number().positive() })
    .transform(({ role, ...pay }, context) => {
        // Models sometimes reply in thousands despite being told not to, or out of order.
        const [min, median, max] = [pay.min, pay.median, pay.max].sort((a, b) => a - b);
        if (max > min * 20) {
            context.addIssue({ code: "custom", message: "Implausible salary spread" });
            return z.NEVER;
        }
        return { role, min: roundTo(min), median: roundTo(median), max: roundTo(max) };
    });

const skillSchema = z.object({
    skill: clippedText(40).pipe(z.string().min(1)),
    demand: z.coerce.number().transform((value) => Math.round(Math.min(100, Math.max(0, value)))),
    direction: z
        .string()
        .transform((value) => value.toUpperCase())
        .pipe(z.enum(DIRECTIONS))
        .catch("STEADY"),
});

const keep = (schema) => z.array(z.unknown()).catch([]).transform((items) => items.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
}));

const insightsSchema = z.object({
    summary: clippedText(600).catch(""),
    salaryRanges: keep(salarySchema).pipe(z.array(z.any()).min(3, "Too few salary ranges")),
    growthRate: z.coerce.number().transform((value) => Math.round(Math.min(60, Math.max(-30, value)) * 10) / 10).catch(0),
    demandLevel: z.enum(["HIGH", "MEDIUM", "LOW"]).catch("MEDIUM"),
    marketOutlook: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).catch("NEUTRAL"),
    skillDemand: keep(skillSchema).pipe(z.array(z.any()).min(4, "Too few skills")),
    trends: keep(z.object({ name: clippedText(80).pipe(z.string().min(2)), detail: clippedText(240).catch("") })),
    recommendedSkills: textList(6, 40),
});

export class InvalidInsightsError extends Error {
    constructor(issue) {
        super(`The insights didn't come back in a usable shape: ${issue}`);
        this.name = "InvalidInsightsError";
    }
}

// Turns a model reply into what's stored, filling the older columns
// (topSkills, keyTrends) from the newer ones so both stay consistent.
export function normalizeInsights(raw, countryCode) {
    const parsed = insightsSchema.safeParse(raw);
    if (!parsed.success) throw new InvalidInsightsError(parsed.error.issues[0]?.message ?? "unknown");
    const data = parsed.data;
    const country = countryByCode(countryCode) ?? countryByCode("US");

    const skillDemand = [...data.skillDemand].sort((a, b) => b.demand - a.demand).slice(0, 12);
    const known = new Set(skillDemand.map((item) => item.skill.toLowerCase()));

    return {
        currency: country.currency,
        summary: data.summary || null,
        salaryRanges: data.salaryRanges.slice(0, 8).sort((a, b) => a.median - b.median),
        growthRate: data.growthRate,
        demandLevel: data.demandLevel,
        marketOutlook: data.marketOutlook,
        skillDemand,
        topSkills: skillDemand.slice(0, 5).map((item) => item.skill),
        trends: data.trends.slice(0, 6),
        keyTrends: data.trends.slice(0, 6).map((trend) => trend.name),
        recommendedSkills: data.recommendedSkills.filter((skill) => !known.has(skill.toLowerCase())).slice(0, 6),
    };
}

// Where someone with this much experience usually sits in a role's range.
// A rough guide: entry level near the bottom, mid-career around the median.
export function experienceBand(years, { min, median, max }) {
    if (years == null) return null;
    if (years < 2) return { label: "Early career", low: min, high: min + (median - min) * 0.6 };
    if (years < 5) return { label: "Mid level", low: min + (median - min) * 0.5, high: median + (max - median) * 0.25 };
    if (years < 10) return { label: "Senior", low: median, high: median + (max - median) * 0.7 };
    return { label: "Lead", low: median + (max - median) * 0.4, high: max };
}
