import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Trophy } from 'lucide-react';
import React from 'react'

const StatsCards = ({ assesments }) => {

    const getAverageScore = () => {
        if (!assesments?.length) {
            return 0;
        }

        const total = assesments.reduce(
            (sum, assesment) => sum + assesment.quizScore, 0
        );

        return (total / assesments.length).toFixed(1);
    };

    const getLatestAssesments = () => {
        if (!assesments?.length) {
            return null;
        }

        return assesments[0];
    }

    const getTotalQuestions = () => {
        if (!assesments?.length) {
            return 0;
        }

        return assesments.reduce(
            (sum, assesment) => sum + assesment.questions.length, 0
        );
    };

    return (
        <div className='grid gap-4 md:grid-cols-3'>
            <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Avaerage Score
                        </CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getAverageScore()}%</div>
                        <p className="text-xs text-muted-foreground">
                            Across all assesments
                        </p>
                    </CardContent>
            </Card>

            <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Questions Practiced
                        </CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getTotalQuestions()}</div>
                        <p className="text-xs text-muted-foreground">
                            Total Questions
                        </p>
                    </CardContent>
            </Card>


            <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Latest Score
                        </CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getLatestAssesments()?.quizScore.toFixed(1) || 0}%</div>
                        <p className="text-xs text-muted-foreground">
                            Most recent attempt
                        </p>
                    </CardContent>
            </Card>
        </div>
    )
}

export default StatsCards
