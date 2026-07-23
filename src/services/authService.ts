import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export function login(email: string, password: string): Promise<User> {
  return signInWithEmailAndPassword(auth, email, password).then((cred) => cred.user);
}

export function logout(): Promise<void> {
  return firebaseSignOut(auth);
}

/** Suscribe a cambios de sesión; retorna la función para cancelar la suscripción. */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}