// Groq serves open models through an OpenAI-compatible API and is very fast,
// which suits short CV suggestions. https://console.groq.com/docs/api-reference

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export class GroqError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "GroqError";
        this.status = status;
    }
}

export const groqProvider = {
    name: "groq",

    isConfigured: () => Boolean(process.env.GROQ_API_KEY),

    models: () =>
        (process.env.GROQ_MODELS ?? "openai/gpt-oss-120b,openai/gpt-oss-20b")
            .split(",")
            .map((model) => model.trim())
            .filter(Boolean),

    async generate({ model, prompt, json, schema, maxTokens, signal }) {
        const isGptOss = model.startsWith("openai/gpt-oss");

        // gpt-oss models can be held to a JSON schema; others only promise JSON.
        const format = schema && isGptOss
            ? { type: "json_schema", json_schema: { name: "response", strict: true, schema } }
            : json
              ? { type: "json_object" }
              : null;

        const send = (responseFormat) =>
            fetch(ENDPOINT, {
                method: "POST",
                signal,
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.6,
                    // Reasoning tokens count towards the limit, so leave room for them.
                    max_completion_tokens: maxTokens ? maxTokens + 400 : undefined,
                    // Short writing tasks don't need long reasoning, and it's the main cost in latency.
                    ...(isGptOss && { reasoning_effort: "low", include_reasoning: false }),
                    ...(responseFormat && { response_format: responseFormat }),
                }),
            });

        let response = await send(format);

        // If the schema itself is rejected, plain JSON mode still beats failing.
        if (response.status === 400 && format?.type === "json_schema") {
            console.warn("Groq rejected the JSON schema, retrying in JSON mode:", (await response.text().catch(() => "")).slice(0, 200));
            response = await send({ type: "json_object" });
        }

        if (!response.ok) {
            const detail = await response.text().catch(() => "");
            throw new GroqError(response.status, `Groq ${response.status}: ${detail.slice(0, 200)}`);
        }

        const result = await response.json();
        return result.choices?.[0]?.message?.content ?? "";
    },
};
