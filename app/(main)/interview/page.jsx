import { getAssesments } from "@/actions/interview";
import PerformanceChart from "./_components/PerformanceChart";
import QuizList from "./_components/QuizList";
import StatsCards from "./_components/StatsCards";


const InterviewPage = async () => {
    const assesments = await getAssesments();
    return (
        <div className='pt-4'>
            <div className=''>
                <h1 className='text-4xl md:text-6xl font-bold gradient-title text-[#F4F4F5]'>Interview <span className="relative inline-block mb-10">
                    <span className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1" />
                    <strong className="text-black">Preparation</strong>
                </span>
                </h1>

                <div className='space-y-6'>
                    <StatsCards assesments={assesments} />
                    <PerformanceChart assesments={assesments} />
                    <QuizList assesments={assesments} />
                </div>
            </div>
        </div>
    )
}

export default InterviewPage
