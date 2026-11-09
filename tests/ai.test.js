import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();

vi.mock("@google/genai", () => ({
    GoogleGenAI: class {
        models = { generateContent };
    },
}));

const { AIUnavailableError, generateText } = await import("@/lib/ai");

function apiError(status) {
    return Object.assign(new Error(`status ${status}`), { status });
}

function groqReply(content, status = 200) {
    return new Response(JSON.stringify(status === 200 ? { choices: [{ message: { content } }] } : { error: { message: "busy" } }), {
        status,
    });
}

async function run(promise) {
    // Let the retry delays pass without actually waiting.
    const settled = promise.then(
        (value) => ({ value }),
        (error) => ({ error })
    );
    await vi.runAllTimersAsync();
    return settled;
}

describe("generateText", () => {
    let fetchMock;

    beforeEach(() => {
        vi.useFakeTimers();
        generateContent.mockReset();
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        vi.stubEnv("GEMINI_API_KEY", "test-gemini");
        vi.stubEnv("GROQ_API_KEY", "");
        vi.stubEnv("AI_PROVIDER_ORDER", "");
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    describe("with Gemini only", () => {
        it("retries when the model is briefly overloaded", async () => {
            generateContent.mockRejectedValueOnce(apiError(503)).mockResolvedValueOnce({ text: " Done " });

            const { value } = await run(generateText("prompt"));

            expect(value).toBe("Done");
            expect(generateContent).toHaveBeenCalledTimes(2);
        });

        it("falls back to the lighter model when the main one stays busy", async () => {
            generateContent.mockImplementation(async ({ model }) => {
                if (model === "gemini-3.8-flash") throw apiError(503);
                return { text: "From fallback" };
            });

            const { value } = await run(generateText("prompt"));

            expect(value).toBe("From fallback");
            expect(generateContent).toHaveBeenLastCalledWith(expect.objectContaining({ model: "gemini-3.5-flash-lite" }));
        });

        it("gives a friendly error when every model is busy", async () => {
            generateContent.mockRejectedValue(apiError(503));

            const { error } = await run(generateText("prompt"));

            expect(error).toBeInstanceOf(AIUnavailableError);
            expect(error.message).toMatch(/busy/);
        });

        it("doesn't retry errors that won't fix themselves", async () => {
            generateContent.mockRejectedValue(apiError(400));

            const { error } = await run(generateText("prompt"));

            expect(error.status).toBe(400);
            expect(generateContent).toHaveBeenCalledTimes(1);
        });

        it("passes the token cap through", async () => {
            generateContent.mockResolvedValue({ text: "Short" });

            await run(generateText("prompt", { maxTokens: 120 }));

            expect(generateContent).toHaveBeenCalledWith(
                expect.objectContaining({ config: expect.objectContaining({ maxOutputTokens: 120 + 1024 }) })
            );
        });
    });

    describe("with Groq and Gemini", () => {
        beforeEach(() => vi.stubEnv("GROQ_API_KEY", "test-groq"));

        it("sends quick suggestions to Groq first", async () => {
            fetchMock.mockResolvedValue(groqReply("From Groq"));

            const { value } = await run(generateText("prompt", { speed: "fast" }));

            expect(value).toBe("From Groq");
            expect(generateContent).not.toHaveBeenCalled();

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.model).toBe("openai/gpt-oss-120b");
            expect(body.reasoning_effort).toBe("low");
        });

        it("sends longer jobs to Gemini first", async () => {
            generateContent.mockResolvedValue({ text: "From Gemini" });

            const { value } = await run(generateText("prompt"));

            expect(value).toBe("From Gemini");
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it("moves to Gemini when Groq is rate limited", async () => {
            fetchMock.mockResolvedValue(groqReply(null, 429));
            generateContent.mockResolvedValue({ text: "From Gemini" });

            const { value } = await run(generateText("prompt", { speed: "fast" }));

            expect(value).toBe("From Gemini");
        });

        it("still uses Gemini when the Groq key is wrong", async () => {
            fetchMock.mockResolvedValue(groqReply(null, 401));
            generateContent.mockResolvedValue({ text: "From Gemini" });

            const { value } = await run(generateText("prompt", { speed: "fast" }));

            expect(value).toBe("From Gemini");
            // A bad key fails the same way on every model, so only one call.
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("asks Groq for JSON when json is set", async () => {
            generateContent.mockRejectedValue(apiError(503));
            fetchMock.mockResolvedValue(groqReply('{"ok":true}'));

            await run(generateText("prompt", { json: true }));

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.response_format).toEqual({ type: "json_object" });
        });
    });
});
