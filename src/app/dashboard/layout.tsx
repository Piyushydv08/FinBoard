"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Settings, LayoutDashboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { logout, user } = useAuth();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-muted/20">
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 z-40 bg-black/50 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={cn(
                    "fixed md:relative z-50 md:z-auto w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:flex md:w-64 flex-col border-r bg-card",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="flex h-14 items-center justify-between border-b px-4 lg:h-15 lg:px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <LayoutDashboard className="h-6 w-6" />
                            <span className="">FinBoard</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-1 hover:bg-muted rounded"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                            <Link
                                href="/dashboard"
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-3 md:py-2 transition-all hover:text-primary",
                                    pathname === "/dashboard" ? "bg-muted text-primary" : "text-muted-foreground"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <LayoutDashboard className="h-5 w-5 md:h-4 md:w-4" />
                                Dashboard
                            </Link>
                            <Link
                                href="/dashboard/settings"
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-3 md:py-2 transition-all hover:text-primary",
                                    pathname === "/dashboard/settings" ? "bg-muted text-primary" : "text-muted-foreground"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Settings className="h-5 w-5 md:h-4 md:w-4" />
                                API Key Vault
                            </Link>
                        </nav>
                    </div>
                    <div className="mt-auto p-4 border-t">
                        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground">
                            <div className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary/10 text-sm md:text-xs font-bold text-primary">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="truncate text-sm md:text-sm">{user?.displayName || "User"}</span>
                                <span className="truncate text-xs md:text-xs font-normal opacity-70">{user?.email}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 md:py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary mt-2"
                        >
                            <LogOut className="h-5 w-5 md:h-4 md:w-4" />
                            Log Out
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-15 lg:px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 hover:bg-muted rounded"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <Link href="/" className="flex items-center gap-2 font-semibold md:hidden">
                            <LayoutDashboard className="h-6 w-6" />
                            <span>FinBoard</span>
                        </Link>
                        <div className="flex-1" />
                        <div className="md:hidden flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 overflow-auto p-3 md:p-4 lg:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}