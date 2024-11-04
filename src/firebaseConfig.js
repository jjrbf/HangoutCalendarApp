// Import the necessary functions from Firebase SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration object
const firebaseConfig = {
  //*initial*
};

// Initialize Firebase App
const firebase_app = initializeApp(firebaseConfig);

// Set up persistent Firebase Auth using AsyncStorage
export const auth = initializeAuth(firebase_app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Set up Firestore
export const db = getFirestore(firebase_app);

export default firebase_app;