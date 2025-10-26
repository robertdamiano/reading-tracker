"use client";

import {useState, useEffect} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "@/lib/firebase/client";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "streak" | "pages" | "minutes" | "books";
  target: number;
  current: number;
  isCompleted: boolean;
}

interface Stats {
  currentStreak: number;
  totalMinutes: number;
  totalPages: number;
  totalBooks: number;
}

function calculateStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;

  let streak = 1;

  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const prev = new Date(sortedDates[i] + 'T00:00:00Z');
    const curr = new Date(sortedDates[i + 1] + 'T00:00:00Z');
    const dayDiff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function generateAchievements(stats: Stats): Achievement[] {
  const achievements: Achievement[] = [
    // Streak milestones - much harder goals
    {id: "streak-1000", name: "Millennium Reader", description: "1,000 day reading streak", icon: "👑", category: "streak", target: 1000, current: stats.currentStreak, isCompleted: stats.currentStreak >= 1000},
    {id: "streak-1200", name: "Streak Titan", description: "1,200 day reading streak", icon: "🔥", category: "streak", target: 1200, current: stats.currentStreak, isCompleted: stats.currentStreak >= 1200},
    {id: "streak-1500", name: "Dedication Master", description: "1,500 day reading streak", icon: "⭐", category: "streak", target: 1500, current: stats.currentStreak, isCompleted: stats.currentStreak >= 1500},
    {id: "streak-2000", name: "Unstoppable Force", description: "2,000 day reading streak", icon: "💎", category: "streak", target: 2000, current: stats.currentStreak, isCompleted: stats.currentStreak >= 2000},
    {id: "streak-2500", name: "Reading Legend", description: "2,500 day reading streak", icon: "🌟", category: "streak", target: 2500, current: stats.currentStreak, isCompleted: stats.currentStreak >= 2500},
    {id: "streak-3000", name: "Epic Dedication", description: "3,000 day reading streak", icon: "🏆", category: "streak", target: 3000, current: stats.currentStreak, isCompleted: stats.currentStreak >= 3000},

    // Page milestones - much harder goals
    {id: "pages-15000", name: "Literary Giant", description: "Read 15,000 pages", icon: "📗", category: "pages", target: 15000, current: stats.totalPages, isCompleted: stats.totalPages >= 15000},
    {id: "pages-20000", name: "Page Master", description: "Read 20,000 pages", icon: "📕", category: "pages", target: 20000, current: stats.totalPages, isCompleted: stats.totalPages >= 20000},
    {id: "pages-25000", name: "Reading Machine", description: "Read 25,000 pages", icon: "📚", category: "pages", target: 25000, current: stats.totalPages, isCompleted: stats.totalPages >= 25000},
    {id: "pages-30000", name: "Page Emperor", description: "Read 30,000 pages", icon: "👑", category: "pages", target: 30000, current: stats.totalPages, isCompleted: stats.totalPages >= 30000},
    {id: "pages-50000", name: "Legendary Reader", description: "Read 50,000 pages", icon: "💎", category: "pages", target: 50000, current: stats.totalPages, isCompleted: stats.totalPages >= 50000},

    // Minute milestones - much harder goals
    {id: "minutes-15000", name: "Timeless Reader", description: "Read for 15,000 minutes", icon: "🕐", category: "minutes", target: 15000, current: stats.totalMinutes, isCompleted: stats.totalMinutes >= 15000},
    {id: "minutes-20000", name: "Time Lord", description: "Read for 20,000 minutes", icon: "⏰", category: "minutes", target: 20000, current: stats.totalMinutes, isCompleted: stats.totalMinutes >= 20000},
    {id: "minutes-25000", name: "Marathon Reader", description: "Read for 25,000 minutes", icon: "⏱️", category: "minutes", target: 25000, current: stats.totalMinutes, isCompleted: stats.totalMinutes >= 25000},
    {id: "minutes-30000", name: "Time Champion", description: "Read for 30,000 minutes", icon: "⌚", category: "minutes", target: 30000, current: stats.totalMinutes, isCompleted: stats.totalMinutes >= 30000},
    {id: "minutes-50000", name: "Eternal Reader", description: "Read for 50,000 minutes", icon: "🌟", category: "minutes", target: 50000, current: stats.totalMinutes, isCompleted: stats.totalMinutes >= 50000},

    // Book milestones - much harder goals
    {id: "books-250", name: "Literary Master", description: "Finished 250 books", icon: "🏆", category: "books", target: 250, current: stats.totalBooks, isCompleted: stats.totalBooks >= 250},
    {id: "books-300", name: "Book Conqueror", description: "Finished 300 books", icon: "📘", category: "books", target: 300, current: stats.totalBooks, isCompleted: stats.totalBooks >= 300},
    {id: "books-350", name: "Reading Virtuoso", description: "Finished 350 books", icon: "📙", category: "books", target: 350, current: stats.totalBooks, isCompleted: stats.totalBooks >= 350},
    {id: "books-400", name: "Bibliophile Elite", description: "Finished 400 books", icon: "📔", category: "books", target: 400, current: stats.totalBooks, isCompleted: stats.totalBooks >= 400},
    {id: "books-500", name: "Grand Library", description: "Finished 500 books", icon: "👑", category: "books", target: 500, current: stats.totalBooks, isCompleted: stats.totalBooks >= 500},
  ];

  return achievements;
}

export function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        setLoading(true);
        setError(null);

        const readerId = "luke";
        const logsRef = collection(db, `readers/${readerId}/logs`);
        const snapshot = await getDocs(logsRef);

        const totals = {
          minutes: 0,
          pages: 0,
          books: 0
        };

        const uniqueDates = new Set<string>();

        snapshot.forEach(doc => {
          const data = doc.data();

          if (data.logType === "minutes") {
            totals.minutes += data.value;
          } else if (data.logType === "pages") {
            totals.pages += data.value;
          } else if (data.logType === "books") {
            totals.books += data.value;
          }

          if (data.logDateString) {
            uniqueDates.add(data.logDateString);
          }
        });

        const sortedDates = Array.from(uniqueDates).sort();
        const currentStreak = calculateStreak(sortedDates);

        const stats: Stats = {
          currentStreak,
          totalMinutes: totals.minutes,
          totalPages: totals.pages,
          totalBooks: totals.books
        };

        setAchievements(generateAchievements(stats));

      } catch (err) {
        console.error("Failed to fetch achievements:", err);
        setError("Failed to load achievements");
      } finally {
        setLoading(false);
      }
    }

    void fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-4">Achievements</h2>
        <p className="text-sm text-amber-700 dark:text-amber-500">Loading achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-4">Achievements</h2>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const completedAchievements = achievements.filter(a => a.isCompleted);
  const inProgressAchievements = achievements.filter(a => !a.isCompleted).slice(0, 3);

  return (
    <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400">Achievements</h2>
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
          {completedAchievements.length} / {achievements.length}
        </span>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {/* Completed Achievements */}
        {completedAchievements.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-500 mb-2">Unlocked</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {completedAchievements.map(achievement => (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700"
                  title={`${achievement.description} (${achievement.current.toLocaleString()} / ${achievement.target.toLocaleString()})`}
                >
                  <span className="text-2xl mb-1">{achievement.icon}</span>
                  <span className="text-xs font-medium text-slate-900 dark:text-amber-300 text-center">{achievement.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Achievements to Unlock */}
        {inProgressAchievements.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-500 mb-2">In Progress</h3>
            <div className="space-y-2">
              {inProgressAchievements.map(achievement => {
                const progress = Math.min(100, (achievement.current / achievement.target) * 100);
                return (
                  <div key={achievement.id} className="p-3 rounded-lg bg-slate-50 dark:bg-neutral-700/50 border border-slate-200 dark:border-neutral-600">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg opacity-50">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-amber-300">{achievement.name}</p>
                        <p className="text-xs text-slate-500 dark:text-neutral-400">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-neutral-400 mb-1">
                        <span>{achievement.current.toLocaleString()}</span>
                        <span>{achievement.target.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-neutral-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 h-2 rounded-full transition-all"
                          style={{width: `${progress}%`}}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
