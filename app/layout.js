import { Mona_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import Footer from "@/components/Footer";
import ConditionalNewsletter from "@/components/sub-comp/ConditionalNewsletter";

const monaSans = Mona_Sans({
    variable: "--font-mona-sans",
    subsets: ["latin"],
});

export const metadata = {
    title: "GrowthGrid",
    description: "GrowthGrid - The AI-powered career platform revolutionizing job searches with AR resumes, smart mock interviews, and real-time industry trends. Land your dream role faster.",
    icons: [
        { url: "/favicon.svg", type: "image/svg+xml" },
    ]
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider appearance={{baseTheme:dark,}}
        >
            <html lang="en" className="scroll-smooth" suppressHydrationWarning={true}>
                <body
                    suppressHydrationWarning={true}
                    className={`${monaSans.variable} antialiased`}
                >
                        <ThemeProvider    attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange
                        >
                                {/* header */}
                                <Header/>

                                <main className="min-h-screen pt-20">{children}</main>
                                <Toaster richColors/>

                                <footer className="bg-gradient-to-tr from-[#1E1E1E] to-[#121212]">
                                    <ConditionalNewsletter/>
                                    <Footer/>
                                </footer>

                        </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    )
}
