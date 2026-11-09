"use client";
import { useRef } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react"; // Optional icon library

const cards = [
    {
        name: "Rizwanul Abedin",
        role: "Backend Engineer",
        tagline: "Building reliable and performant backend infrastructures.",
        image: "/people/rizwan.jpg",
    },
    {
        name: "Ashraf Hossain",
        role: "Content Designer",
        tagline: "Designing content that informs and inspires.",
        image: "/people/ashraf.jpg",
    },
    {
        name: "Kawser Ahmed",
        role: "Lead Software Engineer & PM",
        tagline: "Architecting ideas into scalable software systems.",
        image: "/people/kawser.jpg",
    },
    {
        name: "Ahnaf Tahmid",
        role: "UI/UX Designer",
        tagline: "Crafting intuitive and delightful user experiences.",
        image: "/people/ahnaf.jpg",
    },
    {
        name: "Abtahi Arifeen",
        role: "DBA",
        tagline: "Optimizing data flow for scalable growth.",
        image: "/people/abtahi.jpg",
    },
];

export default function Team() {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        const { current } = scrollRef;
        if (current) {
            current.scrollBy({
                left: direction === "left" ? -300 : 300,
                behavior: "smooth",
            });
        }
    };

    return (
        <section id="team" className="page-container scroll-mt-28 px-6 text-white mt-20 relative">
            <div className="w-full h-auto mx-auto">
                {/* Headings */}
                <h2 className="text-center text-[#F4F4F5] text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                    The Team That Powers <span className="relative inline-block">
                        <span className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1" />
                        <strong className="text-black"> GrowthGrid!</strong>
                    </span>
                </h2>

                <h3 className="text-center text-[#D4D4D8] text-lg font-medium tracking-wide mt-2">
                    Code, caffeine, and chaos.
                    <span className="underline decoration-wavy decoration-[#9EFF00] underline-offset-4 ml-1">
                        Meet the crew
                    </span>{" "}
                    keeping your stack sane.
                </h3>

                <p className="text-center max-w-3xl mx-auto text-[#A1A1AA] font-normal mb-12 pt-3 text-sm md:text-base">
                    GrowthGrid started as our software engineering lab project. Each of us owned a piece of it, from
                    the backend and database to the design and the content.
                </p>

                {/* Team Carousel */}
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4"
                    style={{ height: "520px" }}
                >
                    {cards.map((card, index) => (
                        <div
                            key={index}
                            className="relative min-w-[250px] sm:min-w-[280px] md:min-w-[300px] h-[480px] rounded-2xl overflow-hidden bg-[#1A1A1A] shadow-[0_4px_14px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(0,255,0,0.1)] group transition-all duration-500"
                        >
                            {/* Name bar */}
                            <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-2 bg-gradient-to-b from-black/70 to-transparent text-[#F4F4F5] text-xl font-bold tracking-tight">
                                {card.name}
                            </div>

                            {/* Hover text */}
                            <div className="absolute top-10 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                                <p className="text-[#9EFF00] text-base font-semibold tracking-wide text-left">
                                    {card.role}
                                </p>
                                <p className="text-[#D4D4D8] text-sm font-light tracking-wide text-left mt-1">
                                    {card.tagline}
                                </p>
                            </div>

                            {/* Image */}
                            <div className="h-full overflow-hidden transition-transform duration-500 ease-in-out transform origin-bottom group-hover:scale-y-76">
                                <Image
                                    src={card.image}
                                    alt={card.name}
                                    width={550}
                                    height={650}
                                    className="object-cover w-full h-full rounded-xl"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={() => scroll("left")}
                        className="p-2 bg-[#C9F300] rounded-full hover:bg-[#B5E100] active:scale-95 transition focus:ring-2 focus:ring-black"
                    >
                        <ArrowLeft className="w-5 h-5 text-black" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="p-2 bg-[#C9F300] rounded-full hover:bg-[#B5E100] active:scale-95 transition focus:ring-2 focus:ring-black"
                    >
                        <ArrowRight className="w-5 h-5 text-black" />
                    </button>
                </div>
            </div>
        </section>

    );
}
