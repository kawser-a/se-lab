// Template catalogue. Kept free of react-pdf so server code can import it.

export const TEMPLATES = {
    developer: {
        id: "developer",
        name: "Developer one-page",
        shortName: "Developer",
        audience: "tech",
        description: "Software, data and QA roles. Skills and projects up front, tight enough for one page.",
        pages: "1 page",
        atsSafe: true,
        sections: ["summary", "skills", "experience", "projects", "education", "certifications", "awards", "languages", "custom"],
        defaultSections: ["summary", "skills", "experience", "projects", "education"],
        theme: { fontPair: "inter", accent: "#1F6FEB", fitToOnePage: true },
    },
    academic: {
        id: "academic",
        name: "Academic",
        shortName: "Academic",
        audience: "academic",
        description: "Researchers and PhD applicants. Publications in IEEE or APA style, teaching, grants and talks.",
        pages: "Several pages",
        atsSafe: true,
        sections: ["summary", "education", "publications", "experience", "projects", "awards", "skills", "certifications", "languages", "custom"],
        defaultSections: ["summary", "education", "publications", "experience", "awards", "skills"],
        defaultTitles: { summary: "Research interests" },
        theme: { fontPair: "serif", accent: "#1E3A8A", fitToOnePage: false },
    },
    creative: {
        id: "creative",
        name: "Creative",
        shortName: "Creative",
        audience: "creative",
        description: "Designers and video editors. Showreel and portfolio links, tools, clients and selected work.",
        pages: "1 to 2 pages",
        atsSafe: false,
        sections: ["summary", "portfolio", "experience", "skills", "projects", "education", "awards", "languages", "custom"],
        defaultSections: ["summary", "portfolio", "experience", "skills", "education"],
        defaultTitles: { summary: "Profile", skills: "Tools" },
        theme: { fontPair: "grotesk", accent: "#0E7C66", fitToOnePage: true },
    },
    graduate: {
        id: "graduate",
        name: "Fresh graduate",
        shortName: "Graduate",
        audience: "students",
        description: "First job seekers. Education, CGPA, thesis and projects first, with room for clubs and competitions.",
        pages: "1 page",
        atsSafe: true,
        sections: ["summary", "education", "projects", "skills", "experience", "awards", "certifications", "languages", "custom"],
        defaultSections: ["summary", "education", "projects", "skills", "experience", "custom"],
        defaultTitles: { custom: "Activities" },
        theme: { fontPair: "inter", accent: "#4F46E5", fitToOnePage: true },
    },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export const FONT_PAIRS = {
    inter: { label: "Inter", sample: "Inter, sans-serif" },
    grotesk: { label: "Space Grotesk + DM Sans", sample: "'Space Grotesk', sans-serif" },
    serif: { label: "Source Serif + Source Sans", sample: "Georgia, serif" },
};

export const ACCENTS = [
    { name: "Blue", value: "#1F6FEB" },
    { name: "Teal", value: "#0E7C66" },
    { name: "Indigo", value: "#4F46E5" },
    { name: "Plum", value: "#9D174D" },
    { name: "Burnt orange", value: "#C2410C" },
    { name: "Forest", value: "#166534" },
    { name: "Charcoal", value: "#374151" },
    { name: "Navy", value: "#1E3A8A" },
];

export function defaultTheme(templateId) {
    const template = TEMPLATES[templateId] ?? TEMPLATES.developer;
    return {
        templateId: template.id,
        density: "normal",
        margins: "normal",
        pageSize: "A4",
        citationStyle: "ieee",
        headerAlign: "center",
        ...template.theme,
    };
}

export function isSectionShown(templateId, type) {
    return (TEMPLATES[templateId] ?? TEMPLATES.developer).sections.includes(type);
}
