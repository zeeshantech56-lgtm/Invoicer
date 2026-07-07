// src/lib/firebase.js
// Initializes Firebase App, Auth, and Firestore once (safe for Next.js hot-reload).

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Explicitly enforce local persistence to prevent session drops in mobile PWAs
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// The ONLY email allowed into /admin. Set this in your env vars.
// Checked again server-side by Firestore rules — this is not just a UI gate.
export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default app;
