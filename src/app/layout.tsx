import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "FinBoard",
    description: "SaaS Finance Dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('theme');
                                    var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                    
                                    if (theme === 'dark' || (!theme && systemPrefersDark)) {
                                        document.documentElement.classList.add('dark');
                                    } else {
                                        document.documentElement.classList.remove('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body className={cn(
                inter.className,
                "min-h-screen bg-background font-sans antialiased",
                "transition-colors duration-200"
            )}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}