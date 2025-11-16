"use client";

import {useRouter} from "next/navigation";
import {useEffect} from "react";

import {useAuth} from "./providers/AuthProvider";

export default function Home() {
  const router = useRouter();
  const {user, profile, loading} = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user || !profile) {
      // Not authenticated or no profile - redirect to login
      router.replace("/login?redirectTo=%2F");
      return;
    }

    // Redirect based on user role
    if (profile.role === 'parent') {
      // Parents default to first allowed reader (typically luke)
      const defaultReader = profile.allowedReaders?.[0] || 'luke';
      router.replace(`/dashboard/${defaultReader}`);
    } else if (profile.role === 'child') {
      // Children go to their own dashboard
      router.replace(`/dashboard/${profile.readerId}`);
    } else {
      // Unknown role - redirect to login
      router.replace("/login");
    }
  }, [loading, user, profile, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-neutral-900">
      <p className="text-lg text-slate-700 dark:text-neutral-300">Loading your dashboard...</p>
    </div>
  );
}
