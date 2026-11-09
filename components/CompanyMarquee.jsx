
import React from "react";

const companies = [
    { id: "hashicorp", src: "/companies/hashicorp.svg" },
    { id: "github", src: "/companies/github.svg" },
    { id: "apple", src: "/companies/apple.svg" },
    { id: "flatfile", src: "/companies/flatfile.svg" },
    { id: "spotify", src: "/companies/spotify.svg" },
    { id: "prismic", src: "/companies/prismic.svg" },
    { id: "sender", src: "/companies/sender.svg" },
    { id: "mural", src: "/companies/mural.svg" },
    { id: "notion", src: "/companies/notion.svg" },
    { id: "linear", src: "/companies/linear.svg" },
    { id: "instacart", src: "/companies/instacart.svg" },
    { id: "insided", src: "/companies/insided.svg" },
    { id: "hubspot", src: "/companies/hubspot.svg" },
    { id: "framer", src: "/companies/framer.svg" },
    { id: "adobe", src: "/companies/adobe.svg" },
    { id: "chase", src: "/companies/chase.svg" },
    { id: "xfinity", src: "/companies/xfinity.svg" },
    { id: "walmart", src: "/companies/walmart.svg" },
    { id: "moutai", src: "/companies/moutai.svg" },
    { id: "vodaphone", src: "/companies/vodafone.svg" },
    { id: "amazon", src: "/companies/amazon.svg" },
    { id: "chinalife", src: "/companies/china-life.svg" },
    { id: "tesla", src: "/companies/tesla.svg" },
    { id: "ntt", src: "/companies/ntt.svg" },
    { id: "microsoft", src: "/companies/microsoft.svg" },
    { id: "mastercard", src: "/companies/mastercard.svg" },
    { id: "google", src: "/companies/google.svg" },
    { id: "netflix", src: "/companies/netflix.svg" },
];

const CompanyMarquee = () => {
    return (
        <div>
            <p className="text-center font-extrabold text-[#F4F4F5] text-2xl mb-4 drop-shadow-sm">
                These companies use <span className="relative inline-block">
                    <span className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1" />
                    <strong className="text-black"> GrowthGrid</strong>
                </span>. Not bad!
            </p>
            <div className="marquee-bg py-6 overflow-hidden">
                <div className="marquee-wrapper">
                    <div className="marquee-content">
                        {[...companies, ...companies].map((company, index) => (
                            <div key={`${company.id}-${index}`} className="marquee-item">
                                <div className="h-10 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all cursor-pointer flex items-center px-4">
                                    <img
                                        src={company.src}
                                        alt={company.id}
                                        className="h-9 w-auto max-w-none"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyMarquee;
