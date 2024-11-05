// Import the necessary functions from Firebase SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, browserLocalPersistence, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Firebase configuration object
const firebaseConfig = {
  //*initial*
};

// Initialize Firebase App
const firebase_app = initializeApp(firebaseConfig);

let auth;
if (Platform.OS === "web") { // this is so that it works on expo web
  auth = getAuth(firebase_app);
  auth.setPersistence(browserLocalPersistence);
} else {
  auth = initializeAuth(firebase_app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

const db = getFirestore(firebase_app);

export { auth, db };

export default firebase_app;