import { initializeApp } from "firebase/app";

import { getAuth, GoogleAuthProvider } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3fJrPl7Ud2cs3TZPS3Fd5jET4DZ_C3DM",

  authDomain: "phishguard-ai-6e7ac.firebaseapp.com",

  projectId: "phishguard-ai-6e7ac",

  storageBucket: "phishguard-ai-6e7ac.firebasestorage.app",

  messagingSenderId: "577576604257",

  appId: "1:577576604257:web:06be05c5647c514db11020"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);

export default app;