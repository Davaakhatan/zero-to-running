import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Re-export User type for convenience
export type { User };

// Firebase configuration from environment variables with fallbacks for development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://demo-project-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:demo",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMO"
};

// Check if we're using demo values and warn the user
const isDemoConfig = firebaseConfig.apiKey === "demo-api-key";
if (isDemoConfig) {
  console.warn('⚠️  Using demo Firebase configuration. Please set up your .env file with real Firebase credentials for full functionality.');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Realtime Database with error handling
let rtdbInstance;
try {
  rtdbInstance = getDatabase(app);
} catch (error) {
  console.warn('Realtime Database initialization failed:', error);
  console.warn('Multiplayer cursors and presence features will be disabled');
  // Create a mock database for development
  rtdbInstance = null;
}
export const rtdb = rtdbInstance;

// Set auth persistence to LOCAL (survives page refreshes and browser restarts)
// Use a global flag to prevent multiple auth persistence initializations during HMR
if (!(window as any).__authPersistenceEnabled) {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn("Failed to set auth persistence:", error.message);
  });
  (window as any).__authPersistenceEnabled = true;
}

// Optional: offline cache for Firestore using new cache settings
// Use a global flag to prevent multiple persistence initializations during HMR
if (!(window as any).__firestorePersistenceEnabled) {
  try {
    // Use the new cache settings instead of deprecated enableIndexedDbPersistence
    import('firebase/firestore').then(({ enableMultiTabIndexedDbPersistence }) => {
      enableMultiTabIndexedDbPersistence(db).catch((error) => {
        // Ignore errors for multi-tab scenarios and HMR
        if (error.code === 'failed-precondition') {
          console.warn('Firestore persistence already enabled in another tab');
        } else if (error.code === 'unimplemented') {
          console.warn('Firestore persistence not supported in this environment');
        } else {
          console.warn('Firestore persistence setup failed:', error.message);
        }
      });
    });
    (window as any).__firestorePersistenceEnabled = true;
  } catch (error) {
    console.warn('Firestore persistence setup failed:', error);
  }
}
