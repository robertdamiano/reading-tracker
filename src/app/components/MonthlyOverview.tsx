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
      <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-amber-900 mb-4">Monthly Overview</h2>
        <p className="text-sm text-amber-700">Loading overview...</p>
      </div>
    );
  }

  if (error || !monthlyData) {
    return (
      <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-amber-900 mb-4">Monthly Overview</h2>
        <p className="text-sm text-red-600">{error || "Failed to load monthly overview"}</p>
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
    <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-amber-900">Monthly Overview</h2>
        <span className="text-sm font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          {monthName}
        </span>
      </div>

      {/* Monthly Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <p className="text-xs font-semibold text-blue-700 mb-1">Minutes</p>
          <p className="text-2xl font-bold text-blue-900">{monthlyData.totalMinutes.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <p className="text-xs font-semibold text-green-700 mb-1">Pages</p>
          <p className="text-2xl font-bold text-green-900">{monthlyData.totalPages.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <p className="text-xs font-semibold text-purple-700 mb-1">Books</p>
          <p className="text-2xl font-bold text-purple-900">{monthlyData.totalBooks}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">Days Logged</p>
          <p className="text-2xl font-bold text-amber-900">{monthlyData.daysLogged} / {currentDay}</p>
        </div>
      </div>

      {/* Completion Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold text-amber-900">Month Progress</span>
          <span className="font-bold text-amber-700">{Math.round(streakPercentage)}%</span>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all shadow-inner"
            style={{width: `${streakPercentage}%`}}
          />
        </div>
        <p className="text-xs text-amber-700 mt-2">
          {monthlyData.daysLogged === currentDay
            ? "Perfect! Every day logged this month! 🎉"
            : `${currentDay - monthlyData.daysLogged} ${currentDay - monthlyData.daysLogged === 1 ? 'day' : 'days'} missing`}
        </p>
      </div>

      {/* Calendar Heatmap */}
      <div>
        <h3 className="text-sm font-semibold text-amber-800 mb-3">Calendar</h3>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-amber-700 mb-1">
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
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : isLogged
                    ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-md hover:shadow-lg'
                    : 'bg-red-100 text-red-700 border border-red-200'
                } ${isToday ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
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
