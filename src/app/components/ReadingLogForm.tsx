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
      setLogDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      console.error("Failed to save reading log:", error);
      setMessage({type: "error", text: "Failed to save reading log. Please try again."});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-xl backdrop-blur-sm">
      <h2 className="text-xl font-bold text-amber-900 mb-4">Log Reading Session</h2>

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

        <div className="relative">
          <label htmlFor="bookTitle" className="block text-sm font-medium text-slate-700 mb-1">
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {showTitleSuggestions && titleSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
              {titleSuggestions.map((book, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBookTitle(book.title);
                    setBookAuthor(book.author);
                    setShowTitleSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                >
                  <div className="font-medium text-slate-900">{book.title}</div>
                  <div className="text-xs text-slate-500">{book.author}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label htmlFor="bookAuthor" className="block text-sm font-medium text-slate-700 mb-1">
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {showAuthorSuggestions && authorSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
              {authorSuggestions.map((author, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBookAuthor(author);
                    setShowAuthorSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
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
