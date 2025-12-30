// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
// CHANGE: Import initializeAuth and persistence instead of just getAuth
import { initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// YOUR FIREBASE CONFIG:
const firebaseConfig = {
  apiKey: "AIzaSyARqb5dClJzZPdVSDRQXQl5MO9q2Ewz9UI",
  authDomain: "biomistrz-5d386.firebaseapp.com",
  projectId: "biomistrz-5d386",
  storageBucket: "biomistrz-5d386.firebasestorage.app",
  messagingSenderId: "587140568626",
  appId: "1:587140568626:web:772f7913910be983524e2b",
  measurementId: "G-ZC9TRFV63Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// FIX FOR CAPACITOR:
// We use initializeAuth to explicitly set persistence to IndexedDB.
// This prevents the "gapi.iframes.getContext" crash on iOS/Android.
export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence
});

export const db = getFirestore(app);