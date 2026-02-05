import Link from "next/link";
import { ArrowRight, LayoutDashboard, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8 text-center relative">
            {/* Theme Toggle in top right */}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="flex max-w-4xl flex-col items-center gap-8">
                <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                    <LayoutDashboard className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                    FinBoard <br />
                    <span className="text-muted-foreground text-xl md:text-2xl lg:text-3xl">
                        SaaS Finance Dashboard
                    </span>
                </h1>

                <p className="max-w-xl text-base md:text-lg text-muted-foreground px-4">
                    A customizable finance dashboard with drag-and-drop widgets.
                    Monitor your assets, track markets, and manage your API keys securely.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm justify-center">
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 md:py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 text-base min-h-11"
                    >
                        Get Started
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8 px-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="rounded-full bg-secondary p-3">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold">Secure API Vault</h3>
                        <p className="text-sm text-muted-foreground">Your keys are encrypted and stored safely.</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="rounded-full bg-secondary p-3">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold">Drag & Drop</h3>
                        <p className="text-sm text-muted-foreground">Fully customizable grid layout.</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="rounded-full bg-secondary p-3">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold">Real-time Data</h3>
                        <p className="text-sm text-muted-foreground">Live market updates and analytics.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}