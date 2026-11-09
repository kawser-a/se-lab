
'use client';
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from 'react';
import PhoneCard from './sub-comp/PhoneCard';
import DashBoardCard from './sub-comp/DashBoardCard';


export default function VisualCardOfHeroSec() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Smooth interpolation for the movement
    const phoneX = useTransform(scrollYProgress, [0, 1], [180, -130]);
    const dashboardX = useTransform(scrollYProgress, [0, 1], [-20, 200]);

    // Smooth scaling
    const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

    return (
        <div
            ref={ref}
            className="w-full flex items-center justify-center mt-10 md:mt-32 px-4 min-h-[70vh] pb-20"
        >
            <div className="flex items-center justify-center gap-0 relative">
                {/* <motion.div
                    className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 w-[90%] h-24
    rounded-full blur-[80px] opacity-60 pointer-events-none z-0"
                    style={{
                        background: 'radial-gradient(ellipse at center, #C9F300 0%, #9EFF00 40%, transparent 80%)',
                    }}
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                /> */}


                <motion.div
                    style={{
                        x: phoneX,
                        scale,
                        transition: { type: 'spring', stiffness: 60, damping: 20 }
                    }}
                    className="relative z-10"
                >
                    <PhoneCard />
                </motion.div>

                <motion.div
                    style={{
                        x: dashboardX,
                        scale,
                        transition: { type: 'spring', stiffness: 60, damping: 20 }
                    }}
                    className="relative z-0"
                >
                    <DashBoardCard />
                </motion.div>
            </div>
        </div>
    );
}
