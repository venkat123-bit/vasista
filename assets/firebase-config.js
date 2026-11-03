// Firebase initialization — shared across all pages.
// Uses the official Firebase CDN (no build step / npm needed).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOLptrhB5wSA23gw0QKqnlXB0QBYdEv_8",
  authDomain: "vasista-foods.firebaseapp.com",
  projectId: "vasista-foods",
  storageBucket: "vasista-foods.firebasestorage.app",
  messagingSenderId: "855309296963",
  appId: "1:855309296963:web:fbbf8527cb463e7701fbf6",
  measurementId: "G-6F2MP9VXED"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "asia-south1"); // Cloud Functions region (see functions/index.js)

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  doc,
  setDoc,
  getDoc,
  httpsCallable
};
