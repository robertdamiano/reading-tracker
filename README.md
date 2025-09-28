# Reading Tracker

Firebase-backed web app scaffold for tracking reading streaks. This first iteration renders a simple dashboard page that fetches a "hello world" message stored in Cloud Firestore via a Cloud Function.

## Prerequisites

- Node.js 22+
- npm 10+
- Firebase CLI (`npx firebase --version`)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file and update it if you plan to use the Firebase emulators:
   ```bash
   cp .env.local.example .env.local
   # Update NEXT_PUBLIC_HELLO_ENDPOINT to match the Functions emulator URL when needed
   ```
3. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
   The UI fetches from `NEXT_PUBLIC_HELLO_ENDPOINT` (defaults to `/api/hello`). Without emulators running this will call the deployed Cloud Function.

## Firebase Tooling

- Functions code lives in `functions/` and is written in TypeScript.
- Deploy Functions only:
  ```bash
  npm --prefix functions run deploy
  ```
- Run the Firebase emulators (Functions + Firestore):
  ```bash
  npm --prefix functions run serve
  ```
  When emulators are running, point the web app at the local function by setting `NEXT_PUBLIC_HELLO_ENDPOINT` in `.env.local`.

## Deploying to Firebase

1. Build the static Next.js site and export it:
   ```bash
   npm run build:static
   ```
   This generates the `out/` directory consumed by Firebase Hosting.
2. Deploy Hosting and Functions:
   ```bash
   npm run firebase:deploy
   ```
   The script first rebuilds the static site, then runs `firebase deploy` using the logged-in account and the default project (`reading-tracker-7a90d`).

## Next Steps

- Replace the placeholder dashboard with real streak analytics.
- Expand auth (email/password) through Firebase Authentication.
- Model reading entries in Firestore and surface them in the UI.
