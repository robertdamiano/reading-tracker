"use client";

import {useState, useEffect} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "@/lib/firebase/client";

interface MonthlyData {
  year: number;
  month: number;
  totalMinutes: number;
  totalPages: number;
  totalBooks: number;
  daysLogged: number;
  daysInMonth: number;
  loggedDates: Set<string>;
}

function getCurrentMonth(): {year: number, month: number} {
  const now = new Date();
  return {year: now.getFullYear(), month: now.getMonth() + 1};
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function MonthlyOverview() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMonthlyData() {
      try {
        setLoading(true);
        setError(null);

        const {year, month} = getCurrentMonth();
        const daysInMonth = getDaysInMonth(year, month);

        const readerId = "luke";
        const logsRef = collection(db, `readers/${readerId}/logs`);
        const snapshot = await getDocs(logsRef);

        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

        const totals = {
          minutes: 0,
          pages: 0,
          books: 0
        };

        const loggedDates = new Set<string>();

        snapshot.forEach(doc => {
          const data = doc.data();

          // Only include logs from current month
          if (data.logDateString && data.logDateString.startsWith(monthPrefix)) {
            if (data.logType === "minutes") {
              totals.minutes += data.value;
            } else if (data.logType === "pages") {
              totals.pages += data.value;
            } else if (data.logType === "books") {
              totals.books += data.value;
            }

            loggedDates.add(data.logDateString);
          }
        });

        setMonthlyData({
          year,
          month,
          totalMinutes: totals.minutes,
          totalPages: totals.pages,
          totalBooks: totals.books,
          daysLogged: loggedDates.size,
          daysInMonth,
          loggedDates
        });

      } catch (err) {
        console.error("Failed to fetch monthly data:", err);
        setError("Failed to load monthly overview");
      } finally {
        setLoading(false);
      }
    }

    void fetchMonthlyData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-4">Monthly Overview</h2>
        <p className="text-sm text-amber-700 dark:text-amber-500">Loading overview...</p>
      </div>
    );
  }

  if (error || !monthlyData) {
    return (
      <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-4">Monthly Overview</h2>
        <p className="text-sm text-red-600 dark:text-red-400">{error || "Failed to load monthly overview"}</p>
      </div>
    );
  }

  const monthName = new Date(monthlyData.year, monthlyData.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const streakPercentage = (monthlyData.daysLogged / monthlyData.daysInMonth) * 100;

  // Generate calendar grid
  const firstDayOfMonth = new Date(monthlyData.year, monthlyData.month - 1, 1).getDay();
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add actual days of month
  for (let day = 1; day <= monthlyData.daysInMonth; day++) {
    calendarDays.push(day);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === monthlyData.year && (today.getMonth() + 1) === monthlyData.month;
  const currentDay = isCurrentMonth ? today.getDate() : monthlyData.daysInMonth;

  return (
    <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400">Monthly Overview</h2>
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
          {monthName}
        </span>
      </div>

      {/* Monthly Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Minutes</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{monthlyData.totalMinutes.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl border border-green-200 dark:border-green-700">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Pages</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">{monthlyData.totalPages.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">Books</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{monthlyData.totalBooks}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 p-4 rounded-xl border border-amber-200 dark:border-amber-700">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Days Logged</p>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">{monthlyData.daysLogged} / {currentDay}</p>
        </div>
      </div>

      {/* Completion Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold text-amber-900 dark:text-amber-400">Month Progress</span>
          <span className="font-bold text-amber-700 dark:text-amber-500">{Math.round(streakPercentage)}%</span>
        </div>
        <div className="w-full bg-amber-100 dark:bg-amber-900/30 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 h-3 rounded-full transition-all shadow-inner"
            style={{width: `${streakPercentage}%`}}
          />
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-500 mt-2">
          {monthlyData.daysLogged === currentDay
            ? "Perfect! Every day logged this month! 🎉"
            : `${currentDay - monthlyData.daysLogged} ${currentDay - monthlyData.daysLogged === 1 ? 'day' : 'days'} missing`}
        </p>
      </div>

      {/* Calendar Heatmap */}
      <div className="overflow-x-auto -mx-2 px-2">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-500 mb-3">Calendar</h3>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 min-w-[280px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-amber-700 dark:text-amber-500 mb-1">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = `${monthlyData.year}-${String(monthlyData.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isLogged = monthlyData.loggedDates.has(dateStr);
            const isToday = isCurrentMonth && day === today.getDate();
            const isFuture = isCurrentMonth && day > today.getDate();

            return (
              <div
                key={day}
                className={`aspect-square flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                  isFuture
                    ? 'bg-slate-100 dark:bg-neutral-700 text-slate-400 dark:text-neutral-500 cursor-not-allowed'
                    : isLogged
                    ? 'bg-gradient-to-br from-green-400 to-green-500 dark:from-green-600 dark:to-green-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
                } ${isToday ? 'ring-2 ring-amber-400 dark:ring-amber-500 ring-offset-2 dark:ring-offset-neutral-800' : ''}`}
                title={isFuture ? 'Future date' : isLogged ? `Logged on ${dateStr}` : `Missing entry for ${dateStr}`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
