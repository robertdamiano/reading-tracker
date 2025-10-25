"use client";

import {FirebaseError} from "firebase/app";
import {signInWithEmailAndPassword} from "firebase/auth";
import {useRouter, useSearchParams} from "next/navigation";
import {FormEvent, Suspense, useEffect, useMemo, useState} from "react";

import {auth} from "@/lib/firebase/client";
import {useAuth} from "../providers/AuthProvider";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6">
      {/* Book-themed decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-10 left-10 text-8xl">📚</div>
        <div className="absolute bottom-10 right-10 text-8xl">📖</div>
        <div className="absolute top-1/2 left-1/4 text-6xl">📕</div>
        <div className="absolute top-1/3 right-1/4 text-6xl">📗</div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main card with book-like styling */}
        <div className="rounded-2xl bg-gradient-to-br from-white to-amber-50/30 p-8 shadow-2xl backdrop-blur-sm border border-amber-100/50">
          {/* Header with book icon */}
          <div className="text-center mb-6">
            <div className="inline-block text-6xl mb-4 animate-bounce-slow">📚</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
              Welcome back!
            </h1>
            <p className="mt-3 text-base text-amber-900/70 font-medium">
              Sign in to continue your reading journey
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-amber-900/80 mb-2" htmlFor="email">
                Email
              </label>
              <input
                autoComplete="email"
                className="w-full rounded-xl border-2 border-amber-200/50 bg-white/80 p-3.5 text-sm shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200/50 focus:bg-white"
                disabled={isSubmitting}
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-amber-900/80 mb-2" htmlFor="password">
                Password
              </label>
              <input
                autoComplete="current-password"
                className="w-full rounded-xl border-2 border-amber-200/50 bg-white/80 p-3.5 text-sm shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200/50 focus:bg-white"
                disabled={isSubmitting}
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            {error ? <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p> : null}
            <button
              className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:from-amber-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
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
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
