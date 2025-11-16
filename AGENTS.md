# Agent Development Notes

This file documents work completed by AI agents (Claude Code) and provides context for future agent sessions.

## Project Overview

Family reading tracker built with Next.js 15, TypeScript, Tailwind CSS, and Firebase. Tracks daily reading progress (minutes/pages/books) with achievements, activity feeds, and calendar visualizations.

## Architecture Decisions

### Tech Stack
- **Frontend**: Next.js 15 App Router with static export (`output: 'export'`)
- **Styling**: Tailwind CSS v4 with `@import "tailwindcss"` syntax
- **Database**: Firebase Firestore with client-side queries
- **Auth**: Firebase Authentication (email/password)
- **Hosting**: Firebase Hosting with clean URLs
- **Deployment**: GitHub Actions CI/CD on push to `main`

### Key Patterns

1. **Client-Side Data Fetching**
   - All components fetch from Firestore directly using `getDocs()`
   - Stats are calculated client-side (performant up to ~10K logs)
   - No API routes or server components needed for data access

2. **Dark Mode Implementation**
   - Uses Tailwind CSS v4 with `@variant dark` directive in globals.css
   - ThemeProvider manages theme state with three modes: light, dark, system
   - System mode (default) automatically detects OS preference via `matchMedia`
   - Theme preference stored in localStorage and persists across sessions
   - Toggle button in header cycles through: light ☀️ → dark 🌙 → system 💻
   - CSS variables defined in `src/app/globals.css` for both themes (.dark selector)
   - Blocking script in layout.tsx prevents flash of unstyled content

3. **Mobile Responsiveness**
   - Responsive padding: `p-4 sm:p-6` pattern throughout
   - Responsive gaps: `gap-4 sm:gap-6` for grids
   - Responsive horizontal padding: `px-4 sm:px-6` on containers
   - Fixed-height scrollable sections: `max-h-[500px] overflow-y-auto` for cards with variable content
   - Calendar uses `overflow-x-auto` wrapper with `min-w-[280px]` for small screens

4. **Component Structure**
   - All dashboard components are client components (`"use client"`)
   - Loading/error states use same styling as main component
   - Consistent card styling: `rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-stone-800/30 p-4 sm:p-6 shadow-xl backdrop-blur-sm`

5. **Authentication Flow**
   - Login page at `/login` with redirect support via `?redirectTo=` param
   - Home page (`/`) redirects to login if not authenticated
   - Auth state managed by `AuthProvider` context
   - Allowed emails controlled via `NEXT_PUBLIC_ALLOWED_EMAILS` env var

## Data Model

### Firestore Structure
```
readers/
  {readerId}/           // e.g., "reader-a"
    logs/
      {autoId}/
        readerId: string
        logDate: Timestamp
        logDateString: string  // "YYYY-MM-DD"
        logType: "minutes" | "pages" | "books"
        value: number
        bookTitle?: string
        bookAuthor?: string
        source: {
          name: string
          details: string
        }
        createdAt: Timestamp
        updatedAt: Timestamp
        createdBy: string (email)
        updatedBy: string (email)
```

### Streak Calculation
- Consecutive days counting backward from most recent entry
- Based on unique `logDateString` values (multiple entries per day = 1 day)
- Gaps break the streak
- Implementation in `src/app/components/ReadingStats.tsx:20-40`

## Component Files

### Core Components
- `src/app/page.tsx` - Main dashboard with grid layout
- `src/app/login/page.tsx` - Authentication page
- `src/app/components/ReadingLogForm.tsx` - Form for adding entries with autocomplete
- `src/app/components/ReadingStats.tsx` - Current streak and totals
- `src/app/components/Achievements.tsx` - 20 milestone badges (5 unlocked, showing 3 in-progress)
- `src/app/components/RecentActivity.tsx` - Last 10 reading entries
- `src/app/components/MonthlyOverview.tsx` - Calendar heatmap + monthly stats

### Shared Resources
- `src/lib/firebase/client.ts` - Firebase web SDK initialization
- `src/app/providers/AuthProvider.tsx` - Auth context provider
- `src/app/providers/ThemeProvider.tsx` - Theme context provider with toggle logic
- `src/app/globals.css` - Global styles + dark theme variables

## Styling Guidelines

### Color Palette
**Light Theme:**
- Primary: Amber/orange gradients (`from-amber-700 to-orange-700`)
- Cards: White to amber-50 gradient
- Borders: Amber-200 with opacity
- Text: Amber-900 for headings, slate-700 for body

**Dark Theme:**
- Primary: Lighter amber/orange (`from-amber-400 to-orange-400`)
- Cards: Neutral-800 to stone-800 gradient
- Borders: Amber-800 with opacity
- Text: Amber-400 for headings, neutral-300 for body

### Book Theme Elements
- Decorative book emojis (📚📖📕📗) with `opacity-5 dark:opacity-10`
- Warm, cozy feel with rounded corners (`rounded-2xl`)
- Soft shadows and backdrop blur effects
- Animated book icon on login page (`animate-bounce-slow`)

## Import Scripts

Located in `scripts/` directory:
- `fresh-import.js` - Clear all logs and import from CSV
- `import-csv.js` - Additive import
- `verify-data.js` - Calculate and display all statistics
- `calculate-full-streak.js` - Detailed streak analysis
- `check-streak.js` - Show recent activity
- `debug-totals.js` - Breakdown by type
- `import-pdf.js` - Parses Beanstack “Log Summary” PDFs and writes entries to `readers/<readerId>/logs`. Usage:
  ```bash
  node scripts/import-pdf.js path/to/Log-Summary-ReaderA.pdf reader-a --dry-run
  node scripts/import-pdf.js path/to/Log-Summary-ReaderB.pdf reader-b
  ```
  The parser handles multi-line titles/authors and page breaks internally, so no external helper repo is needed. Remove `--dry-run` to write data; each run also records `importBatches` metadata.

All require Firebase service account key (gitignored).

## Deployment

### Automatic (Recommended)
Push to `main` branch triggers GitHub Actions workflow:
1. Lints code
2. Builds Next.js static export
3. Deploys to Firebase (Hosting, Functions, Firestore rules)

### Required GitHub Secrets
- `GOOGLE_APPLICATION_CREDENTIALS` - Service account JSON
- `NEXT_PUBLIC_FIREBASE_*` - All Firebase config values

### Manual Deployment
```bash
npm run firebase:deploy
```

## Known Patterns & Conventions

1. **Reader Selection**: Dashboard routing supports multiple reader IDs via `/dashboard/[readerId]`, but the legacy default logic still falls back to the first allowed reader when no explicit selection is provided.

2. **Environment Variables**:
   - All Firebase config exposed via `NEXT_PUBLIC_*` (safe for client-side)
   - Allowed emails list in `NEXT_PUBLIC_ALLOWED_EMAILS` (comma-separated)

3. **Autocomplete**: Book title and author fields use Firestore data for suggestions (fetched on mount)

4. **Date Handling**:
   - Always use `YYYY-MM-DD` format for `logDateString`
   - Store `logDate` as Firestore Timestamp
   - Use `T00:00:00Z` suffix when parsing date strings
   - **IMPORTANT**: Use `formatLocalDate()` helper to format dates in local timezone (not UTC) to prevent timezone offset bugs
   - Never use `new Date().toISOString().split("T")[0]` as it returns UTC date which may differ from user's local date

5. **Responsive Breakpoints**:
   - `sm:` - 640px and up (small tablets)
   - `md:` - 768px and up (tablets, 2-column layouts)
   - No `lg` or `xl` currently used (max-w-7xl container handles this)

## Testing Recommendations

When testing changes:
1. **Auth Flow**: Test login, auto-redirect, sign-out
2. **Dark Mode**: Toggle system theme and verify all components adapt
3. **Mobile**: Test at 375px, 414px, and 768px widths
4. **Data Loading**: Verify loading states and error handling
5. **Form Submission**: Add entry and verify it appears in Recent Activity

## Future Enhancements

- Performance: Materialize stats into `readers/{readerId}/dailyStats`
- Multi-reader: Add UI for selecting different family members
- Data export: CSV export functionality
- Book library: Track unique books with covers
- Reading goals: Monthly/yearly targets with progress

## Development Tips

1. **Local Development**: Dev server writes to production Firestore (no emulator config currently)

2. **Linting**: Always run `npm run lint` before committing

3. **Building**: Use `npm run build` to verify static export works (builds to `out/` directory)

4. **Component Edits**: When updating components, ensure loading/error states match styling

5. **Firebase CLI**: May have issues in WSL - prefer GitHub Actions for deployment

6. **Date Inputs**: HTML date inputs max at today via `max={formatLocalDate(new Date())}`

## Common Issues & Solutions

**Issue**: Date input showing tomorrow's date for users in certain timezones
**Solution**: Use `formatLocalDate(new Date())` instead of `new Date().toISOString().split("T")[0]` - the ISO method returns UTC time which can be a different day than local time

**Issue**: Calendar cut off on mobile
**Solution**: Wrap in `overflow-x-auto` div with `min-w-[280px]` on grid

**Issue**: Components overflow container on mobile
**Solution**: Use responsive padding `p-4 sm:p-6` and horizontal padding `px-4 sm:px-6`

**Issue**: Dark mode toggle not working with Tailwind CSS v4
**Solution**: Tailwind v4 requires `@variant dark (&:where(.dark, .dark *));` directive in `globals.css` instead of `tailwind.config.js` configuration. Also ensure CSS variables use `.dark` class selector instead of `@media (prefers-color-scheme: dark)`

**Issue**: Build fails with "Component not found"
**Solution**: Ensure all imports use correct casing (Next.js is case-sensitive)

## Code Quality Standards

- Use TypeScript strict mode
- Follow Next.js 15 App Router conventions
- Prefer client components for Firestore queries
- Always handle loading and error states
- Use Tailwind classes (no custom CSS except globals)
- Keep components focused and single-responsibility
- Document complex logic with comments
- Use async/await with proper error handling
