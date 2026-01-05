// js/firebase-config.js

// 1. Importa le funzioni v9+ che ti servono
// (Sto usando la v10.12.2, puoi aggiornarla se necessario)
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s",
    authDomain: "base-app-12108.firebaseapp.com",
    projectId: "base-app-12108",
    storageBucket: "base-app-12108.firebasestorage.app",
    messagingSenderId: "261397129842",
    appId: "1:261397129842:web:e465329890a1220ed6b0eb"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
// Specifica esplicitamente la region europe-west1
const functions = getFunctions(app, 'europe-west1');

// Connetti agli emulatori solo se in localhost e non già connessi
if (typeof window !== 'undefined' && window.location.hostname === "localhost") {
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9299);
    connectFunctionsEmulator(functions, "localhost", 5001);
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  } catch (error) {
    // Emulatori già connessi, ignora l'errore
    console.log('Emulatori già configurati');
  }
}

export { db, storage, auth, functions };
export default app;