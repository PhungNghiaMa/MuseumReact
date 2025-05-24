// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBxU7E9RNGXPt3NBfjWLqSrsmmHsswpLYg",
  authDomain: "solana-9663f.firebaseapp.com",
  projectId: "solana-9663f",
  storageBucket: "solana-9663f.firebasestorage.app",
  messagingSenderId: "886808501761",
  appId: "1:886808501761:web:95e58e18dda43e67c66a00",
  measurementId: "G-D8YGMSR9BF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export default auth;