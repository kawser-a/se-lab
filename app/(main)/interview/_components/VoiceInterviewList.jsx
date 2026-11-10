import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { INTERVIEW_TYPES } from "@/lib/interview/config";

const VoiceInterviewList = ({ interviews }) => (
    <Card>
        <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="gradient-title text-3xl md:text-4xl">Voice Interviews</CardTitle>
                    <CardDescription>Answer out loud and get feedback on every answer</CardDescription>
                </div>
                <Button asChild className="h-11">
                    <Link href="/interview/voice/new">
                        <Mic /> Start voice interview
                    </Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            {interviews.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No voice interviews yet. A quick one takes about 10 minutes.
                </p>
            ) : (
                <ul className="divide-y rounded-xl border">
                    {interviews.map((interview) => {
                        const inProgress = interview.status === "IN_PROGRESS";
                        const href = inProgress ? `/interview/voice/${interview.id}` : `/interview/voice/${interview.id}/feedback`;
                        return (
                            <li key={interview.id}>
                                <Link href={href} className="flex items-center gap-4 p-4 transition-colors hover:bg-white/5">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">{interview.role}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {INTERVIEW_TYPES[interview.type]?.label} · {format(new Date(interview.createdAt), "d MMM yyyy, HH:mm")}
                                        </p>
                                    </div>
                                    {inProgress ? (
                                        <span className="shrink-0 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300">
                                            Resume · {interview.answered}/{interview.total}
                                        </span>
                                    ) : interview.hasFeedback ? (
                                        <span className="shrink-0 text-xl font-bold text-[#C9F300]">{Math.round(interview.score)}</span>
                                    ) : (
                                        <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">Feedback pending</span>
                                    )}
                                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </CardContent>
    </Card>
);

export default VoiceInterviewList;
