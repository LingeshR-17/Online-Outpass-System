import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Extracted from index.html directly
const firebaseConfig = {
  apiKey: "AIzaSyCC0jpXAcOOlnFaXIaDEWJiIn9fnexvN7c",
  authDomain: "online-outpass-d513b.firebaseapp.com",
  projectId: "online-outpass-d513b",
  storageBucket: "online-outpass-d513b.firebasestorage.app",
  messagingSenderId: "636678060762",
  appId: "1:636678060762:web:8a357ddb3af0e7cd0dc3e3",
  measurementId: "G-4ZKPVMV1LK"
};

// Use Firebase V9 (modular approach is standard)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
