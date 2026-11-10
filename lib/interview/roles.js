// Common roles across backgrounds, for the role picker. Anything not here
// can still be typed in.
export const ROLE_GROUPS = [
    {
        label: "Software",
        roles: [
            "Software Engineer",
            "Frontend Developer",
            "Backend Developer",
            "Full Stack Developer",
            "Mobile App Developer",
            "QA Engineer",
            "DevOps Engineer",
            "Cloud Engineer",
            "Site Reliability Engineer",
            "Security Engineer",
            "Embedded Systems Engineer",
            "Game Developer",
        ],
    },
    {
        label: "Data and AI",
        roles: ["Data Analyst", "Data Scientist", "Data Engineer", "Machine Learning Engineer", "AI Engineer", "Business Intelligence Analyst"],
    },
    {
        label: "Product and design",
        roles: ["Product Manager", "Project Manager", "UI/UX Designer", "Product Designer", "Graphic Designer", "Video Editor", "Scrum Master"],
    },
    {
        label: "Business",
        roles: [
            "Business Analyst",
            "Management Trainee",
            "Operations Executive",
            "Supply Chain Executive",
            "Human Resources Executive",
            "Sales Executive",
            "Customer Success Manager",
            "Digital Marketing Executive",
            "Content Writer",
            "Brand Executive",
        ],
    },
    {
        label: "Finance",
        roles: ["Financial Analyst", "Accountant", "Investment Analyst", "Credit Analyst", "Auditor"],
    },
    {
        label: "Engineering and science",
        roles: ["Electrical Engineer", "Mechanical Engineer", "Civil Engineer", "Research Assistant", "Lab Technician"],
    },
    {
        label: "Health and education",
        roles: ["Nurse", "Pharmacist", "Medical Officer", "Teacher", "Lecturer", "Teaching Assistant"],
    },
];

const ALL_ROLES = ROLE_GROUPS.flatMap((group) => group.roles.map((role) => ({ role, group: group.label })));

// Roles whose words start with what's typed come first, then any that
// contain it, so "dev" finds "DevOps Engineer" before "Frontend Developer"
// only when it should.
export function searchRoles(query, limit = 8) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const scored = ALL_ROLES.map((entry) => {
        const name = entry.role.toLowerCase();
        if (name.startsWith(q)) return { ...entry, score: 0 };
        if (name.split(/[\s/]+/).some((word) => word.startsWith(q))) return { ...entry, score: 1 };
        if (name.includes(q)) return { ...entry, score: 2 };
        return null;
    }).filter(Boolean);

    return scored.sort((a, b) => a.score - b.score || a.role.localeCompare(b.role)).slice(0, limit);
}
