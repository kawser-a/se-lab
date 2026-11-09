'use client'
import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView } from "motion/react";

const AnimatedCounter = ({ target, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const controls = useAnimation();
    const ref = useRef(null);
    const inView = useInView(ref, { amount: 0.5 });

    useEffect(() => {
        if (inView) {
            const duration = 2; // seconds
            const startTime = performance.now();

            const updateCount = (currentTime) => {
                const elapsedTime = (currentTime - startTime) / 1000;
                const progress = Math.min(elapsedTime / duration, 1);
                const currentCount = Math.floor(progress * target);

                setCount(currentCount);

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    setCount(target);
                }
            };

            requestAnimationFrame(updateCount);

            controls.start({
                scale: [1, 1.05, 1],
                transition: { duration: 0.3, delay: duration }
            });
        } else {
            setCount(0);
        }
    }, [inView, target, controls]);

    return (
        // <motion.div
        //     ref={ref}
        //     initial={{ opacity: 0, y: 20 }}
        //     animate={inView ? { opacity: 1, y: 0 } : {}}
        //     transition={{ duration: 0.5 }}
        // >
        //     <motion.h2
        //         className='text-5xl font-bold text-center'
        //         animate={controls}
        //     >
        //         {count}
        //         {suffix && (
        //             <motion.span
        //                 className='font-extrabold text-xl text-[#9EFF00]'
        //                 initial={{ opacity: 0, scale: 0.5 }}
        //                 animate={inView ? {
        //                     opacity: 1,
        //                     scale: 1,
        //                     transition: { delay: 1.8, type: 'spring', stiffness: 500 }
        //                 } : {}}
        //             >
        //                 {suffix}
        //             </motion.span>
        //         )}
        //     </motion.h2>
        // </motion.div>
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className='text-4xl md:text-5xl font-bold text-center flex justify-center items-start'
                animate={controls}
            >
                {count}
                {suffix && (
                    <motion.span
                        className='font-extrabold text-xl text-[#9EFF00] self-start'
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={inView ? {
                            opacity: 1,
                            scale: 1,
                            transition: { delay: 1.8, type: 'spring', stiffness: 500 }
                        } : {}}
                    >
                        {suffix}
                    </motion.span>
                )}
            </motion.div>
        </motion.div>
    );
};

const StatsBox = ({ children }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { amount: 0.2 });

    return (
        <motion.div
            ref={ref}
            className='py-6 px-4 lg:px-16 border border-[#2A2A2A] hover:border-[#9EFF00]/30 transition-all duration-300 rounded-2xl'
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
        >
            {children}
        </motion.div>
    );
};

const Stats = () => {
    const ref = useRef(null);
    const inView = useInView(ref, { amount: 0.1 });

    return (
        <motion.section
            ref={ref}
            className='mt-20 md:mt-36 relative overflow-hidden'
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[#9EFF00] opacity-10 blur-3xl -z-10"></div>
            <div className="absolute -down-10 -right-20 w-80 h-80 rounded-full bg-[#9EFF00] opacity-10 blur-3xl -z-10"></div>

            <div className='page-container px-2 sm:px-6 mb-12 md:mb-24'>
                <motion.h2
                    className='text-center text-[#F4F4F5] text-3xl leading-tight md:text-5xl font-extrabold tracking-tight mt-8'
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.1, duration: 0.5 }}
                >
                    You're Not Alone - <span className="relative inline-block">
                        <motion.span
                            className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1"
                            initial={{ scaleX: 0 }}
                            animate={inView ? { scaleX: 1 } : {}}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        />
                        <strong className="text-black"> Join the Movement!</strong>
                    </span>
                </motion.h2>
                <motion.h3
                    className='text-center text-[#D4D4D8] text-sm md:text-base font-medium tracking-wide my-4'
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    Thousands of freshers are already boosting their job game with our{' '}
                    <motion.span
                        className='underline decoration-wavy decoration-[#9EFF00] underline-offset-6'
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        AI-powered toolkit.
                    </motion.span>
                    Here's what we've accomplished together.
                </motion.h3>
            </div>

            <motion.div
                className='page-container px-2 sm:px-6 grid grid-cols-2 gap-4 lg:flex lg:items-center lg:justify-between'
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.6 }}
            >
                <StatsBox>
                    <AnimatedCounter target={500} suffix="+" />
                    <motion.p
                        className='mt-8 text-base font-semibold text-center text-[#9EFF00]'
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 1.8 }}
                    >
                        Users Onboarded
                    </motion.p>
                </StatsBox>

                <StatsBox>
                    <AnimatedCounter target={150} suffix="+" />
                    <motion.p
                        className='mt-8 text-base font-semibold text-center text-[#9EFF00]'
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 1.9 }}
                    >
                        Resumes Crafted
                    </motion.p>
                </StatsBox>

                <StatsBox>
                    <AnimatedCounter target={300} suffix="+" />
                    <motion.p
                        className='mt-8 text-base font-semibold text-center text-[#9EFF00]'
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 2.0 }}
                    >
                        Interviews Simulated
                    </motion.p>
                </StatsBox>

                <StatsBox>
                    <AnimatedCounter target={90} suffix="+" />
                    <motion.p
                        className='mt-8 text-base font-semibold text-center text-[#9EFF00]'
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 2.1 }}
                    >
                        Cover Letters Written
                    </motion.p>
                </StatsBox>
            </motion.div>

            <motion.div
                className="absolute top-1/4 left-10 w-4 h-4 bg-[#9EFF00] rounded-full opacity-30 -z-10"
                animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute bottom-1/3 right-20 w-3 h-3 bg-[#9EFF00] rounded-full opacity-30 -z-10"
                animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
            />
        </motion.section>
    );
};

export default Stats;
