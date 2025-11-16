"use client";

import {FirebaseError} from "firebase/app";
import {signInWithEmailAndPassword} from "firebase/auth";
import {useRouter, useSearchParams} from "next/navigation";
import {FormEvent, Suspense, useEffect, useMemo, useState} from "react";

import {auth} from "@/lib/firebase/client";
import {useAuth} from "../providers/AuthProvider";
import {useTheme} from "../providers/ThemeProvider";

const allowedEmailList = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const allowedEmails = new Set(allowedEmailList);

function formatAuthError(error: FirebaseError | Error): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/invalid-email":
        return "That email or password is incorrect.";
      case "auth/user-disabled":
        return "This account is currently disabled. Please reach out to a parent.";
      case "auth/user-not-found":
        return "We could not find that account. Double-check the email address.";
      default:
        return "We could not sign you in right now. Please try again.";
    }
  }

  return "We could not sign you in right now. Please try again.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {user, loading} = useAuth();
  const {theme, setTheme} = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const redirectTo = useMemo(() => searchParams.get("redirectTo") ?? "/", [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (allowedEmails.size > 0 && !allowedEmails.has(normalizedEmail)) {
        setError("This email is not enabled for the reading tracker. Ask a parent for help.");
        return;
      }

      await signInWithEmailAndPassword(auth, normalizedEmail, password);
      router.replace(redirectTo);
    } catch (err) {
      const message = err instanceof Error ? formatAuthError(err) : "Unable to sign in.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-neutral-900 dark:via-stone-900 dark:to-neutral-900 christmas:from-purple-950 christmas:via-orange-950 christmas:to-black p-6">
      {/* Jason Voorhees Easter Egg */}
      {showEasterEgg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-pulse" onClick={() => setShowEasterEgg(false)}>
          <div className="text-center">
            <div className="text-9xl mb-4">🔪</div>
            <p className="text-6xl font-bold text-red-600 mb-4">JASON IS WATCHING</p>
            <p className="text-2xl text-white">Friday the 13th... 13 clicks...</p>
            <p className="text-lg text-gray-400 mt-4">Click anywhere to continue...</p>
          </div>
        </div>
      )}

      {/* Theme toggle button */}
      <button
        onClick={() => {
          const themes: Array<"light" | "dark" | "system" | "christmas"> = ["light", "dark", "system", "christmas"];
          const currentIndex = themes.indexOf(theme);
          const nextTheme = themes[(currentIndex + 1) % themes.length];
          setTheme(nextTheme);

          // Easter egg counter
          const newCount = clickCount + 1;
          setClickCount(newCount);
          if (newCount === 13) {
            setShowEasterEgg(true);
            setClickCount(0);
          }
        }}
        className="absolute top-6 right-6 rounded-xl border-2 border-amber-200 dark:border-amber-700 christmas:border-orange-500 bg-white/80 dark:bg-neutral-800/80 christmas:bg-purple-950/80 p-2 text-amber-900 dark:text-amber-300 christmas:text-orange-500 transition hover:bg-white dark:hover:bg-neutral-800 christmas:hover:bg-purple-900 hover:border-amber-300 dark:hover:border-amber-600 christmas:hover:border-orange-400 hover:shadow-md z-10"
        title={`Theme: ${theme}`}
        type="button"
      >
        {theme === "light" && <span className="text-xl">☀️</span>}
        {theme === "dark" && <span className="text-xl">🌙</span>}
        {theme === "system" && <span className="text-xl">💻</span>}
        {theme === "christmas" && <span className="text-xl">🎄</span>}
      </button>

      {/* Book-themed decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 dark:opacity-20 christmas:opacity-30">
        <div className="absolute top-10 left-10 text-8xl christmas:hidden">📚</div>
        <div className="absolute bottom-10 right-10 text-8xl christmas:hidden">📖</div>
        <div className="absolute top-1/2 left-1/4 text-6xl christmas:hidden">📕</div>
        <div className="absolute top-1/3 right-1/4 text-6xl christmas:hidden">📗</div>
        {/* Christmas decorative elements */}
        <div className="hidden christmas:block absolute top-10 left-10 text-8xl">🎄</div>
        <div className="hidden christmas:block absolute bottom-10 right-10 text-8xl">⭐</div>
        <div className="hidden christmas:block absolute top-1/2 left-1/4 text-6xl">❄️</div>
        <div className="hidden christmas:block absolute top-1/3 right-1/4 text-6xl">🎅</div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main card with book-like styling */}
        <div className="rounded-2xl bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 christmas:from-purple-950 christmas:to-orange-950/30 p-8 shadow-2xl backdrop-blur-sm border border-amber-100/50 dark:border-amber-800/50 christmas:border-orange-500/50">
          {/* Header with book icon */}
          <div className="text-center mb-6">
            <div className="inline-block text-6xl mb-4 animate-bounce-slow christmas:hidden">📚</div>
            <div className="hidden christmas:inline-block text-6xl mb-4 animate-bounce-slow">🎄</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-400 dark:to-orange-400 christmas:from-orange-500 christmas:to-purple-500 bg-clip-text text-transparent">
              Welcome back!
            </h1>
            <p className="mt-3 text-base text-amber-900/70 dark:text-amber-400/70 christmas:text-orange-400 font-medium">
              Sign in to continue your reading journey
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-amber-900/80 dark:text-amber-400/80 christmas:text-orange-400 mb-2" htmlFor="email">
                Email
              </label>
              <input
                autoComplete="email"
                className="w-full rounded-xl border-2 border-amber-200/50 dark:border-amber-700/50 christmas:border-orange-500/50 bg-white/80 dark:bg-neutral-700/80 christmas:bg-purple-900/80 text-slate-900 dark:text-neutral-100 christmas:text-orange-200 p-3.5 text-sm shadow-sm transition-all focus:border-amber-400 dark:focus:border-amber-500 christmas:focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-amber-200/50 dark:focus:ring-amber-700/50 christmas:focus:ring-orange-500/50 focus:bg-white dark:focus:bg-neutral-700 christmas:focus:bg-purple-900"
                disabled={isSubmitting}
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-amber-900/80 dark:text-amber-400/80 christmas:text-orange-400 mb-2" htmlFor="password">
                Password
              </label>
              <input
                autoComplete="current-password"
                className="w-full rounded-xl border-2 border-amber-200/50 dark:border-amber-700/50 christmas:border-orange-500/50 bg-white/80 dark:bg-neutral-700/80 christmas:bg-purple-900/80 text-slate-900 dark:text-neutral-100 christmas:text-orange-200 p-3.5 text-sm shadow-sm transition-all focus:border-amber-400 dark:focus:border-amber-500 christmas:focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-amber-200/50 dark:focus:ring-amber-700/50 christmas:focus:ring-orange-500/50 focus:bg-white dark:focus:bg-neutral-700 christmas:focus:bg-purple-900"
                disabled={isSubmitting}
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            {error ? <p className="text-sm text-red-700 dark:text-red-400 christmas:text-red-400 bg-red-50 dark:bg-red-900/30 christmas:bg-red-900/50 p-3 rounded-lg border border-red-200 dark:border-red-700 christmas:border-red-600">{error}</p> : null}
            <button
              className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-700 dark:to-orange-700 christmas:from-orange-600 christmas:to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:from-amber-500 hover:to-orange-500 dark:hover:from-amber-600 dark:hover:to-orange-600 christmas:hover:from-orange-500 christmas:hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
