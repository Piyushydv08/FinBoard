"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app, auth } from "@/lib/firebase";
import { LayoutDashboard } from "lucide-react";

export default function SignupPage() {
    const { signInWithGoogle } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Use the imported auth instance directly
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Signup error:", err);
      
      // Better error messages
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account already exists with this email");
          break;
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/operation-not-allowed":
          setError("Email/password accounts are not enabled. Contact support");
          break;
        case "auth/weak-password":
          setError("Password is too weak. Use at least 6 characters");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your connection");
          break;
        default:
          setError("Failed to create account. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4 md:p-8">
            <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 md:p-8 shadow-sm">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="rounded-full bg-primary/10 p-3">
                        <LayoutDashboard className="h-10 w-10 md:h-8 md:w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Create an account</h2>
                    <p className="text-sm text-muted-foreground px-4">
                        Enter your email below to create your account
                    </p>
                </div>

                {error && (
                    <div className="rounded-md bg-destructive/15 p-4 md:p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailSignup} className="space-y-6 md:space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="flex h-12 md:h-10 w-full rounded-lg md:rounded-md border border-input bg-background px-4 py-3 md:px-3 md:py-2 text-base md:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="m@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="flex h-12 md:h-10 w-full rounded-lg md:rounded-md border border-input bg-background px-4 py-3 md:px-3 md:py-2 text-base md:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-12 md:h-10 w-full items-center justify-center rounded-lg md:rounded-md bg-primary px-4 py-3 md:py-2 text-base md:text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-11"
                    >
                        {loading ? "Creating account..." : "Sign Up with Email"}
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => signInWithGoogle()}
                    className="inline-flex h-12 md:h-10 w-full items-center justify-center rounded-lg md:rounded-md border border-input bg-background px-4 py-3 md:py-2 text-base md:text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-11"
                >
                    <svg className="mr-3 md:mr-2 h-5 w-5 md:h-4 md:w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Continue with Google
                </button>

                <p className="px-4 md:px-8 text-center text-sm text-muted-foreground">
                    <Link
                        href="/login"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Already have an account? Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
