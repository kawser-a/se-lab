// "use client";
// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { useRouter } from 'next/navigation';

// const VoiceInterviewConfigPage = () => {
//     const router = useRouter();
//     const [config, setConfig] = useState({
//         level: "junior",
//         amount: 5,
//         techStack: "",
//         role: "Frontend",
//         type: "Technical"
//     });

//     const handleStart = () => {
//         const url = `/interview/mock/voice-session?` +
//             new URLSearchParams({
//                 level: config.level,
//                 amount: config.amount,
//                 techStack: config.techStack,
//                 role: config.role,
//                 type: config.type
//             }).toString();
//         router.push(url);
//     }

//     return (
//         <div className="container mx-auto py-6 space-y-4">
//             <h1 className="text-4xl font-bold">Configure Voice Interview</h1>
//             <div className="space-y-2">
//                 <div>
//                     <label>Level</label>
//                     <select value={config.level} onChange={e => setConfig({ ...config, level: e.target.value })}>
//                         <option>junior</option>
//                         <option>mid</option>
//                         <option>senior</option>
//                     </select>
//                 </div>
//                 <div>
//                     <label>Number of Questions</label>
//                     <input type="number" value={config.amount} onChange={e => setConfig({ ...config, amount: e.target.value })} min={1} max={10} />
//                 </div>
//                 <div>
//                     <label>Tech Stack (comma separated)</label>
//                     <input type="text" value={config.techStack} onChange={e => setConfig({ ...config, techStack: e.target.value })} />
//                 </div>
//                 <div>
//                     <label>Role</label>
//                     <input type="text" value={config.role} onChange={e => setConfig({ ...config, role: e.target.value })} />
//                 </div>
//                 <div>
//                     <label>Type</label>
//                     <select value={config.type} onChange={e => setConfig({ ...config, type: e.target.value })}>
//                         <option>Technical</option>
//                         <option>Behavioral</option>
//                         <option>Mixed</option>
//                     </select>
//                 </div>
//             </div>
//             <Button onClick={handleStart}>Start Voice Interview</Button>
//         </div>
//     );
// };

// export default VoiceInterviewConfigPage;

"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const VoiceInterviewConfigPage = () => {
    const router = useRouter();
    const [config, setConfig] = useState({
        level: "junior",
        amount: 5,
        techStack: "",
        role: "Frontend",
        type: "Technical"
    });

    const handleStart = () => {
        const url = `/interview/mock/voice-session?` +
            new URLSearchParams({
                level: config.level,
                amount: config.amount,
                techStack: config.techStack,
                role: config.role,
                type: config.type
            }).toString();
        router.push(url);
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 border-2 rounded-2xl">
            <div className="space-y-8">
                {/* Header Section */}
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#F4F4F5]">
                        Configure Your <span className="text-[#9EFF00]">AI Interview</span>
                    </h1>
                    <p className="mt-3 text-lg text-[#A1A1AA] max-w-2xl mx-auto">
                        Customize your mock interview session to match your target role and skill level
                    </p>
                </div>

                {/* Configuration Form */}
                <div className="space-y-6 bg-[#1A1A1A]/50 border border-[#2A2A2A] rounded-2xl p-6 sm:p-8 shadow-lg">
                    {/* Level Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#D4D4D8]">Experience Level</label>
                        <div className="grid grid-cols-3 gap-2">
                            {["junior", "mid", "senior"].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setConfig({ ...config, level })}
                                    className={`py-2 px-4 rounded-lg border transition-all ${config.level === level
                                        ? 'border-[#9EFF00] bg-[#9EFF00]/10 text-white'
                                        : 'border-[#2A2A2A] hover:border-[#9EFF00]/30'}`}
                                >
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Number of Questions */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#D4D4D8]">
                            Number of Questions: <span className="text-[#9EFF00]">{config.amount}</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={config.amount}
                            onChange={(e) => setConfig({ ...config, amount: e.target.value })}
                            className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer accent-[#9EFF00]"
                        />
                        <div className="flex justify-between text-xs text-[#7D6161]">
                            {[1, 5, 10].map((num) => (
                                <span key={num}>{num}</span>
                            ))}
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#D4D4D8]">Tech Stack (comma separated)</label>
                        <input
                            type="text"
                            value={config.techStack}
                            onChange={(e) => setConfig({ ...config, techStack: e.target.value })}
                            placeholder="e.g. React, Node.js, TypeScript"
                            className="w-full px-4 py-2 rounded-lg border border-[#2A2A2A] bg-[#1F1F1F] text-white placeholder-[#7D6161] focus:border-[#9EFF00] focus:ring-1 focus:ring-[#9EFF00]/30 transition-all"
                        />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#D4D4D8]">Target Role</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {["Frontend", "Backend", "Fullstack", "DevOps"].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setConfig({ ...config, role })}
                                    className={`py-2 px-4 rounded-lg border transition-all ${config.role === role
                                        ? 'border-[#9EFF00] bg-[#9EFF00]/10 text-white'
                                        : 'border-[#2A2A2A] hover:border-[#9EFF00]/30'}`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interview Type */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#D4D4D8]">Interview Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {["Technical", "Behavioral", "Mixed"].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setConfig({ ...config, type })}
                                    className={`py-2 px-4 rounded-lg border transition-all ${config.type === type
                                        ? 'border-[#9EFF00] bg-[#9EFF00]/10 text-white'
                                        : 'border-[#2A2A2A] hover:border-[#9EFF00]/30'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <div className="flex justify-center">
                    <Button
                        onClick={handleStart}
                        className="px-8 py-6 text-lg font-bold bg-[#9EFF00] hover:bg-[#9EFF00]/90 text-black rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-[#9EFF00]/30"
                    >
                        Start Voice Interview
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VoiceInterviewConfigPage;
