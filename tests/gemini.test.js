import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();

vi.mock("@google/genai", () => ({
    GoogleGenAI: class {
        models = { generateContent };
    },
}));

const { AIUnavailableError, generateText } = await import("@/lib/gemini");

function apiError(status) {
    return Object.assign(new Error(`status ${status}`), { status });
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
    beforeEach(() => {
        vi.useFakeTimers();
        generateContent.mockReset();
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

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
});
