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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back!</h1>
        <p className="mt-2 text-sm text-slate-600">
          Accounts are created by parents. Please use the email address shared with you.
        </p>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-slate-300 p-3 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              disabled={isSubmitting}
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-slate-300 p-3 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              disabled={isSubmitting}
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            className="w-full rounded-md bg-slate-900 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
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
