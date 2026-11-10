'use client';

import Image from 'next/image';
import React from 'react';
import { LeaderboardCard } from './sub-comp/LeaderboardCard';

const WorkFlow = () => {
    return (
        <section id="how-it-works" className="scroll-mt-28 bg-[#0E0E0E] text-[#F4F4F5] mt-24 pt-3">
            <div className="page-container container max-w-6xl mx-auto px-2 sm:px-6 pb-12">
                {/* Header */}
                <div className="text-center my-12 md:my-20">
                    <h2 className="text-center text-[#F4F4F5] text-3xl leading-tight md:text-5xl font-extrabold tracking-tight">
                        How It Works – <span className='underline decoration-wavy decoration-[#9EFF00] underline-offset-6'>
                        From First Step to First Offer
                        </span>
                    </h2>
                    <p className="text-center text-[#D4D4D8] text-sm md:text-base font-medium tracking-wide my-2">
                        Your complete workflow — built to guide freshers and recruiters from profile creation to job matching and success.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-12 gap-6 auto-rows-[minmax(240px,_auto)]">
                    {/* Step 1: Profile Setup */}
                    <div className="col-span-12 md:col-span-6 group p-6 rounded-3xl border border-[#1A1A1A] bg-gradient-to-br from-[#121212] to-[#1A1A1A] hover:to-[#191919] transition-colors duration-300 shadow-lg hover:shadow-[#9EFF00]/20 flex flex-col items-center cursor-pointer">
                        <div className="mb-6">
                            <Image src="/images/role.jpg" alt="Profile Setup" width={120} height={120} className="rounded-xl shadow-md" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-[#9EFF00]">
                            Step 1: Create Your Profile
                        </h3>
                        <p className="text-sm text-[#A1A1AA] text-center">
                            Sign up as a job seeker or recruiter. Add your background, skills, and preferences to personalize your experience.
                        </p>
                    </div>

                    {/* Step 2: Explore Insights */}
                    <div className="col-span-12 md:col-span-6 group p-6 rounded-3xl border border-[#1A1A1A] bg-gradient-to-br from-[#121212] to-[#1A1A1A] hover:to-[#191919] transition-colors duration-300 shadow-lg hover:shadow-[#9EFF00]/20 flex flex-col items-center cursor-pointer">
                        <div className="mb-6">
                            <Image src="/images/intel.jpg" alt="Industry Insights" width={120} height={120} className="rounded-xl shadow-md" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-[#9EFF00]">Step 2: Explore Industry Insights</h3>
                        <p className="text-sm text-[#A1A1AA] text-center">
                            Access updated market data, salary benchmarks, and trending skills tailored to your career interests.
                        </p>
                    </div>

                    {/* Step 3: AI Resume */}
                    <div className="col-span-12 md:col-span-6 group p-6 rounded-3xl border border-[#1A1A1A] bg-gradient-to-br from-[#121212] to-[#1A1A1A] hover:to-[#191919] transition-colors duration-300 shadow-lg hover:shadow-[#9EFF00]/20 flex flex-col items-center cursor-pointer">
                        <div className="">
                            <div className="relative flex justify-center items-center h-[220px] mb-6 w-full">
                                <div className="absolute left-1/2 top-1/2 -translate-x-[90%] -translate-y-1/2 z-10 rotate-[-12deg] shadow-xl rounded-2xl overflow-hidden transition-transform duration-300 ease-in-out group-hover:rotate-[-18deg]">
                                    <Image
                                        src="/images/resume.jpg"
                                        alt="Resume template 1"
                                        width={140}
                                        height={180}
                                        className="object-cover w-[100px] h-[140px] md:w-[140px] md:h-[180px]"
                                    />
                                </div>
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 rotate-[4deg] shadow-2xl rounded-2xl overflow-hidden transition-transform duration-300 ease-in-out group-hover:rotate-[0deg]">
                                    <Image
                                        src="/images/resume.jpg"
                                        alt="Resume template 2"
                                        width={140}
                                        height={180}
                                        className="object-cover w-[100px] h-[140px] md:w-[140px] md:h-[180px]"
                                    />
                                </div>
                                <div className="absolute left-1/2 top-[54%] -translate-x-[12%] -translate-y-1/2 z-40 rotate-[16deg] shadow-xl rounded-2xl overflow-hidden transition-transform duration-300 ease-in-out group-hover:rotate-[18deg]">
                                    <Image
                                        src="/images/resume.jpg"
                                        alt="Resume template 3"
                                        width={140}
                                        height={180}
                                        className="object-cover w-[100px] h-[140px] md:w-[140px] md:h-[180px]"
                                    />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-[#9EFF00]">AI Resume Builder</h3>
                            <p className="text-sm text-[#A1A1AA] text-center">
                                Create professional, ATS-optimized resumes in minutes with our smart templates and AI-powered suggestions.
                            </p>
                        </div>
                    </div>

                    {/* Step 4: Interview Coach */}
                    <div className="col-span-12 md:col-span-6 group p-6 rounded-3xl border border-[#1A1A1A] bg-gradient-to-br from-[#121212] to-[#1A1A1A] hover:to-[#191919] transition-colors duration-300 shadow-lg hover:shadow-[#9EFF00]/20 flex flex-col items-center cursor-pointer">
                        <div className="">
                            <div className="relative flex flex-col items-center justify-center w-full mb-6 mt-20">
                                <div className="relative z-10">
                                    <Image
                                        src="/people/ramim.jpg"
                                        alt="Interview coach"
                                        width={120}
                                        height={120}
                                        className="rounded-full border-4 border-[#e0edff] shadow-lg object-cover"
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative w-[220px] h-[160px]">
                                        {['top-12', '-top-4', 'bottom-[70px]', 'bottom-20', '-top-4'].map((pos, idx) => (
                                            <div
                                                key={idx}
                                                className={`absolute ${idx === 0 ? 'left-1/2 -translate-x-1/2 -top-12' :
                                                    idx === 1 ? 'right-5 -top-4' :
                                                        idx === 2 ? '-right-4 bottom-[70px]' :
                                                            idx === 3 ? '-left-4 bottom-20' :
                                                                'left-5 -top-4'
                                                    }`}
                                            >
                                                <Image
                                                    src={`/review/f${idx + 5}.jpg`}
                                                    alt={`Community member ${idx + 1}`}
                                                    width={44}
                                                    height={44}
                                                    className="rounded-full  border-white shadow-md size-9 object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute left-1/2 top-[60px] -translate-x-1/2 z-0 pointer-events-none">
                                    <div className="w-[180px] h-[180px] rounded-full border-2 border-[#d9e9ff] opacity-60 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ease-in-out group-hover:scale-110" />
                                    <div className="w-[140px] h-[140px] rounded-full border-2 border-[#d9e9ff] opacity-40 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 ease-in-out group-hover:scale-125" />
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center mt-9">
                                <h3 className="text-xl font-semibold mb-2 text-[#9EFF00]">Interview Prep Community</h3>
                                <p className="text-sm text-[#A1A1AA] text-center">
                                    Join thousands of job seekers practicing with our AI interview coach and sharing tips.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* LeaderboardCard (Use Case: For Recruiters) */}
                    <div className="col-span-12 md:col-span-4">
                        <LeaderboardCard />
                    </div>


                    {/* Career Coach (Use Case: For Freshers) */}
                    <div className="h-[380px] md:h-[418px] col-span-12 md:col-span-8 group p-6 rounded-3xl border border-[#1A1A1A] bg-gradient-to-br from-[#121212] to-[#1A1A1A] hover:to-[#191919] transition-colors duration-300 shadow-lg hover:shadow-[#9EFF00]/20 overflow-hidden relative flex flex-col justify-between">
                        {/* Images */}
                        <div className="relative flex justify-center mt-5 md:mt-0 -space-x-24 no-scrollbar z-10">
                            {[0, 1, 2].map((_, i) => (
                                <div key={i} className={`md:h-[26rem] ${i === 1 ? 'h-[17rem]' : 'h-[16rem]'}`}>
                                    <Image
                                        src={`/images/m1.jpg`}
                                        width={280}
                                        height={10}
                                        className={`mt-16 object-cover h-[80%] ${i === 0 ? '-rotate-[12deg]' : i === 2 ? 'rotate-[12deg]' : '-top-7 relative z-10'} rounded-xl`}
                                        alt="Career coach session"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Gradient overlay (fading over image) */}
                        <div className="absolute bottom-0 left-0 right-0 h-40 z-20 pointer-events-none bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E]/80 to-transparent" />

                        {/* Text content above gradient */}
                        <div className="absolute bottom-0 left-0 right-0 z-30 p-6">
                            <h3 className="text-xl font-semibold mb-2 text-[#9EFF00]">AI Career Coach</h3>
                            <p className="text-sm text-[#D4D4D8]">
                                Get personalized career path recommendations based on your skills, experience, and goals.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default WorkFlow;
