import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCm0OfvMXn3Wef_RlTJ2hgwh5GlDQ_HSCQ",
  authDomain: "famishop-c3155.firebaseapp.com",
  projectId: "famishop-c3155",
  storageBucket: "famishop-c3155.firebasestorage.app",
  messagingSenderId: "240209938772",
  appId: "1:240209938772:web:0aabbbc0cb27cc099e60c1",
  measurementId: "G-XENN5ML7DP",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseApp = app;
export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);

export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getAnalytics(app);
}

export const ADMIN_UID = "gLc031y0CJOwkD4SQW3D7k3Z6CX2";
