// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBNryUDBS9a7vTlSsOtTvan5RvNca_rJeE",
  authDomain: "attendancetracker-37f44.firebaseapp.com",
  projectId: "attendancetracker-37f44",
  storageBucket: "attendancetracker-37f44.firebasestorage.app",
  messagingSenderId: "756744213812",
  appId: "1:756744213812:web:8ccfad8ed843401e994161",
  measurementId: "G-RHLRHJBQ23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };