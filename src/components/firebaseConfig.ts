// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TUTAJ WKLEJ DANE Z KONSOLI FIREBASE:
const firebaseConfig = {
  apiKey: "AIzaSyARqb5dClJzZPdVSDRQXQl5MO9q2Ewz9UI",
  authDomain: "biomistrz-5d386.firebaseapp.com",
  projectId: "biomistrz-5d386",
  storageBucket: "biomistrz-5d386.firebasestorage.app",
  messagingSenderId: "587140568626",
  appId: "1:587140568626:web:772f7913910be983524e2b",
  measurementId: "G-ZC9TRFV63Z"
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);

// Eksportujemy usługi, żeby używać ich w App.tsx i innych plikach
export const auth = getAuth(app);
export const db = getFirestore(app);