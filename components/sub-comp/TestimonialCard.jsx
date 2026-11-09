import React from "react";

export default function TestimonialCard({ t }) {
    return (
        <div className="flex text-white rounded-xl overflow-hidden border
        relative group min-w-xl w-full h-56 bg-gradient-to-br from-[#1A1A1A] via-[#121212] to-[#0F0F0F]
        transition-all duration-300 border-transparent hover:border-[#C9F300]/50">
            <div className="absolute inset-0 rounded-xl pointer-events-none group-hover:animate-border-glow" />
            <div className="flex h-full shadow-[0_4px_24px_rgba(201,243,0,0.15)]">
                <div className="w-1/3">
                    <img src={t.avatar} alt={t.name} className="h-full w-full object-cover rounded-l-xl" />
                </div>
                <div className="w-2/3 p-5 flex flex-col justify-between bg-black/30 backdrop-blur-sm">
                    <div>
                        <h3 className="text-lg font-bold text-[#C9F300] leading-snug">{t.name}</h3>
                        <p className="text-sm text-[#A1A1AA] mb-2">{t.role}</p>
                        <p className="text-sm text-[#D4D4D8] leading-relaxed mb-3">“{t.review}”</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {t.features.map((f) => (
                                <span
                                    key={f}
                                    className="bg-[#232323] text-[#9EFF00] text-xs px-2 py-1 rounded-full border border-[#C9F300]/20"
                                >
                                    {f}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-[#9EFF00]">{t.outcome}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
