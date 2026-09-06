import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
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

/**
 * Cambio de contraseña de la propia cuenta. Firebase exige una sesión
 * "reciente" para esto — si la sesión es vieja, pide la contraseña actual
 * para reautenticar primero (auth/requires-recent-login), y reintenta.
 */
export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No hay sesión activa.");
  try {
    await updatePassword(user, newPassword);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/requires-recent-login") {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } else {
      throw err;
    }
  }
}

/**
 * Restablecer contraseña de OTRO usuario (ej. un empleado). Sin backend
 * propio (ADR-008) no se puede fijar la contraseña de otra cuenta
 * directamente desde el cliente — eso requiere Admin SDK. La forma
 * correcta y segura sin backend: Firebase le manda un correo con un link
 * para que la persona la cambie ella misma.
 */
export function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}