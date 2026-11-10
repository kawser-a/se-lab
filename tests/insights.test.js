import { describe, expect, it } from "vitest";
import { buildInsightsPrompt, describeIndustry, experienceBand, normalizeInsights } from "@/lib/insights/market";
import { addSkill, analyseSkills, canonicalSkill } from "@/lib/insights/skills";
import { formatMoney } from "@/data/countries";
import { industrySlug, profileSchema, splitIndustrySlug } from "@/lib/insights/profile";

const reply = (overrides = {}) => ({
    summary: "Hiring is steady.",
    salaryRanges: [
        { role: "Senior Engineer", min: 1800000, median: 2400000, max: 3600000 },
        { role: "Junior Engineer", min: 360000, median: 480000, max: 720000 },
        { role: "Engineer", min: 720000, median: 1000000, max: 1500000 },
    ],
    growthRate: "8.25",
    demandLevel: "HIGH",
    marketOutlook: "POSITIVE",
    skillDemand: [
        { skill: "React", demand: 90, direction: "rising" },
        { skill: "SQL", demand: 70, direction: "STEADY" },
        { skill: "AWS", demand: 140, direction: "sideways" },
        { skill: "Docker", demand: 60, direction: "RISING" },
        { skill: "", demand: 50, direction: "STEADY" },
    ],
    trends: [{ name: "AI tooling", detail: "Teams expect you to use it well." }],
    recommendedSkills: ["Kubernetes", "react"],
    ...overrides,
});

describe("normalizeInsights", () => {
    it("cleans a reply into what's stored", () => {
        const insights = normalizeInsights(reply(), "BD");
        expect(insights.currency).toBe("BDT");
        expect(insights.salaryRanges.map((r) => r.role)).toEqual(["Junior Engineer", "Engineer", "Senior Engineer"]);
        expect(insights.growthRate).toBe(8.3);
        expect(insights.skillDemand[0]).toEqual({ skill: "AWS", demand: 100, direction: "STEADY" });
        expect(insights.skillDemand.find((s) => s.skill === "React").direction).toBe("RISING");
        expect(insights.topSkills).toHaveLength(4);
        expect(insights.keyTrends).toEqual(["AI tooling"]);
        // Already in demand, so not "recommended" as something new.
        expect(insights.recommendedSkills).toEqual(["Kubernetes"]);
    });

    it("puts salary figures in order and drops implausible ones", () => {
        const insights = normalizeInsights(reply({ salaryRanges: [...reply().salaryRanges, { role: "Odd", min: 900, median: 1000000, max: 50 }] }), "US");
        expect(insights.salaryRanges.find((r) => r.role === "Odd")).toBeUndefined();
        const swapped = normalizeInsights(reply({ salaryRanges: [{ role: "Intern", min: 3, median: 1, max: 2 }, ...reply().salaryRanges] }), "US");
        expect(swapped.salaryRanges[0]).toMatchObject({ min: 1, median: 2, max: 3 });
    });

    it("refuses a reply with too little to show", () => {
        expect(() => normalizeInsights(reply({ salaryRanges: [] }), "US")).toThrow(/salary/);
        expect(() => normalizeInsights(reply({ skillDemand: [] }), "US")).toThrow(/skills/);
    });
});

describe("market helpers", () => {
    it("names the industry from its slug", () => {
        expect(describeIndustry("tech-software-development")).toEqual({ field: "Technology", specialization: "Software Development" });
        expect(describeIndustry("tech-artificial-intelligence-machine-learning").specialization).toBe("Artificial Intelligence/Machine Learning");
    });

    it("asks for the right market and currency", () => {
        const prompt = buildInsightsPrompt("tech-software-development", "BD");
        expect(prompt).toMatch(/Bangladesh/);
        expect(prompt).toMatch(/BDT/);
        expect(buildInsightsPrompt("tech-software-development", "REMOTE")).toMatch(/remote roles/);
    });

    it("places experience within a salary range", () => {
        const range = { min: 100, median: 200, max: 400 };
        expect(experienceBand(1, range)).toMatchObject({ label: "Early career", low: 100 });
        expect(experienceBand(6, range).low).toBe(200);
        expect(experienceBand(null, range)).toBeNull();
    });

    it("formats money compactly in the local currency", () => {
        expect(formatMoney(1250000, "USD")).toBe("$1.3M");
        expect(formatMoney(85000, "BDT")).toBe("৳85K");
        expect(formatMoney(116700, "BDT")).toBe("৳117K");
        expect(formatMoney(91700, "BDT")).toBe("৳91.7K");
        expect(formatMoney(250000, "INR")).toBe("₹250K");
        expect(formatMoney(900, "MYR")).toBe("RM 900");
        expect(formatMoney(null, "USD")).toBe("–");
    });
});

describe("skills", () => {
    it("treats common spellings as the same skill", () => {
        expect(canonicalSkill("JS")).toBe(canonicalSkill("JavaScript"));
        expect(canonicalSkill("Node")).toBe(canonicalSkill("Node.js"));
        expect(canonicalSkill("React.js")).toBe("react");
        expect(canonicalSkill("k8s")).toBe("kubernetes");
    });

    it("splits demand into skills you have and gaps, by weight", () => {
        const demand = [
            { skill: "SQL", demand: 70, direction: "STEADY" },
            { skill: "React", demand: 90, direction: "RISING" },
            { skill: "Kubernetes", demand: 60, direction: "RISING" },
            { skill: "Cloud", demand: 80, direction: "STEADY" },
        ];
        const result = analyseSkills(["react.js", "PostgreSQL", "Google Cloud", "Figma"], demand);
        expect(result.have.map((s) => s.skill)).toEqual(["React", "Cloud", "SQL"]);
        expect(result.have[0].yours).toBe("react.js");
        expect(result.missing.map((s) => s.skill)).toEqual(["Kubernetes"]);
        expect(result.score).toBe(80);
        expect(analyseSkills(["Cloud"], [{ skill: "Google Cloud", demand: 10 }]).missing).toHaveLength(1);
    });

    it("adds a skill only once", () => {
        expect(addSkill(["Node.js"], "node")).toEqual(["Node.js"]);
        expect(addSkill(["Node.js"], " Docker ")).toEqual(["Node.js", "Docker"]);
    });
});

describe("profile", () => {
    const valid = { industry: "tech", subIndustry: "Software Development", country: "BD", experience: "2", skills: ["React"], bio: "" };

    it("accepts a complete profile", () => {
        expect(profileSchema.parse(valid)).toMatchObject({ experience: 2, country: "BD" });
    });

    it("needs experience to be answered, but zero is fine", () => {
        expect(profileSchema.safeParse({ ...valid, experience: "" }).error.issues[0].message).toMatch(/years of experience/);
        expect(profileSchema.parse({ ...valid, experience: "0" }).experience).toBe(0);
    });

    it("rejects unknown countries and industries, and an empty skill list", () => {
        expect(profileSchema.safeParse({ ...valid, country: "XX" }).success).toBe(false);
        expect(profileSchema.safeParse({ ...valid, industry: "space" }).success).toBe(false);
        expect(profileSchema.safeParse({ ...valid, skills: [] }).success).toBe(false);
    });

    it("turns industry choices into a slug and back, including older slugs", () => {
        expect(industrySlug("tech", "Artificial Intelligence/Machine Learning")).toBe("tech-artificial-intelligence-machine-learning");
        expect(splitIndustrySlug("tech-artificial-intelligence-machine-learning")).toEqual({ industry: "tech", subIndustry: "Artificial Intelligence/Machine Learning" });
        expect(splitIndustrySlug("tech-artificial-intelligence/machine-learning").subIndustry).toBe("Artificial Intelligence/Machine Learning");
    });
});
