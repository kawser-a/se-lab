"use client";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import QuizResult from './QuizResult';
import Link from 'next/link';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import VoiceHistoryPage from '../voice-history/page';

const QuizList = ({ assesments }) => {

    const router = useRouter();
    const [selectedQuiz, setSelectedQuiz] = useState(null);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="gradient-title text-3xl md:text-4xl">
                                Recent Quizzes
                            </CardTitle>
                            <CardDescription>
                                Review your past quiz performance
                            </CardDescription>
                        </div>
                        <div className='flex gap-4 items-center justify-center'>
                            <Link href="/interview/mock/voice">
                                <Button className="bg-green-600 text-white px-4 py-2 rounded hover:text-black">
                                    Start Interview
                                </Button>
                            </Link>
                            <Button onClick={() => router.push("/interview/mock")}>
                                Start New Quiz
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {assesments?.map((assessment, i) => (
                            <Card
                                key={assessment.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setSelectedQuiz(assessment)}
                            >
                                <CardHeader>
                                    <CardTitle className="gradient-title text-2xl">
                                        Quiz {i + 1}
                                    </CardTitle>
                                    <CardDescription className="flex justify-between w-full">
                                        <div>Score: {assessment.quizScore.toFixed(1)}%</div>
                                        <div>
                                            {format(
                                                new Date(assessment.createdAt),
                                                "MMMM dd, yyyy HH:mm"
                                            )}
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                                {assessment.improvementTip && (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            {assessment.improvementTip}
                                        </p>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="gradient-title text-3xl md:text-4xl">
                                Recent Interviews
                            </CardTitle>
                            <CardDescription>
                                Review your past interview performance
                            </CardDescription>
                        </div>
                        <div className="flex gap-4 items-center justify-center">
                            <Link href="/interview/mock/voice">
                                <Button className="bg-green-600 text-white px-4 py-2 rounded hover:text-black">
                                    Start Interview
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
                        <VoiceHistoryPage />
                    </div>
                </CardContent>
            </Card>



            <AlertDialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
                <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle></AlertDialogTitle>
                    </AlertDialogHeader>
                    <QuizResult
                        result={selectedQuiz}
                        hideStartNew
                        onStartNew={() => router.push("/interview/mock")}
                    />
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default QuizList
