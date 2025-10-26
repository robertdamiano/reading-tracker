"use client";

import {useState, useEffect} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "@/lib/firebase/client";

interface LogEntry {
  id: string;
  logDateString: string;
  logType: "minutes" | "pages" | "books";
  value: number;
  bookTitle?: string;
  bookAuthor?: string;
}

function getLogIcon(logType: string): string {
  switch (logType) {
    case "minutes": return "⏱️";
    case "pages": return "📄";
    case "books": return "📚";
    default: return "📖";
  }
}

function getLogColor(logType: string): string {
  switch (logType) {
    case "minutes": return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-300";
    case "pages": return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-900 dark:text-green-300";
    case "books": return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-900 dark:text-purple-300";
    default: return "bg-slate-50 dark:bg-neutral-700 border-slate-200 dark:border-neutral-600 text-slate-900 dark:text-neutral-200";
  }
}

function formatDate(dateString: string): string {
  // Parse date string as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const logDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (logDate.getTime() === today.getTime()) {
    return "Today";
  } else if (logDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export function RecentActivity() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecentLogs() {
      try {
        setLoading(true);
        setError(null);

        const readerId = "luke";
        const logsRef = collection(db, `readers/${readerId}/logs`);

        // Fetch all logs and sort client-side (Firestore needs index for orderBy)
        const snapshot = await getDocs(logsRef);

        const allLogs: LogEntry[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          allLogs.push({
            id: doc.id,
            logDateString: data.logDateString,
            logType: data.logType,
            value: data.value,
            bookTitle: data.bookTitle,
            bookAuthor: data.bookAuthor,
          });
        });

        // Sort by date descending and take top 10
        const sortedLogs = allLogs
          .sort((a, b) => b.logDateString.localeCompare(a.logDateString))
          .slice(0, 10);

        setLogs(sortedLogs);

      } catch (err) {
        console.error("Failed to fetch recent logs:", err);
        setError("Failed to load recent activity");
      } finally {
        setLoading(false);
      }
    }

    void fetchRecentLogs();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm flex flex-col">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-4">Recent Activity</h2>
        <p className="text-sm text-amber-700 dark:text-amber-500">Loading activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm flex flex-col">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-4">Recent Activity</h2>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm flex flex-col">
      <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-4">Recent Activity</h2>

      {logs.length === 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-500">No reading logs yet. Start logging your reading!</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {logs.map(log => (
            <div
              key={log.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getLogColor(log.logType)}`}
            >
              <span className="text-xl mt-0.5">{getLogIcon(log.logType)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {log.value} {log.logType}
                  </p>
                  <span className="text-xs opacity-70 whitespace-nowrap">
                    {formatDate(log.logDateString)}
                  </span>
                </div>
                {log.bookTitle && (
                  <p className="text-xs mt-1 opacity-80 truncate">
                    {log.bookTitle}
                    {log.bookAuthor && ` by ${log.bookAuthor}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
