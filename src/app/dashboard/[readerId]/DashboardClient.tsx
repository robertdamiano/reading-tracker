"use client";

import {signOut} from "firebase/auth";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {doc, getDoc} from "firebase/firestore";

import {auth, db} from "@/lib/firebase/client";
import {useAuth} from "../../providers/AuthProvider";
import {useTheme} from "../../providers/ThemeProvider";
import {ReadingLogForm} from "../../components/ReadingLogForm";
import {ReadingStats} from "../../components/ReadingStats";
import {Achievements} from "../../components/Achievements";
import {RecentActivity} from "../../components/RecentActivity";
import {MonthlyOverview} from "../../components/MonthlyOverview";

interface DashboardClientProps {
  readerId: string;
}

export default function DashboardClient({readerId}: DashboardClientProps) {
  const router = useRouter();
  const {user, profile, loading: authLoading} = useAuth();
  const {theme, setTheme} = useTheme();

  const [isSigningOut, setSigningOut] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [readerName, setReaderName] = useState<string>("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableReaders, setAvailableReaders] = useState<Array<{id: string; name: string}>>([]);

  // Fetch reader profile and check access
  useEffect(() => {
    async function checkAccess() {
      if (authLoading) return;

      if (!user || !profile) {
        router.replace(`/login?redirectTo=${encodeURIComponent(`/dashboard/${readerId}`)}`);
        return;
      }

      // Check if user has access to this reader
      const hasAccess =
        profile.role === 'parent' ||
        (profile.role === 'child' && profile.readerId === readerId);

      if (!hasAccess) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Fetch reader profile to get display name
      try {
        const readerRef = doc(db, 'readers', readerId);
        const readerDoc = await getDoc(readerRef);

        if (readerDoc.exists()) {
          setReaderName(readerDoc.data().displayName || readerId);
        } else {
          setReaderName(readerId);
        }

        // For parents, fetch all available readers for the selector
        if (profile.role === 'parent') {
          const readers = await Promise.all(
            (profile.allowedReaders || []).map(async (id) => {
              const ref = doc(db, 'readers', id);
              const snap = await getDoc(ref);
              return {
                id,
                name: snap.exists() ? snap.data().displayName : id
              };
            })
          );
          setAvailableReaders(readers);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch reader profile:', err);
        setReaderName(readerId);
        setLoading(false);
      }
    }

    void checkAccess();
  }, [authLoading, user, profile, readerId, router]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Failed to sign out", err);
      setSigningOut(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-neutral-900">
        <p className="text-lg text-slate-700 dark:text-neutral-300">Loading dashboard...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-neutral-900">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600 mb-4">Access Denied</p>
          <p className="text-lg text-slate-700 dark:text-neutral-300 mb-4">
            You don&apos;t have permission to view this reader&apos;s dashboard.
          </p>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-neutral-900 dark:via-stone-900 dark:to-neutral-900 christmas:from-purple-950 christmas:via-orange-950 christmas:to-black py-12">
      {/* Christmas Easter Egg - 12 clicks */}
      {showEasterEgg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setShowEasterEgg(false)}>
          <div className="text-center animate-pulse">
            <div className="text-9xl mb-4 animate-bounce">🎄</div>
            <p className="text-6xl font-bold text-green-500 mb-4">MERRY CHRISTMAS!</p>
            <p className="text-2xl text-white">The 12 Days of Christmas... 12 clicks!</p>
            <p className="text-lg text-gray-400 mt-4">Click anywhere to continue...</p>
          </div>
        </div>
      )}

      {/* Decorative book elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5 dark:opacity-10 christmas:opacity-20">
        <div className="absolute top-20 right-10 text-9xl christmas:hidden">📚</div>
        <div className="absolute bottom-40 left-10 text-7xl christmas:hidden">📖</div>
        <div className="absolute top-1/2 right-1/3 text-6xl christmas:hidden">📕</div>
        {/* Christmas decorative elements */}
        <div className="hidden christmas:block absolute top-20 right-10 text-9xl">🎄</div>
        <div className="hidden christmas:block absolute bottom-40 left-10 text-7xl">⭐</div>
        <div className="hidden christmas:block absolute top-1/2 right-1/3 text-6xl">❄️</div>
        <div className="hidden christmas:block absolute top-1/4 left-1/4 text-6xl">🎅</div>
      </div>

      <header className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
            <div>
              <p className="text-sm text-amber-700/70 dark:text-amber-400/70 christmas:text-orange-400/70">Signed in as</p>
              <p className="text-base font-semibold text-amber-900 dark:text-amber-300 christmas:text-orange-500">{user?.email}</p>
            </div>

          {/* Reader selector for parents */}
          {profile?.role === 'parent' && availableReaders.length > 0 && (
            <div>
              <label htmlFor="reader-select" className="block text-xs text-amber-700/70 dark:text-amber-400/70 christmas:text-orange-400/70 mb-1">
                Viewing:
              </label>
              <select
                id="reader-select"
                value={readerId}
                onChange={(e) => router.push(`/dashboard/${e.target.value}`)}
                className="rounded-lg border-2 border-amber-200 dark:border-amber-700 christmas:border-orange-500 bg-white dark:bg-neutral-800 christmas:bg-purple-950/80 text-amber-900 dark:text-amber-300 christmas:text-orange-500 px-3 py-1.5 text-sm font-semibold transition hover:border-amber-300 dark:hover:border-amber-600 christmas:hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableReaders.map(reader => (
                  <option key={reader.id} value={reader.id}>
                    {reader.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const themes: Array<"light" | "dark" | "system" | "christmas"> = ["light", "dark", "system", "christmas"];
                  const currentIndex = themes.indexOf(theme);
                  const nextTheme = themes[(currentIndex + 1) % themes.length];
                  setTheme(nextTheme);

                  // Easter egg counter - 12 clicks for Christmas
                  const newCount = clickCount + 1;
                  setClickCount(newCount);
                  if (newCount === 12) {
                    setShowEasterEgg(true);
                    setClickCount(0);
                  }
                }}
                className="rounded-xl border-2 border-amber-200 dark:border-amber-700 christmas:border-orange-500 bg-white/80 dark:bg-neutral-800/80 christmas:bg-purple-950/80 p-2 text-amber-900 dark:text-amber-300 christmas:text-orange-500 transition hover:bg-white dark:hover:bg-neutral-800 christmas:hover:bg-purple-900 hover:border-amber-300 dark:hover:border-amber-600 christmas:hover:border-orange-400 hover:shadow-md"
                title={`Theme: ${theme}`}
                type="button"
              >
                {theme === "light" && <span className="text-xl">☀️</span>}
                {theme === "dark" && <span className="text-xl">🌙</span>}
                {theme === "system" && <span className="text-xl">💻</span>}
                {theme === "christmas" && <span className="text-xl">🎄</span>}
              </button>
              <button
                className="rounded-xl border-2 border-amber-200 dark:border-amber-700 christmas:border-orange-500 bg-white/80 dark:bg-neutral-800/80 christmas:bg-purple-950/80 px-4 py-2 text-sm font-semibold text-amber-900 dark:text-amber-300 christmas:text-orange-500 transition hover:bg-white dark:hover:bg-neutral-800 christmas:hover:bg-purple-900 hover:border-amber-300 dark:hover:border-amber-600 christmas:hover:border-orange-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSigningOut}
                onClick={handleSignOut}
                type="button"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>

          {/* Reader selector for parents */}
          {profile?.role === 'parent' && availableReaders.length > 0 && (
            <div className="flex flex-col max-w-xs">
              <label htmlFor="reader-select" className="block text-xs text-amber-700/70 dark:text-amber-400/70 christmas:text-orange-400/70 mb-1">
                Viewing:
              </label>
              <select
                id="reader-select"
                value={readerId}
                onChange={(e) => router.push(`/dashboard/${e.target.value}`)}
                className="rounded-lg border-2 border-amber-200 dark:border-amber-700 christmas:border-orange-500 bg-white dark:bg-neutral-800 christmas:bg-purple-950/80 text-amber-900 dark:text-amber-300 christmas:text-orange-500 px-3 py-1.5 text-sm font-semibold transition hover:border-amber-300 dark:hover:border-amber-600 christmas:hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableReaders.map(reader => (
                  <option key={reader.id} value={reader.id}>
                    {reader.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="hidden" />
      </header>

      <main className="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 pb-12">
        <div className="text-center mb-8">
          <div className="inline-block text-5xl mb-3 christmas:hidden">📚</div>
          <div className="hidden christmas:inline-block text-5xl mb-3">🎄</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-400 dark:to-orange-400 christmas:from-orange-500 christmas:to-purple-500 bg-clip-text text-transparent">Reading Tracker</h1>
          <p className="mt-2 text-lg text-amber-900/70 dark:text-amber-400/70 christmas:text-orange-400 font-medium">
            Track {readerName}&apos;s daily reading progress
          </p>
        </div>

        {/* Form and Stats Row */}
        <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-2">
          <ReadingLogForm readerId={readerId} />
          <ReadingStats readerId={readerId} />
        </div>

        {/* Achievements and Recent Activity Row */}
        <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 md:grid-cols-2 auto-rows-auto">
          <Achievements readerId={readerId} />
          <RecentActivity readerId={readerId} />
        </div>

        {/* Monthly Overview - Full Width */}
        <div className="mt-4 sm:mt-6">
          <MonthlyOverview readerId={readerId} />
        </div>
      </main>
    </div>
  );
}
