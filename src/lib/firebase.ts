// firebase.ts — inicialización del SDK. Las claves vienen de variables de
// entorno (.env.local, NO se sube a git) — ver .env.example en la raíz
// del proyecto para saber cuáles hacen falta.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

/**
 * Fase A (ADR-008): un solo negocio, id fijo. En Fase B (multiusuario),
 * esto se reemplaza por el businessId real del usuario autenticado —
 * ningún otro archivo debería necesitar cambios más que este.
 */
export const CURRENT_BUSINESS_ID = "honestly-foods";