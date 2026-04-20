import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Your Firebase configuration from Firebase Console
// Go to Project Settings → General → Your apps → Firebase SDK snippet
const firebaseConfig = {
  apiKey: "AIzaSyD4EhlOUz4mHu2fLfa0aXcMNPIYc6BY3ws",
  authDomain: "crop-harvest-advisor.firebaseapp.com",
  projectId: "crop-harvest-advisor",
  storageBucket: "crop-harvest-advisor.firebasestorage.app",
  messagingSenderId: "922384058953",
  appId: "1:922384058953:web:1e22c1115ed5eb6fef4d98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
  auth, 
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
};