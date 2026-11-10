import { GroqError } from "./groq";

// Speech to text for browsers without built-in speech recognition. Groq
// runs Whisper on its free tier. https://console.groq.com/docs/speech-to-text

const ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";

export const isTranscriptionConfigured = () => Boolean(process.env.GROQ_API_KEY);

export async function transcribe(audio, { prompt, timeoutMs = 30000 } = {}) {
    const form = new FormData();
    form.append("file", audio, audio.name || "answer.webm");
    form.append("model", process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo");
    form.append("response_format", "json");
    form.append("language", "en");
    form.append("temperature", "0");
    // A little context helps Whisper with technical words.
    if (prompt) form.append("prompt", prompt.slice(0, 400));

    const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: form,
        signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new GroqError(response.status, `Groq transcription ${response.status}: ${detail.slice(0, 200)}`);
    }

    const result = await response.json();
    return (result.text ?? "").trim();
}
