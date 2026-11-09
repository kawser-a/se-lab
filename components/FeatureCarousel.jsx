"use client";
import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
    Shield,         // For role-based access
    Activity,       // For live intel (alternative to Pulse)
    FileText,       // For resume wizard (alternative to FileEdit)
    MessageSquare,  // For cover letter
    Mic,            // For interview coach (alternative to Mic2)
    Briefcase       // For jobs
} from 'lucide-react';

export default function FeatureCarousel({
    collapseDelay = 5000,
    ltr = false,
    linePosition = 'left',
    data = [
        {
            id: 1,
            title: 'Smart Role-Based Access',
            subtitle: "One Platform. Two Paths. Endless Possibilities.",
            content: 'Whether you are a job seeker or recruiter, get a personalized experience from the first click.',
            image: '/images/role.jpg',
            icon: Shield, // Security/access control
        },
        {
            id: 2,
            title: 'Live Industry Intel',
            subtitle: 'Know the Market Before It Knows You.',
            content: 'Get AI-curated industry insights—growth, trends, salaries, top skills—auto-updated every 72 hours.',
            image: '/images/intel.jpg',
            icon: Activity, // Live data/insights
        },
        {
            id: 3,
            title: 'Instant Resume Wizard',
            subtitle: 'Your Dream Resume, Built by AI.',
            content: 'Craft a standout, ATS-friendly resume in seconds with zero design or writing hassle.',
            image: '/images/resume.jpg',
            icon: FileText, // Document editing
        },
        {
            id: 4,
            title: 'Cover Letter Genie',
            subtitle: 'Let AI Do the Talking.',
            content: 'Generate professional, job-specific cover letters that leave a lasting impression.',
            image: '/images/letter.jpg',
            icon: MessageSquare, // Written communication
        },
        {
            id: 5,
            title: 'AI Mock Interview Coach',
            subtitle: 'Practice Like It’s the Real Deal.',
            content: 'Face MCQs and voice-based AI interviews, then get smart feedback to improve instantly.',
            image: '/images/interview.jpg',
            icon: Mic, // Voice/recording
        },
        {
            id: 6,
            title: 'Fresh Jobs, Real Recruiters',
            subtitle: 'Skip the Hunt. Start Applying.',
            content: 'Access fresh, verified job postings from recruiters who are actively hiring new talent.',
            image: '/images/job.jpg',
            icon: Briefcase // Job opportunities
        }
    ],
}) {
    const [currentIndex, setCurrentIndex] = useState(-1);
    const carouselRef = useRef(null);

    // Initial activation
    useEffect(() => {
        const timer = setTimeout(() => setCurrentIndex(0), 100);
        return () => clearTimeout(timer);
    }, []);

    // Auto scroll
    useEffect(() => {
        if (data.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % data.length);
        }, collapseDelay);
        return () => clearInterval(interval);
    }, [data, collapseDelay]);

    // Scroll to selected card
    useEffect(() => {
        if (!carouselRef.current || currentIndex < 0) return;
        const cards = carouselRef.current.querySelectorAll('.card_code');
        const card = cards[currentIndex];
        const container = carouselRef.current;
        if (card && container) {
            const offset =
                card.offsetLeft -
                container.offsetLeft -
                (container.clientWidth - card.clientWidth) / 2;
            container.scrollTo({
                left: offset,
                behavior: 'smooth',
            });
        }
    }, [currentIndex]);

    return (
        <main className='mt-36'>
            <section id="features" className='page-container  px-6'>
                    <h3 className='text-center text-[#D4D4D8] text-sm md:text-base font-medium tracking-wide'>
                        Get Started <span className='underline decoration-wavy decoration-[#9EFF00] underline-offset-6'>
                            Effortlessly
                        </span>
                    </h3>
                    <h2 className='text-center text-[#F4F4F5] text-3xl leading-tight md:text-5xl font-extrabold tracking-tight'>
                        Crack the Code to Your Dream Job — Powered by AI, <span className="relative inline-block">
                            <span className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1" />
                            <strong className="text-black"> Built for You!</strong>
                        </span>
                    </h2>
                    <div className="my-16 flex flex-col lg:flex-row justify-between items-stretch gap-y-16">

                        {/* Right Media */}
                        <div className='w-full lg:max-w-[60%] mr-52'>
                            <div className={clsx('h-[550px] flex-1 min-w-[500px]', ltr && 'lg:order-1')}>
                                {data[currentIndex]?.image ? (
                                    <img
                                        src={data[currentIndex].image}
                                        alt="feature"
                                        className="aspect-auto size-full rounded-xl border border-[#C9F300] object-cover p-1 shadow-lg"
                                    />
                                ) : data[currentIndex]?.video ? (
                                    <video
                                        src={data[currentIndex].video}
                                        className="aspect-auto size-full rounded-lg object-cover shadow-lg"
                                        autoPlay
                                        muted
                                        loop
                                    />
                                ) : (
                                    <div className="aspect-auto size-full rounded-xl border border-neutral-300/50 bg-gray-200 p-1" />
                                )}
                            </div>
                        </div>

                        {/* Left Content */}
                        <div className='w-full lg:max-w-[38%] flex flex-col justify-center'>
                                <div
                                    className={clsx(
                                        'order-1 hidden lg:flex h-full flex-1',
                                        ltr ? 'lg:order-2 lg:justify-end' : 'justify-start'
                                    )}
                                >
                                    <div>
                                        {data.map((item, index) => (
                                            <div key={item.id} className="relative mb-8 flex items-center last:mb-0">
                                                {(linePosition === 'left' || linePosition === 'right') && (
                                                    <div
                                                        className={clsx(
                                                            'absolute inset-y-0 w-0.5 overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-[#C9F30033]',
                                                            linePosition === 'right' ? 'right-0' : 'left-0'
                                                        )}
                                                    >
                                                        <div
                                                            className={clsx(
                                                                'absolute top-0 left-0 w-full origin-top bg-primary transition-all ease-linear dark:bg-[#C9F300]',
                                                                currentIndex === index ? 'h-full' : 'h-0'
                                                            )}
                                                            style={{
                                                                transitionDuration:
                                                                    currentIndex === index ? `${collapseDelay}ms` : '0s',
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                {(linePosition === 'top' || linePosition === 'bottom') && (
                                                    <div
                                                        className={clsx(
                                                            'absolute inset-x-0 h-0.5 w-full overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-[#C9F30033]',
                                                            linePosition === 'bottom' ? 'bottom-0' : 'top-0'
                                                        )}
                                                    >
                                                        <div
                                                            className={clsx(
                                                                'absolute left-0 h-full origin-left bg-primary transition-all ease-linear dark:bg-[#C9F300]',
                                                                currentIndex === index ? 'w-full' : 'w-0'
                                                            )}
                                                            style={{
                                                                transitionDuration:
                                                                    currentIndex === index ? `${collapseDelay}ms` : '0s',
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                <div className="item-box mx-2 flex size-12 shrink-0 items-center justify-center rounded-full bg-[#C9F3001A] sm:mx-6">
                                                    {item.icon && React.createElement(item.icon, { className: 'size-6 text-[#C9F300]' })}
                                                </div>

                                                <div className="space-y-2">
                                                    <h3 className="text-lg lg:text-2xl font-bold text-[#F4F4F5]">{item.title}</h3>
                                                    <h4 className="text-base lg:text-1xl font-semibold text-[#9EFF00]">{item.subtitle}</h4>
                                                    {/* <p className="text-[16px] w-96 text-muted-foreground">{item.content}</p> */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                        </div>

                        {/* Mobile Progress Line */}
                        <div className="relative -mb-8 md:hidden pb-0.5 [-webkit-mask-image:linear-gradient(90deg,transparent,black_20%,white_80%,transparent)] [mask-image:linear-gradient(90deg,transparent,black_20%,white_80%,transparent)]">
                            {data.map((_, index) => (
                                <div
                                    key={index}
                                    className="absolute inset-x-0 top-0 h-0.5 w-full overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-neutral-300/30"
                                >
                                    <div
                                        className={clsx(
                                            'absolute left-0 top-0 h-full origin-left bg-primary transition-all ease-linear dark:bg-white',
                                            currentIndex === index ? 'w-full' : 'w-0'
                                        )}
                                        style={{
                                            transitionDuration:
                                                currentIndex === index ? `${collapseDelay}ms` : '0s',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Mobile Scroll Cards */}
                        <ul
                            ref={carouselRef}
                            className="relative flex h-full snap-x snap-mandatory flex-nowrap overflow-x-auto lg:hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-webkit-mask-image:linear-gradient(90deg,transparent,black_20%,white_80%,transparent)] [mask-image:linear-gradient(90deg,transparent,black_20%,white_80%,transparent)]"
                        >
                            {data.map((item, index) => (
                                <li
                                    key={item.id}
                                    className="card_code relative mr-8 grid h-full max-w-full pl-2 shrink-0 items-start justify-center last:mr-0"
                                    onClick={() => setCurrentIndex(index)}
                                    style={{ scrollSnapAlign: 'center' }}
                                >
                                    <h2 className="text-xl font-bold">{item.title}</h2>
                                    <p className="mx-0 max-w-sm text-balance text-sm">{item.content}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
            </section>
        </main>
    );
}
