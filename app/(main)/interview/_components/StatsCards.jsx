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
    // For Questions Practiced Card
    const getRecentQuestions = () => {
        // Replace with your actual data
        return Math.floor(Math.random() * 20) + 5;
    };

    const getDifficultyPercentage = (difficulty) => {
        const percentages = {
            'Easy': 60,
            'Medium': 30,
            'Hard': 10
        };
        return percentages[difficulty] || 0;
    };

    const getDifficultyCount = (difficulty) => {
        const counts = {
            'Easy': Math.floor(getTotalQuestions() * 0.6),
            'Medium': Math.floor(getTotalQuestions() * 0.3),
            'Hard': Math.floor(getTotalQuestions() * 0.1)
        };
        return counts[difficulty] || 0;
    };

    return (
        <>
            {/* <div className='grid gap-4 md:grid-cols-3'>
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
            </div> */}

            <div className="grid gap-6 md:grid-cols-3">
                {/* Average Score Card */}
                <Card className="group relative overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] shadow-lg transition-all duration-300 hover:border-[#9EFF00]/30 hover:shadow-[#9EFF00]/10 hover:bg-[#1F1F1F]">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#9EFF00]/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-70" />

                    <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
                        <CardTitle className="text-sm font-medium text-[#A1A1AA]">
                            Average Score
                        </CardTitle>
                        <div className="rounded-full p-2 bg-[#1F1F1F] border border-[#2A2A2A] group-hover:border-[#9EFF00]/30 transition-colors duration-300">
                            <Trophy className="h-4 w-4 text-[#9EFF00]" />
                        </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-6">
                        <div className="text-3xl font-bold text-white mb-1">
                            {getAverageScore()}%
                        </div>
                        <div className="flex items-center">
                            <p className="text-xs text-[#7D6161] mr-2">
                                Across all assessments
                            </p>
                            <div className="h-1 w-1 rounded-full bg-[#7D6161]" />
                            <span className={`text-xs font-medium ml-2 ${getAverageScore() >= 70 ? 'text-[#9EFF00]' : 'text-red-500'}`}>
                                {getAverageScore() >= 70 ? 'Excellent' : 'Needs improvement'}
                            </span>
                        </div>

                        {/* Score trend indicator */}
                        <div className="mt-4 h-1.5 w-full bg-[#2A2A2A] rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${getAverageScore() >= 70 ? 'bg-[#9EFF00]' : 'bg-red-500'}`}
                                style={{ width: `${getAverageScore()}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Practiced Card */}
                <Card className="group relative overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] shadow-lg transition-all duration-300 hover:border-[#9EFF00]/30 hover:shadow-[#9EFF00]/10 hover:bg-[#1F1F1F]">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#9EFF00]/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-70" />

                    <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
                        <CardTitle className="text-sm font-medium text-[#A1A1AA]">
                            Questions Practiced
                        </CardTitle>
                        <div className="rounded-full p-2 bg-[#1F1F1F] border border-[#2A2A2A] group-hover:border-[#9EFF00]/30 transition-colors duration-300">
                            <Brain className="h-4 w-4 text-[#9EFF00]" />
                        </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-6">
                        <div className="text-3xl font-bold text-white mb-1">
                            {getTotalQuestions()}
                        </div>
                        <div className="flex items-center">
                            <p className="text-xs text-[#7D6161] mr-2">
                                Total questions
                            </p>
                            <div className="h-1 w-1 rounded-full bg-[#7D6161]" />
                            <span className="text-xs font-medium text-[#9EFF00] ml-2">
                                +{getRecentQuestions()} this week
                            </span>
                        </div>

                        {/* Mini progress bars */}
                        <div className="mt-4 space-y-1.5">
                            {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                                <div key={difficulty} className="flex items-center">
                                    <span className="text-xs text-[#7D6161] w-16">{difficulty}</span>
                                    <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${difficulty === 'Easy' ? 'bg-green-500' :
                                                difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${getDifficultyPercentage(difficulty)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-[#7D6161] ml-2 w-8 text-right">
                                        {getDifficultyCount(difficulty)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Latest Score Card */}
                <Card className="group relative overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] shadow-md transition-all duration-300 hover:border-[#9EFF00]/30 hover:shadow-[#9EFF00]/10 hover:bg-[#1F1F1F]">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#9EFF00]/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-60" />

                    <CardHeader className="flex items-center justify-between px-5 pt-5 pb-2">
                        <CardTitle className="text-sm font-medium text-[#A1A1AA]">Latest Score</CardTitle>
                        <div className="rounded-full p-1.5 bg-[#1F1F1F] border border-[#2A2A2A] group-hover:border-[#9EFF00]/30 transition-colors duration-300">
                            <Trophy className="h-4 w-4 text-[#9EFF00]" />
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 pt-2 flex flex-col items-center text-center space-y-2">
                        {/* Compact Radial Chart */}
                        <div className="relative h-20 w-20">
                            <div className="absolute inset-0 rounded-full border-4 border-[#2A2A2A]"></div>
                            <div
                                className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#9EFF00] border-r-[#9EFF00]"
                                style={{
                                    transform: `rotate(${((getLatestAssesments()?.quizScore || 0) / 100) * 360}deg)`
                                }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                {getLatestAssesments()?.quizScore.toFixed(1) || 0}%
                            </div>
                        </div>

                        {/* Text Section */}
                        <div className="text-white leading-tight">
                            <div className="text-[0.95rem] font-semibold">
                                {getLatestAssesments()?.quizScore.toFixed(1) || 0}%
                            </div>
                            <div className="text-xs text-[#7D6161]">Most recent attempt</div>
                            <div
                                className={`text-xs font-medium mt-0.5 ${(getLatestAssesments()?.quizScore || 0) >= (getAverageScore() || 0)
                                        ? 'text-[#9EFF00]'
                                        : 'text-red-500'
                                    }`}
                            >
                                {(getLatestAssesments()?.quizScore || 0) >= (getAverageScore() || 0)
                                    ? 'Above average'
                                    : 'Below average'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </>
    )
}

export default StatsCards
