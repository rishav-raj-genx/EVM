import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxdZU6R1dSGw15jpCA196_lVFknlgFOUc",
  authDomain: "evm-mirai.firebaseapp.com",
  projectId: "evm-mirai",
  storageBucket: "evm-mirai.firebasestorage.app",
  messagingSenderId: "917241232892",
  appId: "1:917241232892:web:893939920b2da4a2820679",
  measurementId: "G-1Y5HSKK15B"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

