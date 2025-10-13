"use client";

import {useState} from "react";
import {collection, addDoc, serverTimestamp} from "firebase/firestore";
import {db} from "@/lib/firebase/client";
import {useAuth} from "../providers/AuthProvider";

type LogType = "minutes" | "pages" | "books";

export function ReadingLogForm() {
  const {user} = useAuth();
  const [logDate, setLogDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [logType, setLogType] = useState<LogType>("minutes");
  const [value, setValue] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: "success" | "error"; text: string} | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user?.email) {
      setMessage({type: "error", text: "You must be signed in to log reading"});
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      setMessage({type: "error", text: "Please enter a valid positive number"});
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const readerId = "luke"; // TODO: make this dynamic when supporting multiple readers
      const logsRef = collection(db, `readers/${readerId}/logs`);

      const logData = {
        readerId,
        logDate: new Date(`${logDate}T00:00:00Z`),
        logDateString: logDate,
        logType,
        value: numericValue,
        source: {
          name: "web-form",
          details: "Manual entry via reading log form",
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.email,
        updatedBy: user.email,
      };

      // Add optional book metadata if provided
      if (bookTitle.trim()) {
        Object.assign(logData, {bookTitle: bookTitle.trim()});
      }
      if (bookAuthor.trim()) {
        Object.assign(logData, {bookAuthor: bookAuthor.trim()});
      }

      await addDoc(logsRef, logData);

      setMessage({type: "success", text: "Reading log saved successfully!"});

      // Reset form
      setValue("");
      setBookTitle("");
      setBookAuthor("");
      setLogDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      console.error("Failed to save reading log:", error);
      setMessage({type: "error", text: "Failed to save reading log. Please try again."});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Log Reading Session</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="logDate" className="block text-sm font-medium text-slate-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="logDate"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="logType" className="block text-sm font-medium text-slate-700 mb-1">
            Type
          </label>
          <select
            id="logType"
            value={logType}
            onChange={(e) => setLogType(e.target.value as LogType)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="minutes">Minutes</option>
            <option value="pages">Pages</option>
            <option value="books">Books</option>
          </select>
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium text-slate-700 mb-1">
            Value
          </label>
          <input
            type="number"
            id="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min="0"
            step={logType === "books" ? "1" : "0.1"}
            required
            placeholder={logType === "books" ? "1" : "30"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="bookTitle" className="block text-sm font-medium text-slate-700 mb-1">
            Book Title <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            id="bookTitle"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="The Hobbit"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="bookAuthor" className="block text-sm font-medium text-slate-700 mb-1">
            Book Author <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            id="bookAuthor"
            value={bookAuthor}
            onChange={(e) => setBookAuthor(e.target.value)}
            placeholder="J.R.R. Tolkien"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save Reading Log"}
        </button>
      </form>
    </div>
  );
}
