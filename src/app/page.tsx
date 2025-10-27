"use client";

import {signOut} from "firebase/auth";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

import {auth} from "@/lib/firebase/client";
import {useAuth} from "./providers/AuthProvider";
import {useTheme} from "./providers/ThemeProvider";
import {ReadingLogForm} from "./components/ReadingLogForm";
import {ReadingStats} from "./components/ReadingStats";
import {Achievements} from "./components/Achievements";
import {RecentActivity} from "./components/RecentActivity";
import {MonthlyOverview} from "./components/MonthlyOverview";

export default function Home() {
  const router = useRouter();
  const {user, loading} = useAuth();
  const {theme, setTheme} = useTheme();
  const [isSigningOut, setSigningOut] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      const redirectTarget = encodeURIComponent("/");
      router.replace(`/login?redirectTo=${redirectTarget}`);
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-neutral-900">
        <p className="text-lg text-slate-700 dark:text-neutral-300">Loading your dashboard...</p>
      </div>
    );
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Failed to sign out", err);
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-neutral-900 dark:via-stone-900 dark:to-neutral-900 halloween:from-purple-950 halloween:via-orange-950 halloween:to-black py-12">
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

      {/* Decorative book elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5 dark:opacity-10 halloween:opacity-20">
        <div className="absolute top-20 right-10 text-9xl halloween:hidden">📚</div>
        <div className="absolute bottom-40 left-10 text-7xl halloween:hidden">📖</div>
        <div className="absolute top-1/2 right-1/3 text-6xl halloween:hidden">📕</div>
        {/* Halloween decorative elements */}
        <div className="hidden halloween:block absolute top-20 right-10 text-9xl">🎃</div>
        <div className="hidden halloween:block absolute bottom-40 left-10 text-7xl">👻</div>
        <div className="hidden halloween:block absolute top-1/2 right-1/3 text-6xl">🦇</div>
        <div className="hidden halloween:block absolute top-1/4 left-1/4 text-6xl">🕷️</div>
      </div>

      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <div>
          <p className="text-sm text-amber-700/70 dark:text-amber-400/70 halloween:text-orange-400/70">Signed in as</p>
          <p className="text-base font-semibold text-amber-900 dark:text-amber-300 halloween:text-orange-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const themes: Array<"light" | "dark" | "system" | "halloween"> = ["light", "dark", "system", "halloween"];
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
            className="rounded-xl border-2 border-amber-200 dark:border-amber-700 halloween:border-orange-500 bg-white/80 dark:bg-neutral-800/80 halloween:bg-purple-950/80 p-2 text-amber-900 dark:text-amber-300 halloween:text-orange-500 transition hover:bg-white dark:hover:bg-neutral-800 halloween:hover:bg-purple-900 hover:border-amber-300 dark:hover:border-amber-600 halloween:hover:border-orange-400 hover:shadow-md"
            title={`Theme: ${theme}`}
            type="button"
          >
            {theme === "light" && <span className="text-xl">☀️</span>}
            {theme === "dark" && <span className="text-xl">🌙</span>}
            {theme === "system" && <span className="text-xl">💻</span>}
            {theme === "halloween" && <span className="text-xl">🎃</span>}
          </button>
          <button
            className="rounded-xl border-2 border-amber-200 dark:border-amber-700 halloween:border-orange-500 bg-white/80 dark:bg-neutral-800/80 halloween:bg-purple-950/80 px-4 py-2 text-sm font-semibold text-amber-900 dark:text-amber-300 halloween:text-orange-500 transition hover:bg-white dark:hover:bg-neutral-800 halloween:hover:bg-purple-900 hover:border-amber-300 dark:hover:border-amber-600 halloween:hover:border-orange-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>
      <main className="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 pb-12">
        <div className="text-center mb-8">
          <div className="inline-block text-5xl mb-3 halloween:hidden">📚</div>
          <div className="hidden halloween:inline-block text-5xl mb-3">🎃</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-400 dark:to-orange-400 halloween:from-orange-500 halloween:to-purple-500 bg-clip-text text-transparent">Reading Tracker</h1>
          <p className="mt-2 text-lg text-amber-900/70 dark:text-amber-400/70 halloween:text-orange-400 font-medium">Track Luke&apos;s daily reading progress</p>
        </div>

        {/* Form and Stats Row */}
        <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-2">
          <ReadingLogForm />
          <ReadingStats />
        </div>

        {/* Achievements and Recent Activity Row */}
        <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 md:grid-cols-2 auto-rows-auto">
          <Achievements />
          <RecentActivity />
        </div>

        {/* Monthly Overview - Full Width */}
        <div className="mt-4 sm:mt-6">
          <MonthlyOverview />
        </div>
      </main>
    </div>
  );
}
