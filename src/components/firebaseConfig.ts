// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { Firestore, initializeFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // <--- NOWY IMPORT


const firebaseConfig = {
  apiKey: "AIzaSyARqb5dClJzZPdVSDRQXQl5MO9q2Ewz9UI",
  authDomain: "biomistrz-5d386.firebaseapp.com",
  projectId: "biomistrz-5d386",
  databaseURL: "https://biomistrz-5d386-default-rtdb.europe-west1.firebasedatabase.app", // <--- ADRES TWOJEJ RTDB
  storageBucket: "biomistrz-5d386.firebasestorage.app",
  messagingSenderId: "587140568626",
  appId: "1:587140568626:web:772f7913910be983524e2b",
  measurementId: "G-ZC9TRFV63Z"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence
});

// Standardowy Firestore
export const db: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// NOWA BAZA: Realtime Database
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);