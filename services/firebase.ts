import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByL1rBSe8yC6Qv4AuoKP-ivVeYGASoXnk",
  authDomain: "my-project-da33c.firebaseapp.com",
  projectId: "my-project-da33c",
  storageBucket: "my-project-da33c.firebasestorage.app",
  messagingSenderId: "464693409548",
  appId: "1:464693409548:web:9421e8eb0a8d4364c57b29",
  measurementId: "G-V1D09CMX2F"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export default app;