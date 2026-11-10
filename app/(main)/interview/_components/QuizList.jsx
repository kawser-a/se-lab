"use client";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import QuizResult from './QuizResult';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const QuizList = ({ assesments }) => {

    const router = useRouter();
    const [selectedQuiz, setSelectedQuiz] = useState(null);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="gradient-title text-3xl md:text-4xl">
                                Recent Quizzes
                            </CardTitle>
                            <CardDescription>
                                Review your past quiz performance
                            </CardDescription>
                        </div>
                        <div className='flex flex-wrap gap-3 sm:gap-4 items-center'>
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
