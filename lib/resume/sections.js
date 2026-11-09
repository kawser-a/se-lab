// Labels and empty shapes for each section type. Shared by the editor, the
// server actions and the PDF templates.

export const SECTION_META = {
    summary: { label: "Summary", itemLabel: null },
    experience: { label: "Experience", itemLabel: "experience" },
    education: { label: "Education", itemLabel: "education" },
    projects: { label: "Projects", itemLabel: "project" },
    skills: { label: "Skills", itemLabel: "skill group" },
    publications: { label: "Publications", itemLabel: "publication" },
    awards: { label: "Awards", itemLabel: "award" },
    certifications: { label: "Certifications", itemLabel: "certification" },
    languages: { label: "Languages", itemLabel: "language" },
    portfolio: { label: "Selected work", itemLabel: "work sample" },
    custom: { label: "Custom section", itemLabel: "entry" },
};

const EMPTY_ITEMS = {
    experience: { role: "", organisation: "", location: "", start: "", end: "", current: false, bullets: [""] },
    education: { degree: "", institution: "", location: "", start: "", end: "", result: "", thesis: "", highlights: [] },
    projects: { name: "", role: "", link: "", start: "", end: "", tech: [], bullets: [""] },
    skills: { group: "", keywords: [] },
    publications: { authors: "", title: "", venue: "", year: "", kind: "conference", status: "published", link: "" },
    awards: { name: "", issuer: "", date: "", link: "", note: "" },
    certifications: { name: "", issuer: "", date: "", link: "", note: "" },
    languages: { language: "", level: "" },
    portfolio: { title: "", link: "", note: "" },
    custom: { title: "", subtitle: "", start: "", end: "", bullets: [""] },
};

export function newId() {
    return Math.random().toString(36).slice(2, 10);
}

export function emptyItem(type) {
    return { id: newId(), visible: true, ...structuredClone(EMPTY_ITEMS[type]) };
}

export function emptySection(type, title) {
    const base = { id: newId(), type, title: title || SECTION_META[type].label, visible: true };
    return type === "summary" ? { ...base, content: "" } : { ...base, items: [] };
}

export function emptyResumeData(sectionTypes, basics = {}) {
    return {
        basics: {
            name: "",
            headline: "",
            email: "",
            phone: "",
            location: "",
            links: [],
            ...basics,
        },
        sections: sectionTypes.map((type) => emptySection(type)),
    };
}

// "2025-01" -> "Jan 2025"
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatMonth(value) {
    if (!value) return "";
    const [year, month] = value.split("-");
    return `${MONTHS[Number(month) - 1] ?? ""} ${year}`.trim();
}

export function formatRange(start, end, current) {
    const from = formatMonth(start);
    const to = current ? "Present" : formatMonth(end);
    if (from && to) return `${from} – ${to}`;
    return from || to;
}
