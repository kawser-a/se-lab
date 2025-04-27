import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { FileText, GraduationCap, LayoutDashboard, PenBox, StarIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { checkUser } from '@/lib/checkUser'

const Header = async() => {
    await checkUser();
    return (
        <header className='fixed top-0 w-full border-b bg-background/80 backdrop-blur-md'>
            <nav className='container mx-auto px-4 h-16 flex items-center justify-between'>
                {/* logo */}
                <Link href='/' className='flex items-center h-full font-medium text-2xl w-20  py-1 '>
                    <h1>GrowthGrid</h1>
                </Link>

                <div className='flex items-center  space-x-2 md:space-x-4'>

                    <SignedIn>
                        {/* menu1 */}
                        <Link href={'/dashboard'}>
                            <Button className="h-10 gap-1 px-2 md:px-4">
                                <LayoutDashboard className='h-4 w-4' />
                                <span className='hidden md:block'>Industry Insights</span>
                            </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                {/* menu2 */}
                                <Button className="h-10">
                                    <StarIcon className='h-4 w-4' />
                                    <span className='hidden md:block'>Growth Tools</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>
                                    <Link href={'/resume'} className='flex items-center gap-2'>
                                        <FileText className='h-4 w-4'/>
                                        <span className='hidden md:block'>Build Resume</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Link href={'/ai-cover-letter'} className='flex items-center gap-2'>
                                        <PenBox className='h-4 w-4'/>
                                        <span className='hidden md:block'>Cover Letter</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Link href={'/interview'} className='flex items-center gap-2'>
                                        <GraduationCap className='h-4 w-4'/>
                                        <span className='hidden md:block'>Mock Interview</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SignedIn>

                    <SignedOut>
                        <SignInButton>
                            <Button>Sign in</Button>
                        </SignInButton>
                    </SignedOut>

                    {/* user profile icon */}
                    <SignedIn className="mt-10">
                        <UserButton className="h-10 mt-10"
                        appearance={{
                            elements: {
                                avatarBox: "w-10 h-10"
                            }
                        }}
                            afterSignOutUrl='/'
                        />
                    </SignedIn>
                </div>
            </nav>

        </header>
    )
}

export default Header
