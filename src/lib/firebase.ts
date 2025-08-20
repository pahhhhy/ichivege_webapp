
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "veggieconnect-gk3oe",
  appId: "1:86070425130:web:02adb2af4b3ea681233553",
  storageBucket: "veggieconnect-gk3oe.firebasestorage.app",
  apiKey: "AIzaSyCUb2xz9Ti7wQFieBUWgV-eg7jJvtSGOqw",
  authDomain: "veggieconnect-gk3oe.firebaseapp.com",
  messagingSenderId: "86070425130",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
