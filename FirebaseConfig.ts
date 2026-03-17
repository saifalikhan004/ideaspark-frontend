// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth } from "firebase/auth";
import { Platform } from "react-native";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBnGrwFDNWikQtIJs8fAIE1oG4jCKZW8k",
  authDomain: "ideaspark-saif.firebaseapp.com",
  projectId: "ideaspark-saif",
  storageBucket: "ideaspark-saif.firebasestorage.app",
  messagingSenderId: "1014333711036",
  appId: "1:1014333711036:web:298c96940b650ac7dfa6b9",
  measurementId: "G-D0ZXX9B3EE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestoreDB = getFirestore(app);

// Configure auth persistence based on platform
let authPersistence: any = undefined;

if (Platform.OS === "web") {
  // Web uses browser local storage - import dynamically
  authPersistence = undefined; // Firebase will use default for web
} else {
  // React Native uses AsyncStorage
  const { getReactNativePersistence } = require("firebase/auth");
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  authPersistence = getReactNativePersistence(AsyncStorage);
}

export const firebaseAuth = initializeAuth(app, {
  persistence: authPersistence
});