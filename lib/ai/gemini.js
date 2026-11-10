import { GoogleGenAI } from "@google/genai";

let client;

export const geminiProvider = {
    name: "gemini",

    isConfigured: () => Boolean(process.env.GEMINI_API_KEY),

    // The main model first, then the lighter fallbacks.
    models: () => {
        const main = process.env.GEMINI_MODEL || "gemini-3.8-flash";
        const fallbacks = (process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.5-flash-lite")
            .split(",")
            .map((model) => model.trim())
            .filter((model) => model && model !== main);
        return [main, ...fallbacks];
    },

    async generate({ model, prompt, json, schema, maxTokens, signal }) {
        client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const response = await client.models.generateContent({
            model,
            contents: prompt,
            config: {
                abortSignal: signal,
                // Thinking tokens count towards this cap, so leave them room or the answer gets cut off.
                maxOutputTokens: maxTokens && maxTokens + 1024,
                ...(json && { responseMimeType: "application/json" }),
                ...(schema && { responseJsonSchema: schema }),
            },
        });

        return response.text ?? "";
    },
};
