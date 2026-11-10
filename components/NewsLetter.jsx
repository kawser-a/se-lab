"use client";
import { useState, useTransition } from "react";

export default function NewsletterSection() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isPending, startTransition] = useTransition();
    const [showModal, setShowModal] = useState(false);
    const [consentChecked, setConsentChecked] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isBusinessEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!isBusinessEmail.test(email)) {
            setError("Please enter a valid business email address.");
            return;
        }

        if (!consentChecked) {
            setError("You must agree to receive updates before subscribing.");
            return;
        }

        setError("");
        startTransition(async () => {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => ({ success: false }));
            if (data.success) {
                setEmail(""); // Clear form
                setShowModal(true); // Show success modal
                setConsentChecked(false);
            } else {
                setError(data.error ?? "Something went wrong. Please try again.");
            }
        });
    };

    return (
        <main className="">
            <section className="page-container px-2 sm:px-0 text-white mt-20 md:mt-36 py-8">
                <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row lg:items-center justify-center gap-4 lg:gap-8">
                    {/* Left - Input Form */}
                    <div className="flex-1 w-full">
                        <h2 className='block mb-3 text-[#F4F4F5] text-3xl leading-tight md:text-5xl font-extrabold tracking-tight'>
                        Sign up for <span className="relative inline-block">
                            <span className="absolute inset-0 rotate-2 bg-[#9EFF00] z-0 px-1" />
                            <strong className="relative text-black"> GrowthGrid </strong></span> news
                        </h2>
                        <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4 my-4">
                            <input
                                type="email"
                                placeholder="Business Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full sm:max-w-2xl h-12 px-4 py-2 rounded-md bg-[#111114] text-white border border-[#2c2c2e] focus:outline-4 outline-[#C9F300]"
                            />
                            <button
                                type="submit"
                                disabled={isPending}
                                className="justify-center shrink-0 px-6 py-2 text-black rounded-md font-medium h-12 text-sm md:text-base tracking-wide leading-normal
                                bg-gradient-to-r from-[#9EFF00] via-[#C9F300] to-[#9EFF00] bg-[length:200%_200%] shadow-[0_0_15px_-3px_#9EFF00]
                                transition-all duration-300 ease-in-out
                                flex items-center gap-2 relative overflow-hidden group
                                hover:brightness-110 hover:shadow-[0_0_20px_-2px_#BFFF00]
                                active:scale-95 active:shadow-[0_0_25px_-1px_#CFFF00]
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]
                                disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 animate-spin text-black" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        <span>Subscribing...</span>
                                    </div>
                                ) : (
                                    "Subscribe"
                                )}
                            </button>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                                <span className="text-red-500">❗</span> {error}
                            </p>
                        )}

                        <div className="mt-4 flex items-start gap-2">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={consentChecked}
                                    onChange={(e) => setConsentChecked(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-5 h-5 rounded border border-gray-600 bg-white peer-checked:bg-[#C9F300] peer-checked:border-[#C9F300] flex items-center justify-center">
                                    {consentChecked && (
                                        <svg className="w-3 h-7 text-black" fill="none" stroke="currentColor" strokeWidth="6" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </label>


                            <label htmlFor="newsConsent" className="text-sm text-gray-300">
                                Send me GrowthGrid updates, career tips and new features.
                            </label>
                        </div>
                    </div>

                    {/* Right - Policy */}
                    <div className="max-w-md lg:mt-8">
                        <p className="text-sm max-w-3xl mx-auto text-gray-300 leading-relaxed">
                            We only use your email to send GrowthGrid updates, and we never share it with anyone.
                        </p>
                    </div>
                </form>
            </section>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center px-4">
                    <div className="bg-white text-black max-w-md w-full rounded-2xl shadow-lg p-6 text-center relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
                        >
                            &times;
                        </button>
                        <h2 className="text-xl font-semibold mb-2">You're Subscribed! 🎉</h2>
                        <p className="text-gray-700 text-sm mb-4">
                            Thanks for subscribing to <strong>GrowthGrid</strong>! Check your inbox for the latest updates and insights.
                        </p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="mt-4 px-5 py-2 bg-[#C9F300] text-black font-medium rounded-md hover:brightness-110 transition cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
