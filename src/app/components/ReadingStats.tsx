"use client";

import {useState, useEffect} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "@/lib/firebase/client";

interface Stats {
  currentStreak: number;
  lastLogDate: string;
  totalMinutes: number;
  totalPages: number;
  totalBooks: number;
}

/**
 * Calculate current streak from sorted dates
 * Counts consecutive days backwards from the most recent entry
 * Streak is maintained as long as there are no gaps in the logged dates
 */
function calculateStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;

  let streak = 1;

  // Count backwards from most recent date
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const prev = new Date(sortedDates[i] + 'T00:00:00Z');
    const curr = new Date(sortedDates[i + 1] + 'T00:00:00Z');
    const dayDiff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      streak++;
    } else {
      // Found a gap, stop counting
      break;
    }
  }

  return streak;
}

interface ReadingStatsProps {
  readerId: string;
}

export function ReadingStats({readerId}: ReadingStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all logs for the reader
        const logsRef = collection(db, `readers/${readerId}/logs`);
        const snapshot = await getDocs(logsRef);

        // Calculate stats
        const totals = {
          minutes: 0,
          pages: 0,
          books: 0
        };

        const uniqueDates = new Set<string>();
        let lastLogDate = "";

        snapshot.forEach(doc => {
          const data = doc.data();

          // Aggregate by type
          if (data.logType === "minutes") {
            totals.minutes += data.value;
          } else if (data.logType === "pages") {
            totals.pages += data.value;
          } else if (data.logType === "books") {
            totals.books += data.value;
          }

          // Track unique dates
          if (data.logDateString) {
            uniqueDates.add(data.logDateString);

            // Track latest log date
            if (!lastLogDate || data.logDateString > lastLogDate) {
              lastLogDate = data.logDateString;
            }
          }
        });

        // Calculate streak
        const sortedDates = Array.from(uniqueDates).sort();
        const currentStreak = calculateStreak(sortedDates);

        setStats({
          currentStreak,
          lastLogDate,
          totalMinutes: totals.minutes,
          totalPages: totals.pages,
          totalBooks: totals.books
        });

      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    }

    void fetchStats();
  }, [readerId]);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-4">Reading Statistics</h2>
        <div className="space-y-3">
          <p className="text-sm text-amber-700 dark:text-amber-500">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-4">Reading Statistics</h2>
        <div className="space-y-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error || "Failed to load statistics"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 christmas:border-orange-500/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 christmas:from-purple-950 christmas:to-orange-950/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 christmas:text-orange-500 mb-4">Reading Statistics</h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-neutral-700 christmas:border-orange-900/50">
          <span className="text-sm font-medium text-slate-700 dark:text-neutral-300 christmas:text-orange-300">Current Streak</span>
          <span className="text-base font-semibold text-slate-900 dark:text-amber-300 christmas:text-orange-400">{stats.currentStreak}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-neutral-700 christmas:border-orange-900/50">
          <span className="text-sm font-medium text-slate-700 dark:text-neutral-300 christmas:text-orange-300">Last Log Date</span>
          <span className="text-base font-semibold text-slate-900 dark:text-amber-300 christmas:text-orange-400">{stats.lastLogDate}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-neutral-700 christmas:border-orange-900/50">
          <span className="text-sm font-medium text-slate-700 dark:text-neutral-300 christmas:text-orange-300">Total Minutes</span>
          <span className="text-base font-semibold text-slate-900 dark:text-amber-300 christmas:text-orange-400">{stats.totalMinutes.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-neutral-700 christmas:border-orange-900/50">
          <span className="text-sm font-medium text-slate-700 dark:text-neutral-300 christmas:text-orange-300">Total Pages</span>
          <span className="text-base font-semibold text-slate-900 dark:text-amber-300 christmas:text-orange-400">{stats.totalPages.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-slate-700 dark:text-neutral-300 christmas:text-orange-300">Total Books</span>
          <span className="text-base font-semibold text-slate-900 dark:text-amber-300 christmas:text-orange-400">{stats.totalBooks}</span>
        </div>
      </div>
    </div>
  );
}
