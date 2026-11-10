import { z } from "zod";
import { countries } from "@/data/countries";
import { industries } from "@/data/industries";
import { matchesSpecialization, toSlug } from "./market";

export const MAX_SKILLS = 40;

// The profile behind the insights, checked the same way in the form and on
// the server.
export const profileSchema = z.object({
    industry: z.string({ error: "Choose your industry" }).refine((id) => industries.some((industry) => industry.id === id), "Choose your industry"),
    subIndustry: z.string({ error: "Choose your specialization" }).min(1, "Choose your specialization"),
    country: z.string({ error: "Choose where you work" }).refine((code) => countries.some((country) => country.code === code), "Choose where you work"),
    // An empty box means "not answered", not zero years.
    experience: z.preprocess(
        (value) => (value === "" || value == null ? undefined : value),
        z.coerce
            .number({ error: "Enter your years of experience" })
            .int("Use whole years")
            .min(0, "Experience can't be negative")
            .max(50, "Experience can't be more than 50 years")
    ),
    skills: z
        .array(z.string().trim().min(1).max(40))
        .max(MAX_SKILLS, `List up to ${MAX_SKILLS} skills`)
        .min(1, "Add at least one skill, so we can compare it with what employers ask for"),
    bio: z.string().trim().max(500, "Keep your bio under 500 characters").optional().default(""),
});

// "tech" + "Software Development" -> "tech-software-development"
export function industrySlug(industryId, subIndustry) {
    return `${industryId}-${toSlug(subIndustry)}`;
}

// The reverse, for filling in the form when editing.
export function splitIndustrySlug(slug) {
    const industry = industries.find((item) => slug?.startsWith(`${item.id}-`));
    if (!industry) return { industry: undefined, subIndustry: undefined };
    const rest = slug.slice(industry.id.length + 1);
    return { industry: industry.id, subIndustry: industry.subIndustries.find((sub) => matchesSpecialization(sub, rest)) };
}
