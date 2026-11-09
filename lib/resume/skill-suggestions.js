// Suggestions for the skills picker. Users can always type their own;
// these only save typing and help people who aren't sure what to list.
// `match` picks the list to show first when a skill group's name fits it.

export const SKILL_CATEGORIES = [
    {
        id: "programming",
        match: /language|programming|coding/i,
        skills: ["JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "Dart", "R", "MATLAB", "SQL", "Bash", "Scala", "Solidity"],
    },
    {
        id: "frameworks",
        match: /framework|librar|frontend|front-end|backend|back-end|web/i,
        skills: ["React", "Next.js", "Vue.js", "Nuxt", "Angular", "Svelte", "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI", "Spring Boot", "Laravel", "Ruby on Rails", ".NET", "Tailwind CSS", "Bootstrap", "Redux", "React Native", "Flutter", "jQuery", "GraphQL", "MERN stack"],
    },
    {
        id: "data",
        match: /\bdata\b|machine|\bml\b|\bai\b|analytic|research|statistic/i,
        skills: ["Pandas", "NumPy", "scikit-learn", "TensorFlow", "PyTorch", "Keras", "Hugging Face Transformers", "OpenCV", "NLP", "Computer vision", "Deep learning", "LLMs", "Prompt engineering", "Data visualisation", "Power BI", "Tableau", "Excel", "Jupyter", "Spark", "Statistics", "A/B testing", "SPSS", "LaTeX"],
    },
    {
        id: "databases",
        match: /database|storage|\bdb\b/i,
        skills: ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Firebase", "Supabase", "Prisma", "Oracle", "SQL Server", "Elasticsearch", "DynamoDB"],
    },
    {
        id: "devops",
        match: /tool|devops|cloud|platform|infra|deploy/i,
        skills: ["Git", "GitHub", "GitHub Actions", "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure", "Vercel", "Netlify", "Linux", "Nginx", "CI/CD", "Terraform", "Jira", "Postman", "Figma", "VS Code"],
    },
    {
        id: "testing",
        match: /test|qa|quality/i,
        skills: ["Manual testing", "Test cases", "Selenium", "Playwright", "Cypress", "Jest", "Vitest", "Pytest", "JUnit", "Postman", "API testing", "Regression testing", "Performance testing", "JMeter", "Bug tracking"],
    },
    {
        id: "design",
        match: /design|ui|ux|graphic|visual|creative/i,
        skills: ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Adobe XD", "Canva", "Sketch", "Blender", "UI design", "UX research", "Wireframing", "Prototyping", "Design systems", "Typography", "Branding", "Illustration", "Motion design"],
    },
    {
        id: "video",
        match: /video|edit|film|motion|media|audio|photo/i,
        skills: ["Adobe Premiere Pro", "Adobe After Effects", "DaVinci Resolve", "Final Cut Pro", "CapCut", "Adobe Audition", "Colour grading", "Motion graphics", "Sound design", "Storyboarding", "Video editing", "Photography", "Lightroom", "Cinematography", "YouTube", "Short-form video"],
    },
    {
        id: "marketing",
        match: /marketing|seo|social|content|growth|sales/i,
        skills: ["SEO", "Content writing", "Copywriting", "Social media marketing", "Google Analytics", "Google Ads", "Meta Ads", "Email marketing", "Mailchimp", "HubSpot", "Market research", "Brand strategy", "CRM", "Salesforce", "Lead generation", "Negotiation"],
    },
    {
        id: "business",
        match: /business|finance|account|management|operation|project|product/i,
        skills: ["Project management", "Agile", "Scrum", "Product management", "Business analysis", "Financial analysis", "Financial modelling", "Budgeting", "Accounting", "QuickBooks", "Tally", "Microsoft Excel", "Microsoft Office", "Google Workspace", "Notion", "Trello", "Requirements gathering", "Stakeholder management"],
    },
    {
        id: "engineering",
        match: /engineer|mechanical|electrical|civil|cad|lab/i,
        skills: ["AutoCAD", "SolidWorks", "MATLAB", "Simulink", "Arduino", "Raspberry Pi", "PLC", "Circuit design", "PCB design", "ANSYS", "Revit", "Embedded systems", "IoT", "Technical drawing"],
    },
    {
        id: "health",
        match: /health|medical|clinical|nurs|pharma|patient/i,
        skills: ["Patient care", "Clinical documentation", "First aid", "CPR", "Electronic health records", "Medical terminology", "Infection control", "Phlebotomy", "Pharmacology", "Public health", "Health education"],
    },
    {
        id: "teaching",
        match: /teach|education|training|tutor|academic/i,
        skills: ["Lesson planning", "Curriculum design", "Classroom management", "Online teaching", "Google Classroom", "Moodle", "Assessment design", "Mentoring", "Public speaking", "Academic writing", "Literature review", "Grant writing", "Peer review"],
    },
    {
        id: "soft",
        match: /soft|personal|interpersonal|other|core/i,
        skills: ["Communication", "Teamwork", "Leadership", "Problem solving", "Critical thinking", "Time management", "Adaptability", "Attention to detail", "Presentation", "Customer service", "Conflict resolution", "Mentoring", "Self-motivated"],
    },
];

export const GROUP_NAME_SUGGESTIONS = [
    "Languages",
    "Frameworks",
    "Databases",
    "Tools",
    "Cloud",
    "Data & AI",
    "Testing",
    "Design tools",
    "Video & audio",
    "Marketing",
    "Business",
    "Engineering tools",
    "Clinical skills",
    "Teaching",
    "Soft skills",
];

const ALL_SKILLS = [...new Set(SKILL_CATEGORIES.flatMap((category) => category.skills))];

// Skills to offer for the text typed so far. With nothing typed, the list
// that fits the group name (or the CV's template) comes first.
export function suggestSkills(query, { context = "", exclude = [], limit = 8 } = {}) {
    const taken = new Set(exclude.map((value) => value.toLowerCase()));
    const available = (list) => list.filter((skill) => !taken.has(skill.toLowerCase()));
    const term = query.trim().toLowerCase();

    if (!term) {
        const preferred = SKILL_CATEGORIES.filter((category) => category.match.test(context)).flatMap((category) => category.skills);
        return available([...new Set([...preferred, ...ALL_SKILLS])]).slice(0, limit);
    }

    const matches = available(ALL_SKILLS).filter((skill) => skill.toLowerCase().includes(term));
    // Prefix matches first, so "py" offers Python before NumPy.
    matches.sort((a, b) => Number(!a.toLowerCase().startsWith(term)) - Number(!b.toLowerCase().startsWith(term)));
    return matches.slice(0, limit);
}
