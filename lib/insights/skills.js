// Compares someone's skills with what their market asks for. Names are
// written many ways ("JS", "javascript", "Node", "Node.js", "k8s"), so both
// sides are reduced to a canonical form before comparing.

const ALIASES = {
    js: "javascript",
    ecmascript: "javascript",
    ts: "typescript",
    node: "nodejs",
    "node js": "nodejs",
    reactjs: "react",
    "react js": "react",
    "react native": "reactnative",
    nextjs: "next",
    "next js": "next",
    vuejs: "vue",
    "vue js": "vue",
    angularjs: "angular",
    postgres: "postgresql",
    psql: "postgresql",
    mongo: "mongodb",
    k8s: "kubernetes",
    gcp: "google cloud",
    "google cloud platform": "google cloud",
    "amazon web services": "aws",
    "microsoft azure": "azure",
    py: "python",
    golang: "go",
    "c sharp": "c#",
    csharp: "c#",
    cpp: "c++",
    ml: "machine learning",
    ai: "artificial intelligence",
    "gen ai": "generative ai",
    genai: "generative ai",
    llm: "llms",
    "large language models": "llms",
    "ci cd": "cicd",
    "ci/cd": "cicd",
    "rest api": "rest",
    "restful apis": "rest",
    "rest apis": "rest",
    "html5": "html",
    css3: "css",
    "tailwind css": "tailwind",
    tailwindcss: "tailwind",
    "ms excel": "excel",
    "microsoft excel": "excel",
    "power bi": "powerbi",
    "data structures and algorithms": "dsa",
    "data structures": "dsa",
    algorithms: "dsa",
};

export function canonicalSkill(name) {
    const plain = String(name)
        .toLowerCase()
        .replace(/\(.*?\)/g, " ")
        .replace(/[._-]/g, " ")
        .replace(/[^a-z0-9+#/ ]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const squashed = plain.replace(/ /g, "");
    return ALIASES[plain] ?? ALIASES[squashed] ?? (plain.endsWith(" js") ? plain.slice(0, -3) : plain).replace(/ /g, "");
}

// One of their skills covers an asked-for skill when the cleaned names are
// equal, or when theirs is a more specific form of it: "Google Cloud"
// covers "Cloud", "PostgreSQL" and "MySQL" cover "SQL". Only in that
// direction: listing "Cloud" doesn't claim "Google Cloud".
function covers(have, want) {
    if (have === want) return true;
    if (have.length <= want.length) return false;
    return (want.length >= 4 && have.includes(want)) || (want.length >= 3 && have.endsWith(want));
}

// Splits the market's in-demand skills into ones they have and gaps,
// strongest demand first, rising skills ahead of falling ones on a tie.
export function analyseSkills(userSkills = [], skillDemand = []) {
    const mine = userSkills.map((skill) => ({ name: skill, key: canonicalSkill(skill) })).filter((skill) => skill.key);
    const rank = (item) => item.demand + (item.direction === "RISING" ? 5 : item.direction === "FALLING" ? -5 : 0);

    const have = [];
    const missing = [];
    for (const item of [...skillDemand].sort((a, b) => rank(b) - rank(a))) {
        const key = canonicalSkill(item.skill);
        const match = mine.find((skill) => covers(skill.key, key));
        (match ? have : missing).push({ ...item, yours: match?.name ?? null });
    }

    // Demand-weighted share of what's asked for that they already have.
    const total = skillDemand.reduce((sum, item) => sum + item.demand, 0);
    const covered = have.reduce((sum, item) => sum + item.demand, 0);
    const score = total > 0 ? Math.round((covered / total) * 100) : 0;

    return { have, missing, score };
}

// Adds a skill to a list unless it's already there under another spelling.
export function addSkill(skills, skill) {
    const key = canonicalSkill(skill);
    return skills.some((existing) => canonicalSkill(existing) === key) ? skills : [...skills, skill.trim()];
}
