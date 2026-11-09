
'use client';
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from 'react';
import PhoneCard from './sub-comp/PhoneCard';
import DashBoardCard from './sub-comp/DashBoardCard';


// The phone and laptop mockups are drawn at a fixed size. On narrower
// screens the whole scene is scaled down so it keeps its proportions
// instead of being cropped.
const SCENE_WIDTH = 1100;
const SCENE_HEIGHT = 540;

function useSceneScale(ref) {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => {
            setScale(Math.min(1, entry.contentRect.width / SCENE_WIDTH));
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return scale;
}

export default function VisualCardOfHeroSec() {
    const ref = useRef(null);
    const frame = useRef(null);
    const sceneScale = useSceneScale(frame);
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
        <div ref={ref} className="w-full mt-10 md:mt-32 pb-10 md:pb-20">
            <div ref={frame} className="relative w-full" style={{ height: SCENE_HEIGHT * sceneScale }}>
            <div
                className="absolute left-1/2 top-0 flex items-center justify-center gap-0 origin-top"
                style={{ width: SCENE_WIDTH, height: SCENE_HEIGHT, transform: `translateX(-50%) scale(${sceneScale})` }}
            >
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
        </div>
    );
}
