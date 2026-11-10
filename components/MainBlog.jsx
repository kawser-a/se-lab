"use client"
import blogData from "@/data/blog";
import Link from "next/link";
import React, { useState } from "react";

const MainBlog = () => {
    const [activeCategory, setActiveCategory] = useState(blogData[0].category);

    const currentCategoryData = blogData.find(
        (item) => item.category === activeCategory
    );

    return (
        <section className="page-container px-2 sm:px-4 mt-20 md:mt-36">
            <div className="p-2 sm:p-8 text-[#F4F4F5] bg-[#121212]">
                {/* Heading */}
                <div className="uppercase text-xs text-[#9EFF00] font-semibold tracking-wider">
                    Stories. Struggles. Solutions.
                </div>
                <h2 className="block mt-4 text-[#F4F4F5] text-3xl leading-tight md:text-5xl font-extrabold tracking-tight">
                    Still Figuring{" "}
                    <span className="relative inline-block">
                        <span className="absolute inset-0 rotate-2 bg-[#9EFF00] z-0 px-1" />
                        <strong className="relative text-black">It Out?</strong>
                    </span>{" "}
                    So Were We.
                </h2>

                {/* Category Tabs */}
                <div className="flex gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none] border-b border-[#2E2E2E] mb-8 mt-8 md:mt-12">
                    {blogData.map((item) => (
                        <button
                            key={item.category}
                            onClick={() => setActiveCategory(item.category)}
                            className={`pb-3 font-medium transition ${activeCategory === item.category
                                    ? "border-b-2 border-[#C9F300] text-[#C9F300]"
                                    : "text-[#A1A1AA] hover:text-[#C9F300] cursor-pointer"
                                }`}
                        >
                            {item.category}
                        </button>
                    ))}
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Main Image */}
                    <div className="hidden lg:block rounded-lg overflow-hidden shadow-lg max-h-[550px]">
                        <img
                            src={currentCategoryData.articles[0].img}
                            alt={currentCategoryData.articles[0].title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Info Cards */}
                    <div className="flex flex-col space-y-6">
                        {currentCategoryData.articles.map((item, i) => (
                            <Link key={item.slug} href={`/blog/${item.slug}`}>
                                <div
                                    className="flex flex-col sm:flex-row gap-3 sm:gap-8 group transition hover:scale-[1.01]"
                                >
                                    <img
                                        src={item.img}
                                        alt={item.title}
                                        className="w-full sm:w-[210px] sm:min-w-[210px] h-44 object-cover rounded-md"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-lg text-[#F4F4F5] mb-2 sm:pt-4 group-hover:text-[#9EFF00] transition">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-[#A1A1AA] leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MainBlog;
