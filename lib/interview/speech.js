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
    if (!text) return [];
    const sentences = (text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]*\s*/g) ?? []).flatMap((sentence) =>
        splitLong(sentence.trim(), maxLength)
    );
    return pack(sentences, maxLength);
}

// The interviewer's voice. Uses the natural voice from the server when it's
// available and falls back to the browser's own voice if it isn't.
// `onLevel` reports loudness from 0 to 1 so the interviewer's tile can move
// with the voice; `onCaption` reports the sentence being spoken.
//
// Lines are given as parts: plain strings, or { text, style } where style
// is a delivery direction for the natural voice ("warm", "friendly").
//
// Natural voice requests that fail (usually the free tier's rate limit)
// pause it for this long, then it's tried again.
const SERVER_VOICE_COOLDOWN_MS = 60000;
// Leaves room for the style direction within the 200 character limit.
const CHUNK_LENGTH = 180;

const toPart = (part) => (typeof part === "string" ? { text: part } : part);

// The words of `text` said by the time `fraction` of it has been spoken,
// cut at the end of the last whole word.
export function revealWords(text, fraction) {
    if (fraction >= 1) return text;
    if (fraction <= 0) return "";
    const target = Math.floor(text.length * fraction);
    const end = text.indexOf(" ", target);
    return end === -1 ? text : text.slice(0, end);
}

// Generated speech has a little silence at each end, so the words are
// spread over a slightly shorter stretch than the whole clip.
const SPOKEN_SHARE = 0.9;

export function createSpeaker({ voice, serverVoice, onLevel = () => {}, onCaption = () => {} }) {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    let browserVoice = null;
    let serverPausedUntil = serverVoice ? 0 : Infinity;
    const serverAvailable = () => Date.now() >= serverPausedUntil;
    let generation = 0;
    let context = null;
    let analyser = null;
    let source = null;
    let frame = null;
    let paused = false;
    let resumeWaiters = [];
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

    const whilePaused = () => (paused ? new Promise((resolve) => resumeWaiters.push(resolve)) : Promise.resolve());

    const watchLevel = (onFrame) => {
        const samples = new Float32Array(analyser.fftSize);
        const tick = () => {
            analyser.getFloatTimeDomainData(samples);
            const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
            onLevel(Math.min(1, rms * 5));
            onFrame?.();
            frame = requestAnimationFrame(tick);
        };
        tick();
    };

    const stopLevel = () => {
        cancelAnimationFrame(frame);
        onLevel(0);
    };

    // Fetches the raw audio. Decoding waits until it's played, so this can
    // run before the first click, while the audio context isn't allowed yet.
    function fetchAudio({ text, style }) {
        const key = `${style ?? ""}|${text}`;
        if (!audioCache.has(key)) {
            const request = fetch("/api/interview/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voice, style }),
            }).then(async (response) => {
                if (!response.ok) throw new Error(`Voice request failed (${response.status})`);
                return response.arrayBuffer();
            });
            // Forget failures so a later retry isn't stuck with them.
            request.catch(() => audioCache.delete(key));
            audioCache.set(key, request);
        }
        return audioCache.get(key);
    }

    async function playAudio(bytes, run, onFraction) {
        // decodeAudioData takes ownership of the bytes, so hand it a copy and keep the cached original.
        const buffer = await ensureContext().decodeAudioData(bytes.slice(0));
        await whilePaused();
        return new Promise((resolve) => {
            if (run !== generation) return resolve();
            source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(analyser);
            source.onended = () => {
                stopLevel();
                resolve();
            };
            // The audio clock stops while the context is suspended, so the
            // words stop appearing during a pause too.
            const startedAt = context.currentTime;
            watchLevel(() => onFraction((context.currentTime - startedAt) / (buffer.duration * SPOKEN_SHARE)));
            source.start();
        });
    }

    function speakWithBrowser(text, run, onFraction) {
        return new Promise((resolve) => {
            if (!synth || run !== generation) return resolve();
            const utterance = new SpeechSynthesisUtterance(text);
            if (browserVoice) utterance.voice = browserVoice;
            utterance.lang = browserVoice?.lang ?? "en-US";

            // Word positions come from the voice when it reports them, and
            // from a speaking-rate estimate when it doesn't (many don't).
            let boundary = 0;
            utterance.onboundary = (event) => {
                boundary = Math.max(boundary, event.charIndex / text.length);
            };
            const estimate = () => spent / ((text.length / 15) * 1000);

            // The browser voice gives no loudness, so pulse gently instead.
            // Some browsers never fire "end", so give up after a generous
            // estimate of the speaking time, not counting time spent paused.
            const limit = (text.split(/\s+/).length / 2.2) * 1000 + 3000;
            let spent = 0;
            let phase = 0;
            const timer = setInterval(() => {
                if (paused) return onLevel(0);
                spent += 120;
                onLevel(0.35 + 0.25 * Math.abs(Math.sin((phase += 0.6))));
                // Never show the last word before it's actually been said.
                onFraction(Math.min(0.97, Math.max(boundary, estimate())));
                if (spent > limit) done();
            }, 120);
            function done() {
                clearInterval(timer);
                onLevel(0);
                resolve();
            }
            utterance.onend = done;
            utterance.onerror = done;
            synth.speak(utterance);
        });
    }

    // Each part is split on its own, so a question's audio is the same
    // whatever was said before it, and can be fetched ahead of time.
    const chunksOf = (parts) =>
        []
            .concat(parts)
            .filter(Boolean)
            .map(toPart)
            .flatMap(({ text, style }) => splitForSpeech(text, CHUNK_LENGTH).map((chunk) => ({ text: chunk, style })));

    return {
        get natural() {
            return serverAvailable();
        },

        get paused() {
            return paused;
        },

        // Starts loading the audio for lines that are coming up.
        prefetch(parts) {
            if (!serverAvailable()) return;
            for (const chunk of chunksOf(parts)) fetchAudio(chunk).catch(() => {});
        },

        // Call from a click or tap. Browsers only allow audio to start after one.
        unlock() {
            ensureContext().resume?.().catch(() => {});
        },

        // Speaks the parts in order. `onProgress(spoken, line)` follows along
        // word by word: everything said so far, and the sentence being said.
        // Resolves true when it finished, false when it was cancelled.
        async speak(parts, { onProgress = () => {} } = {}) {
            const run = ++generation;
            synth?.cancel();
            const chunks = chunksOf(parts);
            let before = "";
            let shown = null;

            const follow = (chunk) => (fraction) => {
                const line = revealWords(chunk.text, fraction);
                if (line === shown) return;
                shown = line;
                onProgress(`${before}${line}`.trim(), line);
            };

            for (const [index, chunk] of chunks.entries()) {
                await whilePaused();
                if (run !== generation) return false;
                onCaption(chunk.text);
                const progress = follow(chunk);

                let spoken = false;
                if (serverAvailable()) {
                    try {
                        const bytes = await fetchAudio(chunk);
                        // Ask for the next piece while this one plays.
                        if (chunks[index + 1]) fetchAudio(chunks[index + 1]).catch(() => {});
                        await playAudio(bytes, run, progress);
                        spoken = true;
                    } catch {
                        serverPausedUntil = Date.now() + SERVER_VOICE_COOLDOWN_MS;
                    }
                }
                if (!spoken) await speakWithBrowser(chunk.text, run, progress);
                if (run !== generation) return false;
                progress(1);
                before += `${chunk.text} `;
            }
            return true;
        },

        // Holds the voice mid-sentence; resume() carries on from there.
        pause() {
            if (paused) return;
            paused = true;
            context?.suspend?.().catch(() => {});
            synth?.pause();
        },

        resume() {
            if (!paused) return;
            paused = false;
            context?.resume?.().catch(() => {});
            synth?.resume();
            const waiting = resumeWaiters;
            resumeWaiters = [];
            waiting.forEach((resolve) => resolve());
        },

        cancel() {
            generation++;
            synth?.cancel();
            try {
                source?.stop();
            } catch {}
            stopLevel();
            // Anything waiting on a pause is dropped along with the line.
            if (paused) {
                paused = false;
                context?.resume?.().catch(() => {});
                const waiting = resumeWaiters;
                resumeWaiters = [];
                waiting.forEach((resolve) => resolve());
            }
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
    let running = false;
    let finalText = "";
    let interimText = "";

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
            interimText = interim.trim();
            onText({ final: finalText.trim(), interim: interimText });
        };

        recognition.onerror = (event) => {
            // Silence and our own stop() aren't problems.
            if (event.error === "no-speech" || event.error === "aborted") return;
            active = false;
            onError(event.error);
        };

        recognition.onend = () => {
            running = false;
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
        running = true;
    };

    return {
        start() {
            finalText = "";
            interimText = "";
            active = true;
            start();
        },
        // Resolves with everything said. The browser usually confirms the
        // last words within a moment of stopping; if it's slow, the words it
        // was still working on are used as they were, rather than waiting.
        stop() {
            active = false;
            const everything = () => `${finalText} ${interimText}`.replace(/\s+/g, " ").trim();
            return new Promise((resolve) => {
                if (!recognition || !running) return resolve(everything());
                const timer = setTimeout(() => resolve(everything()), 350);
                recognition.onresult = (event) => {
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            finalText += `${event.results[i][0].transcript.trim()} `;
                            interimText = "";
                        }
                    }
                };
                recognition.onend = () => {
                    clearTimeout(timer);
                    resolve(everything());
                };
                recognition.stop();
            });
        },
        // Stops listening but keeps what's been said, for resume() to add to.
        pause() {
            active = false;
            recognition?.stop();
        },
        resume() {
            if (active) return;
            active = true;
            // Still winding down from pause(): its end handler restarts it.
            if (!running) start();
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
        pause() {
            if (recorder.state === "recording") recorder.pause();
        },
        resume() {
            if (recorder.state === "paused") recorder.resume();
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
