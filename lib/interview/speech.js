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

// Long text is spoken a sentence or two at a time: Chrome cuts off speech
// longer than about 15 seconds, and the natural voice takes at most 200
// characters per request. A sentence that's still too long is split at a
// comma, or failing that between words.
function pack(pieces, maxLength) {
    const out = [];
    let current = "";
    for (const piece of pieces) {
        if ((current + " " + piece).trim().length > maxLength && current) {
            out.push(current.trim());
            current = "";
        }
        current += ` ${piece}`;
    }
    if (current.trim()) out.push(current.trim());
    return out;
}

function splitLong(sentence, maxLength) {
    if (sentence.length <= maxLength) return [sentence];
    const clauses = sentence.split(/(?<=,)\s+/).flatMap((clause) => (clause.length <= maxLength ? [clause] : pack(clause.split(/\s+/), maxLength)));
    return pack(clauses, maxLength);
}

export function splitForSpeech(text, maxLength = 180) {
    const sentences = (text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]*\s*/g) ?? []).flatMap((sentence) =>
        splitLong(sentence.trim(), maxLength)
    );
    return pack(sentences, maxLength);
}

// The interviewer's voice. Uses the natural voice from the server when it's
// available and falls back to the browser's own voice for the rest of the
// session if it isn't. `onLevel` reports loudness from 0 to 1 so the
// interviewer's tile can move with the voice; `onCaption` reports the
// sentence being spoken.
export function createSpeaker({ voice, serverVoice, onLevel = () => {}, onCaption = () => {} }) {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    let browserVoice = null;
    let useServer = Boolean(serverVoice);
    let generation = 0;
    let context = null;
    let analyser = null;
    let source = null;
    let frame = null;
    const audioCache = new Map();

    const loadVoice = () => {
        browserVoice = pickVoice(synth?.getVoices() ?? []);
    };
    if (synth) {
        loadVoice();
        synth.addEventListener?.("voiceschanged", loadVoice);
    }

    const ensureContext = () => {
        if (context) return context;
        const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
        context = new AudioContextClass();
        analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.connect(context.destination);
        return context;
    };

    const watchLevel = () => {
        const samples = new Float32Array(analyser.fftSize);
        const tick = () => {
            analyser.getFloatTimeDomainData(samples);
            const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
            onLevel(Math.min(1, rms * 5));
            frame = requestAnimationFrame(tick);
        };
        tick();
    };

    const stopLevel = () => {
        cancelAnimationFrame(frame);
        onLevel(0);
    };

    function fetchAudio(text) {
        if (!audioCache.has(text)) {
            const request = fetch("/api/interview/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voice }),
            }).then(async (response) => {
                if (!response.ok) throw new Error(`Voice request failed (${response.status})`);
                return ensureContext().decodeAudioData(await response.arrayBuffer());
            });
            // Forget failures so a later retry isn't stuck with them.
            request.catch(() => audioCache.delete(text));
            audioCache.set(text, request);
        }
        return audioCache.get(text);
    }

    function playBuffer(buffer, run) {
        return new Promise((resolve) => {
            if (run !== generation) return resolve();
            source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(analyser);
            source.onended = () => {
                stopLevel();
                resolve();
            };
            watchLevel();
            source.start();
        });
    }

    function speakWithBrowser(text, run) {
        return new Promise((resolve) => {
            if (!synth || run !== generation) return resolve();
            const utterance = new SpeechSynthesisUtterance(text);
            if (browserVoice) utterance.voice = browserVoice;
            utterance.lang = browserVoice?.lang ?? "en-US";

            // The browser voice gives no loudness, so pulse gently instead.
            let phase = 0;
            const pulse = setInterval(() => onLevel(0.35 + 0.25 * Math.abs(Math.sin((phase += 0.6)))), 120);

            // Some browsers never fire "end". Don't let that freeze the interview.
            const words = text.split(/\s+/).length;
            const fallback = setTimeout(done, (words / 2.2) * 1000 + 3000);
            function done() {
                clearTimeout(fallback);
                clearInterval(pulse);
                onLevel(0);
                resolve();
            }
            utterance.onend = done;
            utterance.onerror = done;
            synth.speak(utterance);
        });
    }

    return {
        get natural() {
            return useServer;
        },

        // Call from a click or tap. Browsers only allow audio to start after one.
        unlock() {
            ensureContext().resume?.().catch(() => {});
        },

        async speak(text) {
            const run = ++generation;
            synth?.cancel();
            const chunks = splitForSpeech(text, 190);

            for (const [index, chunk] of chunks.entries()) {
                if (run !== generation) return;
                onCaption(chunk);

                if (useServer) {
                    try {
                        const buffer = await fetchAudio(chunk);
                        // Ask for the next piece while this one plays.
                        if (chunks[index + 1]) fetchAudio(chunks[index + 1]).catch(() => {});
                        await playBuffer(buffer, run);
                        continue;
                    } catch {
                        useServer = false;
                    }
                }
                await speakWithBrowser(chunk, run);
            }
        },

        cancel() {
            generation++;
            synth?.cancel();
            try {
                source?.stop();
            } catch {}
            stopLevel();
        },

        dispose() {
            this.cancel();
            synth?.removeEventListener?.("voiceschanged", loadVoice);
            context?.close().catch(() => {});
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
