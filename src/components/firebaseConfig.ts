// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
// ZMIANA 1: Dodaj import initializeFirestore
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
  apiKey: "AIzaSyARqb5dClJzZPdVSDRQXQl5MO9q2Ewz9UI",
  authDomain: "biomistrz-5d386.firebaseapp.com",
  projectId: "biomistrz-5d386",
  storageBucket: "biomistrz-5d386.firebasestorage.app",
  messagingSenderId: "587140568626",
  appId: "1:587140568626:web:772f7913910be983524e2b",
  measurementId: "G-ZC9TRFV63Z"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence
});

// ZMIANA 2: Konfiguracja bazy danych pod Androida
// Androidowe WebView czasem blokuje WebSockety. To ustawienie to naprawia.
let db;

if (Capacitor.isNativePlatform()) {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // <--- TO JEST KLUCZ DO SUKCESU NA ANDROIDZIE
  });
} else {
  db = getFirestore(app);
}

export { db };