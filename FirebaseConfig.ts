// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "firebase/firestore"
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
const analytics = getAnalytics(app);
export const firestoreDB = getFirestore(app);