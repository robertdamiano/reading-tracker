import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";

import {AuthProvider} from "./providers/AuthProvider";
import {ThemeProvider} from "./providers/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reading Tracker",
  description: "Track and celebrate Luke's reading streaks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'system';
                let themeClass = 'light';

                if (theme === 'christmas') {
                  themeClass = 'christmas';
                } else if (theme === 'dark') {
                  themeClass = 'dark';
                } else if (theme === 'system') {
                  themeClass = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }

                document.documentElement.classList.add(themeClass);
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
