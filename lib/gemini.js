import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Google retires models regularly, so keep the name in one place and allow an
// override from the environment.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export async function generateText(prompt, { json = false } = {}) {
    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: json ? { responseMimeType: "application/json" } : undefined,
    });

    return (response.text ?? "").trim();
}

export async function generateJSON(prompt) {
    const text = await generateText(prompt, { json: true });
    // Older models sometimes wrap JSON in a code fence even when asked not to.
    return JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
}
