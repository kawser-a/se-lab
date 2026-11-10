import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from './ui/button'
import { ChevronDown } from 'lucide-react'
import { checkUser } from '@/lib/checkUser'
import Image from 'next/image'
import MobileNav from './mobile-nav'

const Header = async () => {
    try {
        await checkUser();
    } catch (error) {
        console.log("Couldn't check user:", error.message);
    }

    return (
        <div className="w-full">
            {/* The header floats below the top edge. This band keeps scrolled
                content from showing through the gap above it and fades it
                out just underneath. */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-40 h-28 bg-gradient-to-b from-[#121212] from-70% to-transparent" />
            <header className="fixed top-8 left-1/2 -translate-x-1/2 w-[95%] md:w-[95%] xl:w-[90%] max-w-[1900px] bg-transparent backdrop-blur-md border border-gray-300 rounded-2xl shadow-md z-50">
                <nav className="h-14 flex items-center justify-between px-4 md:px-4">
                    <Link href="/" className="flex items-center h-full font-bold leading-normal tracking-wide text-2xl">
                        <div className='flex items-center justify-center gap-1'>
                            <div className='flex h-9 w-10 items-center justify-center rounded-md bg-[#9EFF00]'>
                                <Image src='/cub.svg' height={25} width={25} alt='' className='logo-dice' priority />
                            </div>
                            <h1>Growth<span className='sec-col'>Grid</span></h1>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2 md:gap-4">
                        <SignedIn>
                            <div className="md:hidden">
                                <MobileNav />
                            </div>

                            <Link href="/dashboard" className="hidden md:block">
                                <div>
                                    <Button className="h-10 gap-1 text-sm md:text-base font-medium tracking-wide leading-normal py-2 px-4 rounded-md bg-transparent border-2 border-[#C9F300] text-white transition-colors duration-300
                                    hover:bg-[#C9F300]">
                                        <span className="hidden md:block text-white hover:!text-black">Industry Insights</span>
                                    </Button>

                                </div>
                            </Link>

                            <div className="relative group hidden md:inline-block">
                                <button
                                    className="h-10 rounded-md text-black text-sm md:text-base font-medium tracking-wide leading-normal py-2 px-4 bg-gradient-to-r from-[#9EFF00] via-[#C9F300] to-[#9EFF00] bg-[length:200%_200%] animate-glow-sweep
                                    shadow-[0_0_15px_-3px_#9EFF00] hover:shadow-[0_0_30px_-3px_#C9F300]
                                    hover:bg-[length:400%_400%] transition-all duration-500 ease-in-out flex items-center gap-2 relative overflow-hidden group"
                                >
                                    {/* Glow pulse effect (optional) */}
                                    <span className="absolute inset-0 bg-[#C9F300] opacity-0 group-hover:opacity-20 group-hover:animate-pulse rounded-md transition-opacity duration-700" />

                                    <span className="hidden md:block relative z-10 drop-shadow-[0_0_8px_#9EFF00] group-hover:drop-shadow-[0_0_12px_#C9F300]">
                                        Growth Tools
                                    </span>

                                    <ChevronDown className="h-[1em] w-[1em] text-black font-bold relative z-10 drop-shadow-[0_0_5px_#9EFF00] group-hover:drop-shadow-[0_0_8px_#C9F300]" />
                                </button>

                                <div
                                    className="absolute left-0 mt-4 w-56 rounded-xl bg-[#111] text-white font-bold
                                    shadow-lg shadow-[#9EFF00]/30 opacity-0 scale-95 invisible
                                    group-hover:opacity-100 group-hover:scale-100 group-hover:visible
                                    group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:visible
                                    transition-all duration-300 z-50 border border-[#9EFF00]/20"
                                >
                                    <Link
                                        href="/resume"
                                        className="block px-4 py-2 hover:bg-[#9EFF00] hover:text-black rounded-t-xl transition-all"
                                    >
                                        Build Resume
                                    </Link>
                                    <Link
                                        href="/ai-cover-letter"
                                        className="block px-4 py-2 hover:bg-[#9EFF00] hover:text-black transition-all"
                                    >
                                        Cover Letter
                                    </Link>
                                    <Link
                                        href="/interview"
                                        className="block px-4 py-2 hover:bg-[#9EFF00] hover:text-black rounded-b-xl transition-all"
                                    >
                                        Mock Interview
                                    </Link>
                                </div>
                            </div>



                        </SignedIn>

                        <SignedOut>
                            <SignInButton>
                                <Button>Sign in</Button>
                            </SignInButton>
                        </SignedOut>

                        <SignedIn>
                            <UserButton
                                className="h-10"
                                appearance={{
                                    elements: { avatarBox: "w-10 h-10" },
                                }}
                                afterSignOutUrl="/"
                            />
                        </SignedIn>
                    </div>
                </nav>
            </header>
        </div>
    )
}
export default Header
