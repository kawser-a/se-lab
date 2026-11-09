"use client"
import Link from "next/link";
import { motion } from "motion/react";
import TypewriterText from './TypewriterText';
import VisualCardOfHeroSec from './VisualCardOfHeroSec';

const HeroSection = () => {

    return (
        <main className='pt-4'>
            <section className="page-container relative  overflow-hidden ">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#9EFF00] mix-blend-screen blur-[100px] animate-float"></div>
                    <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-[#C9F300] mix-blend-screen blur-[120px] animate-float-delay"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32 lg:px-8 lg:py-20">
                    <div className="text-center">
                        <TypewriterText />
                        <div className="grid place-content-center px-4  ">
                            <h1 className="max-w-2xl text-center text-3xl leading-tight md:text-5xl font-extrabold tracking-tight">
                                Get hired smarter with <br />
                                <span className="relative inline-block text-[#C9F300]">
                                    AI-powered
                                    <svg
                                        viewBox="0 0 286 73"
                                        fill="none"
                                        className="absolute -left-2 -right-2 -top-2 bottom-0 translate-y-1"
                                    >
                                        <motion.path
                                            initial={{ pathLength: 0 }}
                                            whileInView={{ pathLength: 1 }}
                                            transition={{
                                                duration: 1.25,
                                                ease: "easeInOut",
                                            }}
                                            d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
                                            stroke="#fff"
                                            strokeWidth="4"
                                        />
                                    </svg>
                                </span>{" "}
                                job tools that work
                            </h1>
                        </div>

                        <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-gray-300 leading-relaxed">
                            GrowthGrid helps you craft standout resumes, generate cover letters, prep for interviews, and track your job hunt — all in one intuitive dashboard.
                        </p>


                        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/dashboard" className="px-8 py-3.5 text-base font-semibold rounded-lg text-black bg-[#C9F300] hover:bg-[#9EFF00] hover:shadow-[0_0_30px_#9EFF00] transition-all duration-300 shadow-[0_0_20px_-5px_#C9F300]">
                                Get Started Free
                            </Link>
                            <Link href="#how-it-works" className="px-8 py-3.5 text-base font-semibold rounded-lg text-white border-2 border-[#9EFF00] hover:bg-[#9EFF00]/10 hover:shadow-[0_0_20px_-5px_#9EFF00/30] transition-all duration-300">
                                How It Works →
                            </Link>
                        </div>


                        <div className="mt-12 flex items-center justify-center gap-x-6">
                            <div className="flex -space-x-2">
                                {["f20", "f21", "f22", "f24"].map((item) => (
                                    <img
                                        key={item}
                                        className="w-10 h-10 rounded-full border-2 border-[#9EFF00]"
                                        src={`/review/${item}.jpg`}
                                        alt="User"
                                    />
                                ))}
                            </div>
                            <div className="text-left">
                                <p className="text-sm text-gray-400">Trusted by professionals at</p>
                                <div className="flex gap-2 mt-1">
                                    {['Google', 'Microsoft', 'Tesla'].map((company) => (
                                        <span key={company} className="text-white font-medium">{company}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <VisualCardOfHeroSec/>
                </div>
            </section>




        </main>
    )
}

export default HeroSection
