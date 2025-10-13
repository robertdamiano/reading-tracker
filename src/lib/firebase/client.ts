"use client";

import {getApp, getApps, initializeApp, type FirebaseOptions} from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

const requiredConfig: Record<string, string | undefined> = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const optionalConfig: Record<string, string | undefined> = {
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missingKeys = Object.entries(requiredConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing Firebase configuration. Set the following env vars: ${missingKeys.join(", ")}`,
  );
}

const firebaseConfig: FirebaseOptions = {
  apiKey: requiredConfig.apiKey!,
  authDomain: requiredConfig.authDomain!,
  projectId: requiredConfig.projectId!,
  appId: requiredConfig.appId!,
};

if (optionalConfig.storageBucket) {
  firebaseConfig.storageBucket = optionalConfig.storageBucket;
}

if (optionalConfig.messagingSenderId) {
  firebaseConfig.messagingSenderId = optionalConfig.messagingSenderId;
}

if (optionalConfig.measurementId) {
  firebaseConfig.measurementId = optionalConfig.measurementId;
}

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export {firebaseApp};
