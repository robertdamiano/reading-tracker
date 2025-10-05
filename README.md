# Reading Tracker

Family reading tracker built with Next.js 15 and Firebase. The dashboard requires Firebase email/password auth before it loads any data.

## Prerequisites

- Node.js 22+
- npm 10+
- Firebase CLI (`npx firebase --version`)
- Access to the Firebase project `reading-tracker-7a90d`

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and populate the Firebase web config plus the allowed email list:
   ```bash
   cp .env.local.example .env.local
   # Fill NEXT_PUBLIC_FIREBASE_* and NEXT_PUBLIC_ALLOWED_EMAILS
   ```
3. (Optional) Start the Functions + Firestore emulators in another terminal:
   ```bash
   npm --prefix functions run serve -- --only "functions,firestore"
   ```
4. Launch the Next.js dev server:
   ```bash
   npm run dev
   ```

## Authentication

Accounts are provisioned manually in Firebase Authentication. Create email/password users for the family members and list their emails in `NEXT_PUBLIC_ALLOWED_EMAILS` so the login screen accepts them. The app signs users out via the Firebase web SDK.

## Firebase Tooling

- Functions code lives in `functions/` and is written in TypeScript.
- Deploy Functions only:
  ```bash
  npm --prefix functions run deploy
  ```
- Run the Firebase emulators (Functions + Firestore):
  ```bash
  npm --prefix functions run serve -- --only "functions,firestore"
  ```
  When emulators are running, set `NEXT_PUBLIC_HELLO_ENDPOINT` in `.env.local` so the UI points at the local function.

## Deploying to Firebase

1. Build the static Next.js site:
   ```bash
   npm run build:static
   ```
2. Deploy Hosting, Functions, Firestore rules, and indexes:
   ```bash
   npm run firebase:deploy
   ```

## Next Steps

- Replace the placeholder dashboard with streak summaries and book highlights.
- Add a form so parents or Luke can log new reading sessions.
- Materialize daily totals/streak metadata for quick reads once UI demands it.
- Add automated tests for the auth flow and future data components.
