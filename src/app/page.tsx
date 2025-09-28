"use client";

import {useEffect, useState} from "react";

type HelloResponse = {
  message: string;
};

function resolveHelloEndpoint(): string {
  if (typeof window === "undefined") {
    return "/api/hello";
  }

  const hostname = window.location.hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocal) {
    return process.env.NEXT_PUBLIC_HELLO_ENDPOINT ?? "/api/hello";
  }

  return "/api/hello";
}

export default function Home() {
  const [message, setMessage] = useState<string>("Loading message...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMessage() {
      try {
        const endpoint = resolveHelloEndpoint();
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as HelloResponse;
        setMessage(data.message ?? "Hello world");
        setError(null);
      } catch (err) {
        console.error("Failed to load hello world message", err);
        setError("Could not load the greeting. Check your Functions emulator or deployment.");
      }
    }

    void loadMessage();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 py-16">
      <div className="mx-auto max-w-xl rounded-lg bg-white p-10 shadow">
        <h1 className="text-3xl font-semibold text-slate-900">Reading Tracker</h1>
        <p className="mt-4 text-slate-600">
          This is the starter dashboard. The greeting below is fetched from Firestore through a
          Firebase Cloud Function.
        </p>
        <div className="mt-8 rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : (
            <span className="text-xl font-medium text-slate-800">{message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
