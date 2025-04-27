import { getAssesments } from '@/actions/interview'
import React from 'react'
import QuizList from './_components/QuizList';
import PerformanceChart from './_components/PerformanceChart';
import StatsCards from './_components/StatsCards';

const InterviewPage = async () => {

    const assesments = await getAssesments();

    return (
        <div>
            <div>
                <h1 className='text-6xl font-bold gradient-title mb-5'>
                    Interview Preparation
                </h1>

                <div className='space-y-6'>
                    <StatsCards assesments={assesments}/>
                    <PerformanceChart assesments={assesments}/>
                    <QuizList assesments={assesments}/>
                </div>
            </div>
        </div>
    )
}

export default InterviewPage
