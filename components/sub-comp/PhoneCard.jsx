'use client';
import { motion, useAnimationFrame } from "motion/react";
import { useEffect, useRef, useState } from 'react';
import { Signal, Wifi, ArrowRight, Clock, DollarSign, MapPin } from 'lucide-react';

const PhoneCard = () => {
    const contentRef = useRef(null);
    const containerRef = useRef(null);
    const [offsetY, setOffsetY] = useState(0);
    const [hoverCount, setHoverCount] = useState(0);

    const jobListings = [
        {
            id: 1,
            image: "/images/data.jpg",
            category: "Tech",
            title: "Senior UX Designer",
            company: "Meta Inc.",
            location: "San Francisco, CA",
            type: "Full-time",
            salary: "120k - 150k",
            deadline: "May 30, 2023",
            description: "Lead UX projects for our core products and mentor junior designers."
        },
        {
            id: 2,
            image: "/images/finance.jpg",
            category: "Finance",
            title: "Financial Analyst",
            company: "Goldman Sachs",
            location: "New York, NY",
            type: "Hybrid",
            salary: "90k - 110k",
            deadline: "Jun 15, 2023",
            description: "Analyze financial data and prepare reports for executive team."
        },
        {
            id: 3,
            image: "/images/marketing.jpg",
            category: "Marketing",
            title: "Digital Marketing Manager",
            company: "Nike",
            location: "Portland, OR",
            type: "Remote",
            salary: "85k - 100k",
            deadline: "May 25, 2023",
            description: "Develop and execute digital marketing campaigns across platforms."
        },
        {
            id: 4,
            image: "/images/engineer.jpg",
            category: "Engineering",
            title: "DevOps Engineer",
            company: "Netflix",
            location: "Los Gatos, CA",
            type: "Full-time",
            salary: "130k - 160k",
            deadline: "Jun 5, 2023",
            description: "Build and maintain our cloud infrastructure and CI/CD pipelines."
        },
        {
            id: 5,
            image: "/images/healthcare.jpg",
            category: "Healthcare",
            title: "Clinical Researcher",
            company: "Pfizer",
            location: "Boston, MA",
            type: "On-site",
            salary: "95k - 115k",
            deadline: "Jun 20, 2023",
            description: "Conduct clinical trials and analyze medical data for new treatments."
        }
    ];

    const doubledJobs = [...jobListings, ...jobListings];

    useAnimationFrame((t, delta) => {
        if (hoverCount > 0) return;
        setOffsetY(prev => {
            const container = containerRef.current;
            const content = contentRef.current;
            if (!container || !content) return prev;

            const contentHeight = content.scrollHeight / 2;
            const next = prev - delta * 0.05;
            return Math.abs(next) >= contentHeight ? 0 : next;
        });
    });

    const handleHoverStart = () => {
        setHoverCount(prev => prev + 1);
    };

    const handleHoverEnd = () => {
        setHoverCount(prev => Math.max(prev - 1, 0));
    };

    return (
        <div className="w-72 h-[500px] bg-[#121212] rounded-[2.5rem] border-[10px] border-gray-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-6 px-4 flex items-center justify-between text-white text-sm z-40 font-semibold">
                <div className='flex items-center gap-2'>
                    <span>9:41</span>
                    <Signal className='w-[20px] h-[16px] mr-2' />
                </div>
                <div className="flex items-center gap-1 ml-1">
                    <Wifi className='w-[20px] h-[16px]' />
                    <div className="w-5 h-2.5 bg-gray-600 rounded-sm relative overflow-hidden">
                        <div className="w-4 h-full bg-green-500 absolute left-0 top-0" />
                    </div>
                </div>
            </div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#121212] rounded-b-2xl z-30 border-b border-gray-700 shadow-md mx-1" />
            <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] bg-gray-400 rounded-full z-50" />

            <div
                className="h-full pt-24 pb-6 overflow-hidden relative"
                ref={containerRef}
            >
                <motion.div
                    className="space-y-3 px-2 will-change-transform"
                    ref={contentRef}
                    style={{ y: offsetY }}
                >
                    {doubledJobs.map((job, index) => (
                        <div key={`${job.id}-${index}`} className="relative">
                            <motion.div
                                className="bg-gray-800 rounded-xl p-3 border border-gray-700 cursor-pointer"
                                whileHover={{ scale: 1.02 }}
                                onMouseEnter={handleHoverStart}
                                onMouseLeave={handleHoverEnd}
                            >
                                <div className="relative h-[155px] rounded-lg mb-3 overflow-hidden">
                                    <img
                                        src={job.image}
                                        alt={job.title}
                                        className="w-full h-full object-cover rounded-lg"
                                        style={{ imageRendering: 'auto', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
                                    />
                                    <div className="absolute bottom-0 left-0 p-3">
                                        <span className="bg-black/40 text-white px-2 py-1 rounded-md text-xs">
                                            {job.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex gap-2 justify-between items-start">
                                        <div>
                                            <h3 className="text-white font-semibold">{job.title}</h3>
                                            <p className="text-gray-400 text-sm">{job.company}</p>
                                        </div>
                                        <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded">
                                            {job.type}
                                        </span>
                                    </div>

                                    <div className="flex items-center text-gray-400 text-xs space-x-3">
                                        <span className="flex items-center">
                                            <MapPin className="w-3 h-3 mr-1" /> {job.location}
                                        </span>
                                        <span className="flex items-center">
                                            <DollarSign className="w-3 h-3 mr-1 mt-0.5" /> {job.salary}
                                        </span>
                                    </div>

                                    <p className="text-gray-300 text-xs line-clamp-2 my-4">{job.description}</p>

                                    <div className="flex flex-col gap-4 justify-between items-center pt-1">
                                        <span className="flex items-center text-xs text-amber-400">
                                            <Clock className="w-3 h-3 mr-1" /> Apply by {job.deadline}
                                        </span>
                                        <button className="flex justify-center items-center w-full text-xs px-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-full transition duration-200 shadow-md cursor-pointer">
                                            Explore <ArrowRight className="w-3 h-3 ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default PhoneCard;
