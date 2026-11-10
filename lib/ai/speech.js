import { GroqError } from "./groq";

// Natural-sounding speech for the interviewer, using Groq's Orpheus model.
// https://console.groq.com/docs/text-to-speech/orpheus
//
// The free tier is small (about 10 requests a minute and 100 a day), so
// callers keep each request short and the browser falls back to its own
// voice when this is unavailable or rate limited.

const ENDPOINT = "https://api.groq.com/openai/v1/audio/speech";

export const SPEECH_MAX_CHARS = 200;
export const SPEECH_VOICES = ["hannah", "daniel", "diana", "autumn", "austin", "troy"];

// Orpheus takes a short direction in square brackets before the text, which
// changes the delivery without being spoken. These are the ones used here.
export const SPEECH_STYLES = ["warm", "friendly", "casual"];

export const isSpeechConfigured = () => Boolean(process.env.GROQ_API_KEY) && process.env.INTERVIEW_VOICE !== "browser";

// Short phrases repeat a lot ("Thanks.", the greeting), so a small cache
// saves a good share of the daily allowance.
const cache = new Map();
const CACHE_LIMIT = 200;

export async function synthesize(text, voice, { style, timeoutMs = 15000 } = {}) {
    const input = style && SPEECH_STYLES.includes(style) ? `[${style}] ${text}`.slice(0, SPEECH_MAX_CHARS) : text;
    const key = `${voice}:${input}`;
    if (cache.has(key)) return cache.get(key);

    const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: process.env.GROQ_SPEECH_MODEL || "canopylabs/orpheus-v1-english",
            input,
            voice,
            response_format: "wav",
        }),
        signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new GroqError(response.status, `Groq speech ${response.status}: ${detail.slice(0, 200)}`);
    }

    const audio = Buffer.from(await response.arrayBuffer());
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
    cache.set(key, audio);
    return audio;
}
