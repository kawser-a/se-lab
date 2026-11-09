// "use client"
// import React from "react";

// const testimonials = [
//     {
//         id: 1,
//         name: "Fatema Begum",
//         role: "CSE Student, BUET",
//         avatar: "/review/f1.jpg",
//         review: "The mock interviews felt real! Scored an offer at my dream fintech.",
//         features: ["Mock Interview", "Industry Insights"],
//         outcome: "Joined bKash as Intern 🚀",
//     },
//     {
//         id: 2,
//         name: "Nusrat Jahan",
//         role: "Software Engineering Student, SUST",
//         avatar: "/review/f2.jpg",
//         review: "The AI resume builder helped me stand out immediately!",
//         features: ["Resume Builder", "Cover Letter"],
//         outcome: "Now at Shohoz as Junior Developer 💼",
//     },
//     {
//         id: 3,
//         name: "Maliha Rahman",
//         role: "IT Student, NSU",
//         avatar: "/review/f19.jpg",
//         review: "Got shortlisted within days — all thanks to tailored job insights.",
//         features: ["Industry Insights", "Resume Builder"],
//         outcome: "Interning at Pathao 🎯",
//     },
//     {
//         id: 4,
//         name: "Sumaiya Kabir",
//         role: "CIS Student, BRAC University",
//         avatar: "/review/f4.jpg",
//         review: "Mock interview feedback helped me fix my tone and answers.",
//         features: ["Mock Interview", "Cover Letter"],
//         outcome: "Selected for final round at Grameenphone 📱",
//     },
//     {
//         id: 5,
//         name: "Mehzabin Chowdhury",
//         role: "ECE Student, CUET",
//         avatar: "/review/f5.jpg",
//         review: "I didn’t know how to start applying—this platform guided me step-by-step.",
//         features: ["Profile Setup", "Resume Builder"],
//         outcome: "Landed internship at Robi 🚀",
//     },
//     {
//         id: 6,
//         name: "Tanjina Haque",
//         role: "CSE Graduate, AIUB",
//         avatar: "/review/f6.jpg",
//         review: "The industry trends section gave me a real edge in interviews.",
//         features: ["Industry Insights"],
//         outcome: "Joined BJIT as Trainee Developer 💻",
//     },
//     {
//         id: 7,
//         name: "Afra Nawar",
//         role: "CS Student, IUT",
//         avatar: "/review/f7.jpg",
//         review: "Loved the resume and mock combo — I was confident and ready.",
//         features: ["Resume Builder", "Mock Interview"],
//         outcome: "Now working at Datasoft 🎉",
//     },
//     {
//         id: 8,
//         name: "Lamisa Tabassum",
//         role: "Software Eng. Student, UIU",
//         avatar: "/review/f8.jpg",
//         review: "The platform helped me find my strengths and pitch them right.",
//         features: ["Profile Setup", "Cover Letter"],
//         outcome: "Got offer from TechVision Ltd 📨",
//     },
//     {
//         id: 9,
//         name: "Zarin Tasnim",
//         role: "CSE Student, RUET",
//         avatar: "/review/f9.jpg",
//         review: "No more guessing what recruiters want. Insights were 🔥",
//         features: ["Industry Insights"],
//         outcome: "Shortlisted for 2 startups in Dhaka 🏙️",
//     },
//     {
//         id: 10,
//         name: "Sarmin Akter",
//         role: "IT Graduate, EWU",
//         avatar: "/review/f10.jpg",
//         review: "My AI-generated cover letter got noticed immediately.",
//         features: ["Cover Letter", "Resume Builder"],
//         outcome: "Interviewed at Brain Station 23 🧠",
//     },
//     {
//         id: 11,
//         name: "Safa Anjum",
//         role: "CS Student, DIU",
//         avatar: "/review/f11.jpg",
//         review: "Loved the interface and how smart the AI feedback was!",
//         features: ["Mock Interview"],
//         outcome: "Interned at CodersTrust BD 👩‍💻",
//     },
//     {
//         id: 12,
//         name: "Raisa Sharmeen",
//         role: "SE Student, UIU",
//         avatar: "/review/f12.jpg",
//         review: "It gave me clarity on industry skills I needed to learn fast.",
//         features: ["Industry Insights", "Cover Letter"],
//         outcome: "Now preparing for a role at Therap 🎯",
//     },
//     {
//         id: 13,
//         name: "Fariha Islam",
//         role: "CSE Student, AUST",
//         avatar: "/review/f13.jpg",
//         review: "Being able to track trends helped me align my resume better.",
//         features: ["Industry Insights", "Resume Builder"],
//         outcome: "Landed interview at BJIT 💼",
//     },
//     {
//         id: 14,
//         name: "Afsana Haider",
//         role: "IT Student, Green University",
//         avatar: "/review/f14.jpg",
//         review: "Everything I needed as a fresher — in one place.",
//         features: ["Profile Setup", "Mock Interview"],
//         outcome: "Hired by local startup ZayanTech 🚀",
//     },
//     {
//         id: 15,
//         name: "Naima Noor",
//         role: "CS Student, Stamford University",
//         avatar: "/review/f15.jpg",
//         review: "I got my first interview thanks to the AI resume tweaks!",
//         features: ["Resume Builder"],
//         outcome: "Internship at REVE Systems ✅",
//     },
//     {
//         id: 16,
//         name: "Mahruba Tasnim",
//         role: "CSE Student, MIST",
//         avatar: "/review/f16.jpg",
//         review: "Mock interviews with voice felt real and helpful!",
//         features: ["Mock Interview"],
//         outcome: "Offer from a Japanese outsourcing firm 🎌",
//     },
//     {
//         id: 17,
//         name: "Bushra Karim",
//         role: "Computer Science, Independent University",
//         avatar: "/review/f17.jpg",
//         review: "No more applying blindly — the insights saved my time.",
//         features: ["Industry Insights"],
//         outcome: "Shortlisted by 3 companies in 2 weeks ⚡",
//     },
//     {
//         id: 18,
//         name: "Shamima Akhter",
//         role: "Software Eng. Student, BUBT",
//         avatar: "/review/f18.jpg",
//         review: "The resume feedback was better than I got from mentors!",
//         features: ["Resume Builder", "Mock Interview"],
//         outcome: "Now working at Orbit Informatics 🛰️",
//     }
// ];

// function Card({ t }) {
//     return (
//         <div className="flex text-white rounded-xl overflow-hidden border
//         relative group min-w-xl w-full h-56 bg-gradient-to-br from-[#1A1A1A] via-[#121212] to-[#0F0F0F]     transition-all duration-300  border-transparent hover:border-[#C9F300]/50
//         ">
//             <div className="absolute inset-0 rounded-xl pointer-events-none group-hover:animate-border-glow" />
//             {/* avatar */}
//             <div className="flex h-full shadow-[0_4px_24px_rgba(201,243,0,0.15)]">
//                 <div className="w-1/3">
//                         <img
//                             src={t.avatar}
//                             alt={t.name}
//                             className="h-full w-full object-cover rounded-l-xl"
//                         />
//                 </div>

//                 <div className="w-2/3 p-5 flex flex-col justify-between bg-black/30 backdrop-blur-sm">
//                     <div>
//                         <h3 className="text-lg font-bold text-[#C9F300] leading-snug">{t.name}</h3>
//                         <p className="text-sm text-[#A1A1AA] mb-2">{t.role}</p>
//                         <p className="text-sm text-[#D4D4D8] leading-relaxed mb-3">“{t.review}”</p>

//                         <div className="flex flex-wrap gap-2 mb-3">
//                             {t.features.map((f) => (
//                                 <span
//                                     key={f}
//                                     className="bg-[#232323] text-[#9EFF00] text-xs px-2 py-1 rounded-full border border-[#C9F300]/20"
//                                 >
//                                     {f}
//                                 </span>
//                             ))}
//                         </div>

//                         <p className="text-sm font-medium text-[#9EFF00]">{t.outcome}</p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// function MarqueeRow({ reverse = false, speed = 30 }) {
//     /* duplicate the array so the loop looks continuous */
//     const flow = [...testimonials, ...testimonials];

//     return (
//         <div className="relative w-full overflow-hidden">
//             {/* gradient masks  */}
//             <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0f0f0f]/90 to-transparent blur-sm" />
//             <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0f0f0f]/90 to-transparent blur-sm" />

//             {/* scrolling flex container */}
//             <div
//                 className="flex gap-6"
//                 style={{
//                     animation: `${reverse ? "scroll-right" : "scroll-left"} ${speed}s linear infinite`,
//                 }}
//             >
//                 {flow.map((t, idx) => (
//                     <Card key={`${t.id}-${idx}`} t={t} />
//                 ))}
//             </div>
//         </div>
//     );
// }

// export default function Testimonial() {
//     return (
//         <section className="mt-20 mb-44 space-y-14">
//             {/* heading */}
//             <div className="text-center space-y-3">
//                 <h2 className="text-[#F4F4F5] text-3xl md:text-5xl font-extrabold leading-tight">
//                     Freshers Who Made It&nbsp;— You're{" "}
//                     <span className="relative inline-block">
//                         <span className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1" />
//                         <strong className="text-black"> Next!</strong>
//                     </span>
//                 </h2>
//                 <h3 className="text-[#D4D4D8] text-lg font-medium">
//                     They started where you are. Now they're where you
//                     <span className="underline decoration-wavy decoration-[#9EFF00] underline-offset-4 ml-1">
//                         want to be.
//                     </span>
//                 </h3>
//             </div>

//             {/* three marquee rows */}
//             <div className="space-y-8">
//                 <MarqueeRow reverse={false} speed={35} /> {/* Row 1 → */}
//                 <MarqueeRow reverse={true} speed={30} />  {/* Row 2 ← */}
//                 <MarqueeRow reverse={false} speed={40} /> {/* Row 3 → */}
//             </div>

//             {/* Keyframes (scoped) */}
//             <style jsx>{`
//         @keyframes scroll-left {
//           0% {
//             transform: translateX(0);
//           }
//           100% {
//             transform: translateX(-50%);
//           }
//         }
//         @keyframes scroll-right {
//           0% {
//             transform: translateX(0);
//           }
//           100% {
//             transform: translateX(50%);
//           }
//         }
//       `}</style>
//         </section>
//     );
// }

// components/Testimonial/index.jsx
"use client";

import React from "react";
import testimonials from "@/data/testimonials";
import { chunkArray } from "@/data/utils";
import MarqueeTestimonial from "./sub-comp/MarqueeTestimonial";

export default function Testimonial() {
    const chunkedTestimonials = chunkArray(testimonials, 6);

    return (
        <section className="mt-20 mb-44 space-y-14">
            <div className="text-center space-y-3">
                <h2 className="text-[#F4F4F5] text-3xl md:text-5xl font-extrabold leading-tight">
                    Freshers Who Made It&nbsp;— You're{" "}
                    <span className="relative inline-block">
                        <span className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1" />
                        <strong className="text-black"> Next!</strong>
                    </span>
                </h2>
                <h3 className="text-[#D4D4D8] text-lg font-medium">
                    They started where you are. Now they're where you
                    <span className="underline decoration-wavy decoration-[#9EFF00] underline-offset-4 ml-1">
                        want to be.
                    </span>
                </h3>
            </div>

            <div className="space-y-8">
                {chunkedTestimonials.map((row, index) => (
                    <MarqueeTestimonial
                        key={index}
                        testimonials={row}
                        reverse={index % 2 === 1}
                        speed={35 - index * 2}
                    />
                ))}
            </div>
        </section>
    );
}
