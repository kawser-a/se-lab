"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";

const users = [
    {
        name: "Lily",
        offers: 8,
        avatar: "/people/sadat.jpg",
        initials: "L",
    },
    {
        name: "Anna",
        offers: 7,
        avatar: "/people/sadat.jpg",
        initials: "A",
    },
    {
        name: "Jessie",
        offers: 5,
        avatar: "/people/sadat.jpg",
        initials: "J",
    },
    {
        name: "Stephanie",
        offers: 3,
        avatar: "/people/sadat.jpg",
        initials: "S",
    },
];

export function LeaderboardCard() {
    const [isHovered, setIsHovered] = useState(false);

    // Define the positions for each item
    // When hovered, we'll shuffle these positions
    const positions = [0, 1, 2, 3];
    const hoveredPositions = [3, 0, 1, 2]; // First goes to bottom, middle goes to top, etc.

    return (
        <section className="col-span-12 md:col-span-4 group p-6 rounded-3xl border border-[#1A1A1A] bg-gradient-to-br from-[#121212] to-[#1A1A1A] hover:to-[#191919] transition-colors duration-300 shadow-lg hover:shadow-[#9EFF00]/20">
            <div
                className="rounded-3xl p-2.5 col-span-12 md:col-span-4 cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <h2 className="text-lg font-semibold text-[#9EFF00] mb-3">Job Tracker Leaderboard</h2>

                <div className="relative h-64 mb-4">
                    {users.map((user, index) => {
                        const position = isHovered ? hoveredPositions[index] : positions[index];
                        const yPosition = position * 60;

                        return (
                            <motion.div
                                key={user.name}
                                className="absolute w-full border border-[#2A2A2A] bg-[#181818] rounded-full"
                                initial={{ y: index * 60 }}
                                animate={{
                                    y: yPosition,
                                    zIndex: isHovered
                                        ? position === 0
                                            ? 4
                                            : 4 - position
                                        : 4 - index,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                    duration: 0.6,
                                }}
                            >
                                <div className="flex items-center justify-between p-1 px-3 border rounded-full border-[#262626] bg-[#1E1E1E]">
                                    <div>
                                        <h3 className="text-sm font-medium text-[#F4F4F5]">{user.name}</h3>
                                        <motion.p
                                            className="text-[11px] text-[#A1A1AA]"
                                            animate={{
                                                opacity: isHovered && position === 0 ? [1, 0, 1] : 1,
                                                scale: isHovered && position === 0 ? [1, 1.2, 1] : 1,
                                            }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {isHovered && position === 0
                                                ? user.sessions + 2
                                                : user.sessions}{" "}
                                            Offers
                                        </motion.p>
                                    </div>
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <Image
                                            src="/people/sadat.jpg"
                                            alt={user.name}
                                            width={40}
                                            height={40}
                                            className="object-cover size-8 rounded-full"
                                        />
                                    </motion.div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <button className="mt-auto w-full py-2 bg-[#9EFF00] text-black rounded-lg text-sm font-semibold hover:bg-[#B3FF44] transition">
                    View All
                </button>
            </div>
        </section>

    );
}
