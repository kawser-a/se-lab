"use client";

import { useEffect, useState, useRef } from "react";
import { getVoiceInterviews } from "@/actions/interview";
import { Button } from "@/components/ui/button";

const ELEVENLABS_API_KEY = "sk_0dceffe7a73fa0bbef4e66abd7a6f656ac79cf3d0deefcc8"; // Replace with env in production
const VOICE_ID = "19STyYD15bswVz51nqLf"; // Rachel

export default function VoiceHistoryPage() {
    const audioCache = useRef(new Map());
    const audioRef = useRef(null);
    const [interviews, setInterviews] = useState([]);
    const [playingId, setPlayingId] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0); // 0 to 100
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        getVoiceInterviews().then(setInterviews);
        if (typeof window !== "undefined") {
            audioRef.current = new Audio();
        }
    }, []);

    const stopPlayback = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        setPlayingId(null);
        setProgress(0);
        setIsPaused(false);
    };

    const pauseResume = () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPaused(false);
        } else {
            audioRef.current.pause();
            setIsPaused(true);
        }
    };

    const speakTranscript = async (transcript, interviewId) => {
        stopPlayback();

        const fullText = transcript
            .map((line) => `${line.from === "ai" ? "AI says" : "You said"}: ${line.text}`)
            .join(". ");

        let audioUrl = audioCache.current.get(fullText);
        if (!audioUrl) {
            audioUrl = await getElevenLabsAudio(fullText);
            if (audioUrl) {
                audioCache.current.set(fullText, audioUrl);
            } else {
                return;
            }
        }

        setPlayingId(interviewId);
        audioRef.current.src = audioUrl;

        audioRef.current.onloadedmetadata = () => {
            setDuration(audioRef.current.duration);
        };

        audioRef.current.ontimeupdate = () => {
            if (audioRef.current.duration) {
                const current = (audioRef.current.currentTime / audioRef.current.duration) * 100;
                setProgress(current);
            }
        };

        audioRef.current.onended = () => {
            stopPlayback();
        };

        audioRef.current.play();
    };

    const getElevenLabsAudio = async (text) => {
        try {
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
                method: "POST",
                headers: {
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: { stability: 0.4, similarity_boost: 0.75 },
                }),
            });

            if (!res.ok) throw new Error("TTS fetch failed");
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error("TTS Error:", e.message);
            return null;
        }
    };

    return (
        <div className="w-full mx-auto px-6 py-10 space-y-8 ">
            {/* <h1 className="text-3xl font-bold">🧠 Voice Interview History</h1> */}

            {interviews.length === 0 ? (
                <p>No interviews found.</p>
            ) : (
                <ul className="space-y-6">
                    {interviews.map((iv) => (
                        <li key={iv.id} className="border p-4 rounded-xl  ">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <p><strong>Date:</strong> {new Date(iv.createdAt).toLocaleString()}</p>
                                <p><strong>Score:</strong> {iv.score.toFixed(1)}%</p>
                                <p><strong>Role:</strong> {iv.role}</p>
                                <p><strong>Level:</strong> {iv.level}</p>
                                <p><strong>Type:</strong> {iv.type}</p>
                            </div>

                            <div className="flex gap-4 items-center mt-4">
                                <Button
                                    onClick={() => speakTranscript(iv.transcriptJson, iv.id)}
                                    disabled={playingId !== null}
                                    className="bg-lime-300 text-black hover:bg-lime-400"
                                >
                                    ▶️ Play
                                </Button>
                                <Button
                                    onClick={pauseResume}
                                    disabled={playingId !== iv.id}
                                    variant="outline"
                                >
                                    {isPaused ? "⏯ Resume" : "⏸ Pause"}
                                </Button>
                                <Button
                                    onClick={stopPlayback}
                                    disabled={playingId !== iv.id}
                                    variant="outline"
                                >
                                    ⏹ Stop
                                </Button>
                            </div>

                            {playingId === iv.id && (
                                <div className="relative mt-4 h-3 w-full bg-gray-300 rounded-full overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-lime-400 transition-all duration-200 ease-linear"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
