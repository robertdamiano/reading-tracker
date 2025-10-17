"use client";

import {signOut} from "firebase/auth";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

import {auth} from "@/lib/firebase/client";
import {useAuth} from "./providers/AuthProvider";
import {ReadingLogForm} from "./components/ReadingLogForm";
import {ReadingStats} from "./components/ReadingStats";

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
    <div className="min-h-screen bg-slate-100 py-12">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6">
        <div>
          <p className="text-sm text-slate-500">Signed in as</p>
          <p className="text-base font-medium text-slate-900">{user.email}</p>
        </div>
        <button
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSigningOut}
          onClick={handleSignOut}
          type="button"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </header>
      <main className="mx-auto mt-8 max-w-4xl px-6">
        <h1 className="text-3xl font-semibold text-slate-900">Reading Tracker</h1>
        <p className="mt-2 text-slate-600">Track Luke&apos;s daily reading progress</p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Reading Log Form */}
          <div>
            <ReadingLogForm />
          </div>

          {/* Reading Statistics */}
          <div>
            <ReadingStats />
          </div>
        </div>
      </main>
    </div>
  );
}
