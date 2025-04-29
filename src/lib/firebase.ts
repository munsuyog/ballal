// lib/firebase.ts
'use client';

// Use dynamic imports to ensure Firebase is only loaded in the browser context
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Replace with your actual Firebase config for production
const firebaseConfig = {

};


// Initialize Firebase
let app;
let db;
let auth;
let storage;

// Only initialize Firebase on the client side
if (typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

// Export auth utilities
export { app, db, auth, storage };

// Mock implementations for server-side rendering
if (typeof window === 'undefined') {
  module.exports = {
    app: null,
    db: {
      collection: () => ({}),
      doc: () => ({}),
    },
    auth: {
      currentUser: null,
      onAuthStateChanged: () => () => {},
    },
    storage: {
      ref: () => ({}),
    },
  };
}