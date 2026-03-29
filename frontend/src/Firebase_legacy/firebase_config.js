import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCC0jpXAcOOlnFaXIaDEWJiIn9fnexvN7c",
  authDomain: "online-outpass-d513b.firebaseapp.com",
  projectId: "online-outpass-d513b",
  storageBucket: "online-outpass-d513b.firebasestorage.app",
  messagingSenderId: "636678060762",
  appId: "1:636678060762:web:8a357ddb3af0e7cd0dc3e3",
  measurementId: "G-4ZKPVMV1LK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };