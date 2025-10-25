"use client";

import {signOut} from "firebase/auth";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

import {auth} from "@/lib/firebase/client";
import {useAuth} from "./providers/AuthProvider";
import {ReadingLogForm} from "./components/ReadingLogForm";
import {ReadingStats} from "./components/ReadingStats";
import {Achievements} from "./components/Achievements";
import {RecentActivity} from "./components/RecentActivity";
import {MonthlyOverview} from "./components/MonthlyOverview";

export default function Home() {
  const router = useRouter();
  const {user, loading} = useAuth();
  const [isSigningOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      const redirectTarget = encodeURIComponent("/");
      router.replace(`/login?redirectTo=${redirectTarget}`);
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg text-slate-700">Loading your dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12">
      {/* Decorative book elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-20 right-10 text-9xl">📚</div>
        <div className="absolute bottom-40 left-10 text-7xl">📖</div>
        <div className="absolute top-1/2 right-1/3 text-6xl">📕</div>
      </div>

      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6">
        <div>
          <p className="text-sm text-amber-700/70">Signed in as</p>
          <p className="text-base font-semibold text-amber-900">{user.email}</p>
        </div>
        <button
          className="rounded-xl border-2 border-amber-200 bg-white/80 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-white hover:border-amber-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSigningOut}
          onClick={handleSignOut}
          type="button"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </header>
      <main className="relative mx-auto mt-8 max-w-7xl px-6 pb-12">
        <div className="text-center mb-8">
          <div className="inline-block text-5xl mb-3">📚</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">Reading Tracker</h1>
          <p className="mt-2 text-lg text-amber-900/70 font-medium">Track Luke&apos;s daily reading progress</p>
        </div>

        {/* Form and Stats Row */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <ReadingLogForm />
          <ReadingStats />
        </div>

        {/* Achievements and Recent Activity Row */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Achievements />
          <RecentActivity />
        </div>

        {/* Monthly Overview - Full Width */}
        <div className="mt-6">
          <MonthlyOverview />
        </div>
      </main>
    </div>
  );
}
