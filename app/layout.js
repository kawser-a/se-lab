import { Mona_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";

const monaSans = Mona_Sans({
    variable: "--font-mona-sans",
    subsets: ["latin"],
});

export const metadata = {
    title: "GrowthGrid",
    description: "GrowthGrid - The AI-powered career platform revolutionizing job searches with AR resumes, smart mock interviews, and real-time industry trends. Land your dream role faster.",
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider appearance={{baseTheme:dark,}}
        >
            <html lang="en" suppressHydrationWarning>
                <body
                    className={`${monaSans.variable} antialiased`}
                >
                        <ThemeProvider    attribute="class" defaultTheme="dark"nenableSystem disableTransitionOnChange
                        >

                                {/* header */}
                                <Header/>

                                <main className="min-h-screen">{children}</main>
                                <Toaster richColors/>

                                {/* footer */}
                                <footer className="bg-muted ">
                                    <div className="container mx-auto px-4">
                                        <p className="text-center py-2">Development running........</p>
                                    </div>
                                </footer>

                        </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    )
}
