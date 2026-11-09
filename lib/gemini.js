import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Google retires models regularly, so keep the names in one place and allow
// overrides from the environment.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// Tried in order when the main model is overloaded or rate limited.
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.5-flash-lite")
    .split(",")
    .map((model) => model.trim())
    .filter((model) => model && model !== GEMINI_MODEL);

// 429 = rate limited, 500/503 = Google is having trouble. These usually pass
// within seconds, unlike a bad key or prompt.
const TEMPORARY = new Set([429, 500, 503]);
const RETRY_DELAYS_MS = [800, 2000];

export class AIUnavailableError extends Error {
    constructor() {
        super("The AI service is busy right now. Please try again in a minute.");
        this.name = "AIUnavailableError";
    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callModel(model, prompt, json) {
    for (let attempt = 0; ; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: json ? { responseMimeType: "application/json" } : undefined,
            });
            return (response.text ?? "").trim();
        } catch (error) {
            const temporary = TEMPORARY.has(error?.status);
            if (!temporary || attempt >= RETRY_DELAYS_MS.length) throw error;
            await sleep(RETRY_DELAYS_MS[attempt]);
        }
    }
}

export async function generateText(prompt, { json = false } = {}) {
    let lastError;
    for (const model of [GEMINI_MODEL, ...FALLBACK_MODELS]) {
        try {
            return await callModel(model, prompt, json);
        } catch (error) {
            lastError = error;
            if (!TEMPORARY.has(error?.status)) throw error;
            console.warn(`Gemini model ${model} unavailable (${error.status}), trying the next one`);
        }
    }
    console.error("All Gemini models unavailable:", lastError?.message);
    throw new AIUnavailableError();
}

export async function generateJSON(prompt) {
    const text = await generateText(prompt, { json: true });
    // Older models sometimes wrap JSON in a code fence even when asked not to.
    return JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
}
