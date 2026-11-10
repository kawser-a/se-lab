'use client';
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from 'react';
import PhoneCard from './sub-comp/PhoneCard';
import DashBoardCard from './sub-comp/DashBoardCard';

// The phone and laptop mockups are drawn at a fixed size, so they're scaled
// to fit rather than reflowed.
const PHONE = { width: 288, height: 500 };
const DASHBOARD = { width: 780, height: 500 };

// Side by side on tablets and up.
const SCENE_WIDTH = 1100;
const SCENE_HEIGHT = 540;

// Below this the side-by-side scene gets too small to read, so the phone
// overlaps the corner of the dashboard instead.
const COMPACT_BELOW = 640;

function useFrameWidth(ref) {
    const [width, setWidth] = useState(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return width;
}

function CompactScene({ width }) {
    const dashboardScale = width / DASHBOARD.width;
    const phoneScale = Math.min(0.55, (width * 0.42) / PHONE.width);
    const phoneTop = DASHBOARD.height * dashboardScale * 0.55;

    return (
        <div className="relative" style={{ height: phoneTop + PHONE.height * phoneScale }}>
            <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${dashboardScale})` }}>
                <DashBoardCard />
            </div>
            <div
                className="absolute right-0 origin-top-right drop-shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
                style={{ top: phoneTop, transform: `scale(${phoneScale})` }}
            >
                <PhoneCard />
            </div>
        </div>
    );
}

export default function VisualCardOfHeroSec() {
    const ref = useRef(null);
    const frame = useRef(null);
    const frameWidth = useFrameWidth(frame);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // The two devices drift apart as the hero scrolls past.
    const phoneX = useTransform(scrollYProgress, [0, 1], [180, -130]);
    const dashboardX = useTransform(scrollYProgress, [0, 1], [-20, 200]);
    const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

    const compact = frameWidth !== null && frameWidth < COMPACT_BELOW;
    const sceneScale = frameWidth === null ? 1 : Math.min(1, frameWidth / SCENE_WIDTH);

    return (
        <div ref={ref} className="w-full mt-10 md:mt-32 pb-10 md:pb-20">
            <div ref={frame} className="relative w-full">
                {compact ? (
                    <CompactScene width={frameWidth} />
                ) : (
                    <div className="relative" style={{ height: SCENE_HEIGHT * sceneScale }}>
                        <div
                            className="absolute left-1/2 top-0 flex items-center justify-center origin-top"
                            style={{ width: SCENE_WIDTH, height: SCENE_HEIGHT, transform: `translateX(-50%) scale(${sceneScale})` }}
                        >
                            <motion.div style={{ x: phoneX, scale }} className="relative z-10">
                                <PhoneCard />
                            </motion.div>
                            <motion.div style={{ x: dashboardX, scale }} className="relative z-0">
                                <DashBoardCard />
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
