"use client";

import {signOut} from "firebase/auth";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

import {auth} from "@/lib/firebase/client";
import {useAuth} from "./providers/AuthProvider";
import {ReadingLogForm} from "./components/ReadingLogForm";

type HelloResponse = {
  message: string;
};

function resolveHelloEndpoint(): string {
  if (typeof window === "undefined") {
    return "/api/hello";
  }

  const hostname = window.location.hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocal) {
    return process.env.NEXT_PUBLIC_HELLO_ENDPOINT ?? "/api/hello";
  }

  return "/api/hello";
}

export default function Home() {
  const router = useRouter();
  const {user, loading} = useAuth();
  const [message, setMessage] = useState<string>("Loading message...");
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      const redirectTarget = encodeURIComponent("/");
      router.replace(`/login?redirectTo=${redirectTarget}`);
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    async function loadMessage() {
      try {
        const endpoint = resolveHelloEndpoint();
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as HelloResponse;
        setMessage(data.message ?? "Hello world");
        setError(null);
      } catch (err) {
        console.error("Failed to load hello world message", err);
        setError("Could not load the greeting. Check your Functions emulator or deployment.");
      }
    }

    void loadMessage();
  }, [loading, user]);

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

          {/* Placeholder for stats - will be replaced with real dashboard */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Reading Statistics</h2>
            <div className="space-y-4">
              <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                {error ? (
                  <span className="text-red-600">{error}</span>
                ) : (
                  <span className="text-sm text-slate-600">{message}</span>
                )}
              </div>
              <p className="text-sm text-slate-500 text-center">
                Dashboard with streak and totals coming soon!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
