import { auth } from "@clerk/nextjs/server";
import { isTranscriptionConfigured, transcribe } from "@/lib/ai/transcribe";

// Whisper accepts up to 25 MB, but a few minutes of compressed speech is
// well under 5 MB. Anything bigger is a mistake or abuse.
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Please sign in again." }, { status: 401 });

    if (!isTranscriptionConfigured()) {
        return Response.json({ error: "Voice answers aren't available here. Please type your answer." }, { status: 503 });
    }

    const form = await req.formData().catch(() => null);
    const audio = form?.get("audio");
    if (!audio || typeof audio === "string") return Response.json({ error: "No recording was received." }, { status: 400 });
    if (!audio.type.startsWith("audio/")) return Response.json({ error: "That recording format isn't supported." }, { status: 415 });
    if (audio.size > MAX_BYTES) return Response.json({ error: "That recording is too long. Try a shorter answer." }, { status: 413 });
    if (audio.size < 1000) return Response.json({ text: "" });

    const context = form.get("context");

    try {
        const text = await transcribe(audio, { prompt: typeof context === "string" ? context : undefined });
        return Response.json({ text });
    } catch (error) {
        console.error("Transcription failed:", error);
        const busy = error?.status === 429 || error?.status >= 500 || error?.name === "TimeoutError";
        return Response.json(
            { error: busy ? "Transcription is busy right now. Try again, or type your answer." : "Couldn't transcribe that recording. Try again, or type your answer." },
            { status: busy ? 503 : 502 }
        );
    }
}
