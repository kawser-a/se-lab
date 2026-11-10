// Browser speech: the interviewer's voice, live speech recognition, and a
// recorder for browsers without recognition. Client-only.

// ---- Speaking ---------------------------------------------------------------

const PREFERRED_VOICES = [/natural/i, /google us english/i, /google uk english female/i, /samantha/i, /aria|jenny|guy/i, /daniel/i];

function pickVoice(voices) {
    const english = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
    for (const pattern of PREFERRED_VOICES) {
        const match = english.find((voice) => pattern.test(voice.name));
        if (match) return match;
    }
    return english.find((voice) => voice.default) ?? english[0] ?? null;
}

// Chrome cuts off utterances longer than about 15 seconds, so long text is
// spoken a sentence or two at a time.
export function splitForSpeech(text, maxLength = 180) {
    const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]*\s*/g) ?? [];
    const chunks = [];
    let current = "";

    for (const sentence of sentences) {
        if ((current + sentence).length > maxLength && current) {
            chunks.push(current.trim());
            current = "";
        }
        current += sentence;
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
}

export function createSpeaker() {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    let voice = null;
    let generation = 0;

    const loadVoice = () => {
        voice = pickVoice(synth?.getVoices() ?? []);
    };
    if (synth) {
        loadVoice();
        synth.addEventListener?.("voiceschanged", loadVoice);
    }

    function speakChunk(text, run) {
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            if (voice) utterance.voice = voice;
            utterance.lang = voice?.lang ?? "en-US";
            utterance.rate = 1;

            // Some browsers never fire "end". Don't let that freeze the interview.
            const words = text.split(/\s+/).length;
            const fallback = setTimeout(resolve, (words / 2.2) * 1000 + 3000);
            const done = () => {
                clearTimeout(fallback);
                resolve();
            };
            utterance.onend = done;
            utterance.onerror = done;

            if (run !== generation) return done();
            synth.speak(utterance);
        });
    }

    return {
        supported: Boolean(synth),

        async speak(text) {
            if (!synth) return;
            const run = ++generation;
            synth.cancel();
            for (const chunk of splitForSpeech(text)) {
                if (run !== generation) return;
                await speakChunk(chunk, run);
            }
        },

        cancel() {
            generation++;
            synth?.cancel();
        },

        dispose() {
            this.cancel();
            synth?.removeEventListener?.("voiceschanged", loadVoice);
        },
    };
}

// ---- Listening with the browser's recognition -------------------------------

export const RECOGNITION_ERRORS = {
    "not-allowed": "Microphone access is blocked. Allow it in your browser's site settings, or type your answer.",
    "service-not-allowed": "This browser doesn't allow speech recognition here. Your answer will be recorded instead.",
    "audio-capture": "No microphone was found. Plug one in, or type your answer.",
    network: "The browser's speech service couldn't be reached. Your answer will be recorded instead.",
};

export function getRecognitionClass() {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

// Wraps the Web Speech API in something that stays on until it's stopped.
// Chrome ends a session after a pause or about a minute, so it's restarted
// and the text kept, rather than losing the rest of the answer.
export function createRecognizer({ onText, onError }) {
    const Recognition = getRecognitionClass();
    let recognition = null;
    let active = false;
    let finalText = "";

    const start = () => {
        recognition = new Recognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) finalText += `${result[0].transcript.trim()} `;
                else interim += result[0].transcript;
            }
            onText({ final: finalText.trim(), interim: interim.trim() });
        };

        recognition.onerror = (event) => {
            // Silence and our own stop() aren't problems.
            if (event.error === "no-speech" || event.error === "aborted") return;
            active = false;
            onError(event.error);
        };

        recognition.onend = () => {
            if (active) {
                try {
                    start();
                } catch {
                    active = false;
                    onError("network");
                }
            }
        };

        recognition.start();
    };

    return {
        start() {
            finalText = "";
            active = true;
            start();
        },
        // Resolves once the browser has handed over the last words.
        stop() {
            active = false;
            return new Promise((resolve) => {
                if (!recognition) return resolve(finalText.trim());
                const finish = () => resolve(finalText.trim());
                const timer = setTimeout(finish, 1500);
                recognition.onend = () => {
                    clearTimeout(timer);
                    finish();
                };
                recognition.stop();
            });
        },
        abort() {
            active = false;
            recognition?.abort();
        },
    };
}

// ---- Recording, for browsers without recognition ----------------------------

const RECORDING_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

export function canRecord() {
    return typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export function createRecorder(stream) {
    const mimeType = RECORDING_TYPES.find((type) => MediaRecorder.isTypeSupported?.(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];

    recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
    };

    return {
        start() {
            chunks.length = 0;
            recorder.start(1000);
        },
        stop() {
            return new Promise((resolve) => {
                if (recorder.state === "inactive") return resolve(new Blob(chunks, { type: recorder.mimeType }));
                recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
                recorder.stop();
            });
        },
        abort() {
            if (recorder.state !== "inactive") recorder.stop();
        },
    };
}

// ---- Microphone level -------------------------------------------------------

// Reads how loud the microphone is, from 0 to 1. Drives the level meter and
// tells speech apart from silence.
export function createLevelMeter(stream, onLevel) {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    const context = new AudioContextClass();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);

    const samples = new Float32Array(analyser.fftSize);
    let frame;

    const tick = () => {
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
        // Speech sits around 0.02 to 0.2 RMS. Spread that over the meter.
        onLevel(Math.min(1, rms * 6));
        frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
        cancelAnimationFrame(frame);
        source.disconnect();
        context.close().catch(() => {});
    };
}

export async function getMicrophone() {
    return navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
}

export function microphoneError(error) {
    if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
        return "Microphone access is blocked. Allow it from the icon in your address bar, then try again.";
    }
    if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
        return "No microphone was found. Plug one in, or answer by typing.";
    }
    if (error?.name === "NotReadableError") {
        return "Your microphone is being used by another app. Close it, then try again.";
    }
    return "Couldn't start the microphone. You can still answer by typing.";
}
