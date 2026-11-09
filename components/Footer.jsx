import { Check, Facebook, Github, Instagram, Linkedin, Slack, Youtube } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Fill in the profiles you want to show. Icons without a link are hidden.
const SOCIAL_LINKS = [
    { label: "GitHub", href: "https://github.com/kawser-a/se-lab", Icon: Github },
    { label: "LinkedIn", href: "", Icon: Linkedin },
    { label: "Facebook", href: "", Icon: Facebook },
    { label: "Instagram", href: "", Icon: Instagram },
    { label: "YouTube", href: "", Icon: Youtube },
    { label: "Slack", href: "", Icon: Slack },
];

const LINK_COLUMNS = [
    {
        title: "Product",
        links: [
            ["CV Builder", "/resume"],
            ["Cover Letter", "/ai-cover-letter"],
            ["Mock Interview", "/interview"],
            ["Industry Insights", "/dashboard"],
        ],
    },
    {
        title: "Learn",
        links: [
            ["Blog", "/blog"],
            ["How It Works", "/#how-it-works"],
            ["FAQ", "/#faq"],
        ],
    },
    {
        title: "Company",
        links: [
            ["Team", "/#team"],
            ["Source Code", "https://github.com/kawser-a/se-lab"],
        ],
    },
];

export default function Footer() {
    return (
        <main className="">
            <div className="h-[1px] w-full bg-gradient-to-r from-[#C9F300]/0 via-[#C9F300]/30 to-[#C9F300]/0 blur-sm" />
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-between gap-4 sm:gap-8 border-b border-t px-6 lg:px-24 2xl:px-80 py-6">
                    <div className="flex items-center gap-4  tracking-wide cursor-pointer">
                        <h2 className="text-center text-[#D4D4D8] text-sm font-semibold tracking-wide ">
                            We protect your data.
                        </h2>
                        <h2 className="text-center text-[#D4D4D8] text-sm font-semibold tracking-wide ">
                        <span className="text-[#9EFF00]">
                                More on Security
                            </span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 text-center text-[#D4D4D8] text-sm font-medium tracking-wide cursor-pointer">
                        <Check />
                        <h2>
                            SOC2 Type 2 <span className="ml-3 opacity-80 font-light">Certified</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 text-center text-[#D4D4D8] text-sm font-medium tracking-wide cursor-pointer">
                        <Check />
                        <h2>
                            HIPAA <span className="ml-3 opacity-80 font-light">Compliant</span>
                        </h2>
                    </div>
            </div>
            <footer className="page-container relative text-[#A1A1AA] py-10 md:py-16 px-2 sm:px-4">
                <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Left Section: Logo + Socials */}
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2 mb-6 md:mb-16">
                            <div className="w-10 h-10 bg-[#9EFF00] rounded-md flex items-center justify-center">
                                <Image
                                    src={'/cub.svg'}
                                    height={25}
                                    width={25}
                                    alt='logo'
                                    className=''
                                />
                            </div>
                            <span className="text-base font-bold text-[#F4F4F5]">GrowthGrid</span>
                        </div>

                        <div className="flex space-x-4 text-[#D4D4D8] text-lg">
                            {SOCIAL_LINKS.filter((link) => link.href).map(({ label, href, Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="hover:text-[#C9F300] transition"
                                >
                                    <Icon />
                                </a>
                            ))}
                        </div>

                        <p className="text-xs text-[#71717A] font-semibold">
                            © {new Date().getFullYear()} Kawser Ahmed. <br />
                            All rights reserved.
                        </p>
                    </div>

                    {/* Link Columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:col-span-3 gap-8 lg:gap-20">
                        {LINK_COLUMNS.map((column) => (
                            <div key={column.title} className="border-l-2 pl-4 border-[#C9F300]">
                                <h3 className="text-[#9EFF00] text-base font-semibold mb-4">{column.title}</h3>
                                <ul className="space-y-2">
                                    {column.links.map(([label, href]) => (
                                        <li key={label}>
                                            <Link href={href} className="hover:text-[#C9F300] hover:underline">
                                                {label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </footer>
        </main>
    );
}
