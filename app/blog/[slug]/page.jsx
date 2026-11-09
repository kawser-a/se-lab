import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Facebook, Twitter } from "lucide-react";
import blogData from "@/data/blog";
import PrintButton from "./print-button";

const allArticles = blogData.flatMap((cat) => cat.articles.map((a) => ({ ...a, category: cat.category })));

const findArticle = (slug) => allArticles.find((a) => a.slug === slug);

export function generateStaticParams() {
    return allArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
    const article = findArticle((await params).slug);
    return article ? { title: `${article.title} | GrowthGrid`, description: article.description } : {};
}

export default async function BlogDetailPage({ params }) {
    const article = findArticle((await params).slug);
    if (!article) notFound();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const shareUrl = encodeURIComponent(`${siteUrl}/blog/${article.slug}`);
    const shareText = encodeURIComponent(article.title);

    return (
        <section className="page-container px-4 py-12 md:py-20 text-[#F4F4F5] bg-[#121212] max-w-4xl mx-auto">
            {/* Back Button */}
            <Link href="/blog" className="flex items-center text-[#C9F300] hover:text-[#9EFF00] mb-8 transition-colors">
                <ArrowLeft className="mr-2 size-4" />
                <span className="text-sm font-medium">Back to Blog</span>
            </Link>

            {/* Breadcrumb */}
            <div className="text-sm text-[#A1A1AA] mb-8 flex items-center space-x-2">
                <Link href="/" className="hover:underline hover:text-[#C9F300] transition-colors">Home</Link>
                <span>/</span>
                <Link href="/blog" className="hover:underline hover:text-[#C9F300] transition-colors">Blog</Link>
                <span>/</span>
                <span className="text-[#C9F300] font-medium">{article.category}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight mb-6">
                {article.title}
            </h1>

            {/* Meta Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#2E2E2E] pb-6 mb-10 text-sm text-[#A1A1AA] gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#2E2E2E] flex items-center justify-center text-sm font-semibold text-[#C9F300]">
                            {article.author?.charAt(0) || "J"}
                        </div>
                        <span className="text-white font-medium">{article.author || "John Doe"}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 sm:gap-6">
                        <span>{article.date || "June 14, 2025"}</span>
                        <span>•</span>
                        <span>{article.time || "6 min read"}</span>
                        <span>•</span>
                        <span>{article.location || "Remote"}</span>
                    </div>
                </div>

                {/* Share Icons */}
                <div className="flex gap-4 text-[#A1A1AA] text-lg">
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on Facebook"
                        className="p-2 rounded-full hover:bg-[#2E2E2E] hover:text-[#C9F300] transition-colors"
                    >
                        <Facebook className="size-5" />
                    </a>
                    <a
                        href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on X"
                        className="p-2 rounded-full hover:bg-[#2E2E2E] hover:text-[#C9F300] transition-colors"
                    >
                        <Twitter className="size-5" />
                    </a>
                    <PrintButton className="p-2 rounded-full hover:bg-[#2E2E2E] hover:text-[#C9F300] transition-colors" />
                </div>
            </div>

            {/* Intro Section */}
            <div className="mb-12">
                <p className="text-lg md:text-xl text-[#D4D4D8] mb-6 leading-relaxed md:leading-loose">
                    {article.description}
                </p>

                {article.quote && (
                    <div className="p-5 border-l-4 border-[#C9F300] bg-[#1E1E1E] rounded-md mb-6">
                        <p className="text-base text-[#A1A1AA] italic leading-relaxed">&ldquo;{article.quote}&rdquo;</p>
                    </div>
                )}

                <p className="text-lg text-[#D4D4D8] leading-relaxed md:leading-loose">
                    {article.intro}
                </p>
            </div>

            {/* Main Image */}
            {article.img && (
                <div className="rounded-xl overflow-hidden mb-10 border border-[#2E2E2E]">
                    <img
                        src={article.img}
                        alt={article.title}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                    />
                    {article.imgCaption && (
                        <p className="text-xs text-[#A1A1AA] px-3 py-2 text-center">
                            {article.imgCaption}
                        </p>
                    )}
                </div>
            )}

            {/* Content Sections */}
            <div className="prose prose-invert max-w-none">
                {article.sections?.map((section, idx) => (
                    <div key={idx} className="mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            {section.title}
                        </h2>
                        <div className="space-y-4 text-[#D4D4D8] text-base leading-relaxed md:leading-loose">
                            {section.content.map((para, paraIdx) => (
                                <p key={paraIdx}>{para}</p>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Optional Middle Paragraphs */}
                {article.middle?.length > 0 && (
                    <div className="space-y-6 text-[#D4D4D8] text-base leading-relaxed md:leading-loose mb-12">
                        {article.middle.map((para, idx) => (
                            <p key={idx}>{para}</p>
                        ))}
                    </div>
                )}
            </div>

            {/* Media Grid */}
            {article.media && (
                <div className="mb-14">
                    <h3 className="text-xl font-semibold text-white mb-6">Media Gallery</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {article.media.images.map((img, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden border border-[#2E2E2E]">
                                <img
                                    src={img}
                                    alt={`media-${idx}`}
                                    className="w-full h-48 sm:h-64 object-cover"
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Embedded YouTube */}
                    {article.media.youtube && (
                        <div className="aspect-w-16 aspect-h-9 mt-6">
                            <iframe
                                className="w-full h-64 sm:h-96 rounded-lg"
                                src={article.media.youtube}
                                title="YouTube video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Conclusion Block */}
            <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#2E2E2E] mb-14">
                <h3 className="text-2xl font-bold text-white mb-4">Key Takeaways</h3>
                <div className="text-[#D4D4D8] leading-relaxed md:leading-loose space-y-4">
                    <p>{article.conclusion}</p>
                    <ul className="list-disc pl-5 space-y-2">
                        {article.keyPoints?.map((point, idx) => (
                            <li key={idx}>{point}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Author Bio */}
            <div className="flex flex-col sm:flex-row gap-6 p-6 bg-[#1E1E1E] rounded-xl border border-[#2E2E2E]">
                <div className="w-16 h-16 rounded-full bg-[#2E2E2E] flex items-center justify-center text-xl font-bold text-[#C9F300] flex-shrink-0">
                    {article.author?.charAt(0) || "J"}
                </div>
                <div>
                    <h4 className="text-lg font-bold text-white mb-1">
                        About {article.author || "the Author"}
                    </h4>
                    <p className="text-[#A1A1AA] text-sm leading-relaxed">
                        {article.authorBio || "Industry expert with years of experience helping freshers land their dream jobs."}
                    </p>
                </div>
            </div>
        </section>

    );
}
