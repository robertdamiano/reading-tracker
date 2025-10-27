"use client";

import {useState, useEffect} from "react";
import {collection, addDoc, serverTimestamp, getDocs} from "firebase/firestore";
import {db} from "@/lib/firebase/client";
import {useAuth} from "../providers/AuthProvider";

type LogType = "minutes" | "pages" | "books";

interface Book {
  title: string;
  author: string;
}

/**
 * Format date as YYYY-MM-DD in local timezone (not UTC)
 * Prevents timezone offset issues where UTC date differs from local date
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ReadingLogForm() {
  const {user} = useAuth();
  const [logDate, setLogDate] = useState(() => formatLocalDate(new Date()));
  const [logType, setLogType] = useState<LogType>("minutes");
  const [value, setValue] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: "success" | "error"; text: string} | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [titleSuggestions, setTitleSuggestions] = useState<Book[]>([]);
  const [authorSuggestions, setAuthorSuggestions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);

  // Fetch unique books on mount
  useEffect(() => {
    async function fetchBooks() {
      try {
        const readerId = "luke";
        const logsRef = collection(db, `readers/${readerId}/logs`);
        const snapshot = await getDocs(logsRef);

        const booksMap = new Map<string, Book>();

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.bookTitle && data.bookAuthor) {
            const key = `${data.bookTitle}|${data.bookAuthor}`;
            if (!booksMap.has(key)) {
              booksMap.set(key, {
                title: data.bookTitle,
                author: data.bookAuthor
              });
            }
          }
        });

        setBooks(Array.from(booksMap.values()));
      } catch (error) {
        console.error("Failed to fetch books:", error);
      }
    }

    void fetchBooks();
  }, []);

  // Filter title suggestions as user types
  useEffect(() => {
    if (bookTitle.trim().length > 0) {
      const filtered = books.filter(book =>
        book.title.toLowerCase().includes(bookTitle.toLowerCase())
      );
      setTitleSuggestions(filtered);
    } else {
      setTitleSuggestions([]);
    }
  }, [bookTitle, books]);

  // Filter author suggestions as user types
  useEffect(() => {
    if (bookAuthor.trim().length > 0) {
      const uniqueAuthors = [...new Set(books.map(b => b.author))];
      const filtered = uniqueAuthors.filter(author =>
        author.toLowerCase().includes(bookAuthor.toLowerCase())
      );
      setAuthorSuggestions(filtered);
    } else {
      setAuthorSuggestions([]);
    }
  }, [bookAuthor, books]);

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

      // Add book metadata
      Object.assign(logData, {
        bookTitle: bookTitle.trim(),
        bookAuthor: bookAuthor.trim()
      });

      await addDoc(logsRef, logData);

      setMessage({type: "success", text: "Reading log saved successfully!"});

      // Reset form
      setValue("");
      setBookTitle("");
      setBookAuthor("");
      setLogDate(formatLocalDate(new Date()));
    } catch (error) {
      console.error("Failed to save reading log:", error);
      setMessage({type: "error", text: "Failed to save reading log. Please try again."});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative z-20 rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 halloween:border-orange-500/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 halloween:from-purple-950 halloween:to-orange-950/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm overflow-visible">
      <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400 halloween:text-orange-500 mb-4">Log Reading Session</h2>

      <form onSubmit={handleSubmit} className="space-y-4 overflow-visible">
        <div>
          <label htmlFor="logDate" className="block text-sm font-medium text-slate-700 dark:text-neutral-300 halloween:text-orange-300 mb-1">
            Date
          </label>
          <input
            type="date"
            id="logDate"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            max={formatLocalDate(new Date())}
            required
            className="w-full rounded-md border border-slate-300 dark:border-neutral-600 halloween:border-orange-700 bg-white dark:bg-neutral-700 halloween:bg-purple-900/80 text-slate-900 dark:text-neutral-100 halloween:text-orange-200 px-3 py-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 halloween:focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 halloween:focus:ring-orange-500"
          />
        </div>

        <div>
          <label htmlFor="logType" className="block text-sm font-medium text-slate-700 dark:text-neutral-300 halloween:text-orange-300 mb-1">
            Type
          </label>
          <select
            id="logType"
            value={logType}
            onChange={(e) => setLogType(e.target.value as LogType)}
            className="w-full rounded-md border border-slate-300 dark:border-neutral-600 halloween:border-orange-700 bg-white dark:bg-neutral-700 halloween:bg-purple-900/80 text-slate-900 dark:text-neutral-100 halloween:text-orange-200 px-3 py-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 halloween:focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 halloween:focus:ring-orange-500"
          >
            <option value="minutes">Minutes</option>
            <option value="pages">Pages</option>
            <option value="books">Books</option>
          </select>
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium text-slate-700 dark:text-neutral-300 halloween:text-orange-300 mb-1">
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
            className="w-full rounded-md border border-slate-300 dark:border-neutral-600 halloween:border-orange-700 bg-white dark:bg-neutral-700 halloween:bg-purple-900/80 text-slate-900 dark:text-neutral-100 halloween:text-orange-200 px-3 py-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 halloween:focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 halloween:focus:ring-orange-500"
          />
        </div>

        <div className="relative">
          <label htmlFor="bookTitle" className="block text-sm font-medium text-slate-700 dark:text-neutral-300 halloween:text-orange-300 mb-1">
            Book Title
          </label>
          <input
            type="text"
            id="bookTitle"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            onFocus={() => setShowTitleSuggestions(true)}
            onBlur={() => setTimeout(() => setShowTitleSuggestions(false), 200)}
            placeholder="Harry Potter And The Half-Blood Prince"
            required
            className="w-full rounded-md border border-slate-300 dark:border-neutral-600 halloween:border-orange-700 bg-white dark:bg-neutral-700 halloween:bg-purple-900/80 text-slate-900 dark:text-neutral-100 halloween:text-orange-200 px-3 py-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 halloween:focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 halloween:focus:ring-orange-500"
          />
          {showTitleSuggestions && titleSuggestions.length > 0 && (
            <div className="absolute z-[9999] mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 shadow-lg">
              {titleSuggestions.map((book, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBookTitle(book.title);
                    setBookAuthor(book.author);
                    setShowTitleSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:outline-none"
                >
                  <div className="font-medium text-slate-900 dark:text-neutral-100">{book.title}</div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">{book.author}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label htmlFor="bookAuthor" className="block text-sm font-medium text-slate-700 dark:text-neutral-300 halloween:text-orange-300 mb-1">
            Book Author
          </label>
          <input
            type="text"
            id="bookAuthor"
            value={bookAuthor}
            onChange={(e) => setBookAuthor(e.target.value)}
            onFocus={() => setShowAuthorSuggestions(true)}
            onBlur={() => setTimeout(() => setShowAuthorSuggestions(false), 200)}
            placeholder="J. K. Rowling"
            required
            className="w-full rounded-md border border-slate-300 dark:border-neutral-600 halloween:border-orange-700 bg-white dark:bg-neutral-700 halloween:bg-purple-900/80 text-slate-900 dark:text-neutral-100 halloween:text-orange-200 px-3 py-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 halloween:focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 halloween:focus:ring-orange-500"
          />
          {showAuthorSuggestions && authorSuggestions.length > 0 && (
            <div className="absolute z-[9999] mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 shadow-lg">
              {authorSuggestions.map((author, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBookAuthor(author);
                    setShowAuthorSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-900 dark:text-neutral-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:outline-none"
                >
                  {author}
                </button>
              ))}
            </div>
          )}
        </div>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700"
                : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 dark:bg-blue-700 halloween:bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:hover:bg-blue-600 halloween:hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save Reading Log"}
        </button>
      </form>
    </div>
  );
}
