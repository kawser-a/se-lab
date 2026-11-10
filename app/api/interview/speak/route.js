import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { isSpeechConfigured, SPEECH_MAX_CHARS, SPEECH_VOICES, synthesize } from "@/lib/ai/speech";

const bodySchema = z.object({
    text: z.string().trim().min(1).max(SPEECH_MAX_CHARS),
    voice: z.enum(SPEECH_VOICES),
});

// Turns one short piece of the interviewer's lines into audio. The browser
// splits longer lines into sentences and asks for them one at a time, so
// the first one can start playing while the rest are on their way.
export async function POST(req) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Please sign in again." }, { status: 401 });
    if (!isSpeechConfigured()) return Response.json({ error: "Natural voice isn't set up." }, { status: 503 });

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid speech request." }, { status: 400 });

    try {
        const audio = await synthesize(parsed.data.text, parsed.data.voice);
        return new Response(audio, {
            headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=86400" },
        });
    } catch (error) {
        console.warn("Interviewer voice unavailable:", error.message);
        const status = error?.status === 429 ? 429 : 503;
        return Response.json({ error: "Natural voice is unavailable right now." }, { status });
    }
}
