"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    generateVoiceInterview,
    generateVoiceFeedback,
    saveVoiceInterviewResult,
} from "@/actions/interview";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function VoiceSessionPage() {
    const params = useSearchParams();
    const [stage, setStage] = useState("loading");
    const [questions, setQuestions] = useState([]);
    const [transcript, setTranscript] = useState([]);
    const [feedback, setFeedback] = useState(null);

    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const audioCache = useRef(new Map());
    const stageRef = useRef(stage);
    const questionIndexRef = useRef(0);
    const transcriptRef = useRef([]);

    const ELEVEN_API_KEY = "sk_0ebfe7d99f47c559cacafbf2133ca3ee8c16161549ae565e";
    const VOICE_ID = "Hh0rE70WfnSFN80K8uJC"; // Rachel (friendly voice)

    const config = {
        level: params.get("level"),
        amount: params.get("amount"),
        techStack: params.get("techStack")
            ? params.get("techStack").split(",").map((s) => s.trim())
            : [],
        role: params.get("role"),
        type: params.get("type"),
    };

    useEffect(() => {
        stageRef.current = stage;
    }, [stage]);

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            audioRef.current = new Audio();
        }
    }, []);

    useEffect(() => {
        async function loadQuestions() {
            try {
                const q = await generateVoiceInterview(config);
                if (!q || q.length === 0) throw new Error("Empty question set");
                setQuestions(q);
                setStage("greeting");
            } catch (err) {
                console.error("Failed to load questions:", err);
                toast.error("Failed to load questions");
            }
        }
        loadQuestions();
    }, []);

    useEffect(() => {
        if (stage === "greeting") {
            elevenSpeak(
                "Hello! I'm your AI interviewer. Are you ready to begin?",
                () => {
                    startListening();
                }
            );
        }
    }, [stage]);

    const elevenSpeak = async (text, cb) => {
        try {
            let audioUrl = audioCache.current.get(text);
            if (!audioUrl) {
                const res = await fetch(
                    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
                    {
                        method: "POST",
                        headers: {
                            "xi-api-key": ELEVEN_API_KEY,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            text,
                            model_id: "eleven_monolingual_v1",
                            voice_settings: {
                                stability: 0.6,
                                similarity_boost: 0.75,
                            },
                        }),
                    }
                );

                if (!res.ok) throw new Error("TTS failed");
                const blob = await res.blob();
                audioUrl = URL.createObjectURL(blob);
                audioCache.current.set(text, audioUrl);
            }

            audioRef.current.src = audioUrl;
            audioRef.current.play();
            audioRef.current.onended = cb;
            setTranscript((prev) => [...prev, { from: "ai", text }]);
        } catch (e) {
            console.error("ElevenLabs TTS error:", e);
            toast.error("Voice generation failed.");
            cb?.();
        }
    };

    const startListening = () => {
        if (stageRef.current === "finished") return;
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Speech recognition not supported");
            return;
        }

        if (recognitionRef.current) recognitionRef.current.abort();

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (e) => {
            const response = e.results[0][0].transcript.trim();
            handleUserSpeech(response);
        };

        recognition.onerror = (e) => {
            toast.error("Speech recognition error: " + e.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleUserSpeech = (text) => {
        if (stageRef.current === "finished") return;
        setTranscript((prev) => [...prev, { from: "user", text }]);

        if (stageRef.current === "greeting") {
            if (text.toLowerCase().includes("yes")) {
                setStage("qna");
                questionIndexRef.current = 0;
                elevenSpeak(questions[0].question, () => startListening());
            } else {
                elevenSpeak("Let me know when you're ready.", () => startListening());
            }
        } else if (stageRef.current === "qna") {
            questionIndexRef.current += 1;
            const nextIndex = questionIndexRef.current;
            if (nextIndex < questions.length) {
                elevenSpeak(questions[nextIndex].question, () => startListening());
            } else {
                if (recognitionRef.current) recognitionRef.current.abort();
                finishInterview();
            }
        }
    };

    const finishInterview = async () => {
        setStage("finished");
        try {
            const qnaPairs = questions.map((q, i) => ({
                question: q.question,
                answer: transcriptRef.current.filter((t) => t.from === "user")[i]?.text || "",
            }));

            const fb = await generateVoiceFeedback(config, qnaPairs);
            if (!fb || fb.overallScore == null) throw new Error("Invalid feedback");

            const aiAudioUrls = []; // optional: push audioCache URLs here if you want to store
            await saveVoiceInterviewResult(
                config,
                qnaPairs,
                fb,
                transcriptRef.current,
                aiAudioUrls
            );
            setFeedback(fb);
            toast.success("Interview completed");
        } catch (err) {
            console.error("Error during finishInterview:", err);
            toast.error("Failed to process interview");
        }
    };

    // Render stages...
    if (stage === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-[#9EFF00]/20"></div>
                    <p className="text-xl text-[#D4D4D8]">Preparing your interview...</p>
                </div>
            </div>
        );
    }

    if (stage === "finished" && feedback) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-[#F4F4F5] mb-2">
                        Interview Feedback
                    </h1>
                    <div className="text-5xl font-bold text-[#9EFF00] mb-6">
                        {feedback.overallScore.toFixed(1)}%
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-[#F4F4F5] mb-4">
                            Strengths
                        </h2>
                        <p className="text-[#D4D4D8]">{feedback.strengths}</p>
                    </div>

                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-[#F4F4F5] mb-4">
                            Areas for Improvement
                        </h2>
                        <p className="text-[#D4D4D8]">{feedback.areasForImprovement}</p>
                    </div>
                </div>

                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-[#F4F4F5] mb-4">
                        Detailed Breakdown
                    </h2>
                    <div className="space-y-4">
                        {Object.entries(feedback.breakdown).map(([category, score]) => (
                            <div key={category} className="space-y-2">
                                <div className="flex justify-between text-sm text-[#D4D4D8]">
                                    <span>{category}</span>
                                    <span>{score.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-[#2A2A2A] rounded-full h-2">
                                    <div
                                        className="bg-[#9EFF00] h-2 rounded-full"
                                        style={{ width: `${score}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button
                        onClick={() => (window.location.href = "/interview")}
                        className="px-8 py-6 text-lg font-bold bg-[#9EFF00] hover:bg-[#9EFF00]/90 text-black rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-[#9EFF00]/30"
                    >
                        Back to Interview Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row gap-24 items-center justify-center">
                <div className="bg-gradient-to-br from-[#1D1D3B] to-[#0D0D2A] rounded-3xl p-6 w-[500px] h-72 flex flex-col items-center justify-center text-white shadow-xl border border-[#3F3F56]">
                    <div className="bg-white/10 p-4 rounded-full">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-16 h-16 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19V6l12-2v13M9 19l12-2M9 19L3 17V4l6 2v13z"
                            />
                        </svg>
                    </div>
                    <p className="mt-4 text-xl font-semibold">AI Interviewer</p>
                </div>

                <div className="bg-gradient-to-br from-[#121212] to-[#1A1A1A] rounded-3xl p-6 w-[500px] h-72 flex flex-col items-center justify-center text-white shadow-xl border border-[#2C2C2C]">
                    <img
                        src="/ahnaf.jpg"
                        alt="You"
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#9EFF00]"
                    />
                    <p className="mt-4 text-xl font-semibold">You</p>
                </div>
            </div>

            <div className="mt-8 bg-[#1A1A1A] rounded-xl px-6 py-4 text-center text-white text-lg font-medium border border-[#2A2A2A] w-[1100px] shadow-inner">
                {stage === "greeting" && "Are you ready to begin the interview?"}
                {stage === "qna" && questions[questionIndexRef.current]?.question}
                {stage === "finished" && "Interview completed. Generating feedback..."}
            </div>

            {stage !== "finished" && (
                <div className="flex items-center gap-2 mt-4">
                    <div className="h-3 w-3 rounded-full bg-[#9EFF00] animate-pulse" />
                    <span className="text-[#9EFF00] text-sm">Listening...</span>
                </div>
            )}
        </div>
    );
}
