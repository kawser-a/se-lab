import { geminiProvider } from "./gemini";
import { groqProvider } from "./groq";

// Every AI call in the app goes through here. Each request walks a list of
// provider/model pairs and moves on whenever one is busy, slow or rate
// limited, so a bad minute at one provider doesn't break the feature.

const PROVIDERS = { gemini: geminiProvider, groq: groqProvider };

// Quick suggestions go to Groq first because it answers in about a second.
// Longer structured jobs (insights, quizzes) go to Gemini first.
const DEFAULT_ORDER = {
    fast: ["groq", "gemini"],
    thorough: ["gemini", "groq"],
};

// 408 = timed out, 429 = rate limited, 5xx = the provider is struggling.
// These usually pass within seconds, unlike a bad key or prompt.
const TEMPORARY = new Set([408, 429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = 600;

export class AIUnavailableError extends Error {
    constructor() {
        super("The AI service is busy right now. Please try again in a minute.");
        this.name = "AIUnavailableError";
    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isTemporary(error) {
    return error?.name === "TimeoutError" || error?.name === "AbortError" || TEMPORARY.has(error?.status);
}

function plan(speed) {
    return (process.env.AI_PROVIDER_ORDER || DEFAULT_ORDER[speed].join(","))
        .split(",")
        .map((name) => PROVIDERS[name.trim()])
        .filter((provider) => provider?.isConfigured());
}

export async function generateText(prompt, { json = false, speed = "thorough", maxTokens, timeoutMs } = {}) {
    const providers = plan(speed);
    if (providers.length === 0) throw new Error("No AI provider is configured. Set GEMINI_API_KEY or GROQ_API_KEY.");

    // Fast requests give up on a slow provider sooner and try the next one.
    const timeout = timeoutMs ?? (speed === "fast" ? 12000 : 45000);
    let lastError;
    let busy = false;

    for (const provider of providers) {
        models: for (const model of provider.models()) {
            // One quick retry on the same model, then move on.
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const text = await provider.generate({ model, prompt, json, maxTokens, signal: AbortSignal.timeout(timeout) });
                    if (text.trim()) return text.trim();
                    busy = true;
                    break;
                } catch (error) {
                    lastError = error;
                    if (!isTemporary(error)) {
                        // A bad key or request won't work on this provider's other models
                        // either, but the next provider may still be fine.
                        console.error(`${provider.name} (${model}) failed:`, error.message);
                        break models;
                    }
                    busy = true;
                    if (attempt === 0) await sleep(RETRY_DELAY_MS);
                }
            }
            console.warn(`${provider.name} (${model}) unavailable, trying the next option`);
        }
    }

    // Only blame load when something was actually busy. Otherwise surface the
    // real error so a wrong key or model name is easy to spot.
    if (busy) throw new AIUnavailableError();
    throw lastError;
}

export async function generateJSON(prompt, options) {
    const text = await generateText(prompt, { ...options, json: true });
    // Some models wrap JSON in a code fence even when asked not to.
    return JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
}
