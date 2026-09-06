/**
 * Da de alta una cuenta nueva en Firebase Auth SIN cerrar la sesión actual
 * (la del owner que está usando /team). El truco: Firebase permite tener
 * más de una "app" inicializada a la vez, cada una con su propia sesión de
 * Auth independiente. Se crea una app secundaria temporal solo para este
 * registro, y se destruye apenas termina — la sesión principal (owner)
 * nunca se toca.
 *
 * Sin esto, la única forma de crear un usuario nuevo sería ir a Firebase
 * Console a mano — inviable si este ERP se vende a otros microemprendedores
 * que no deberían tener acceso a esa consola.
 */
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from "./firebase";

export async function createTeamMemberAccount(email: string, password: string): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondaryApp);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = credential.user.uid;
    await signOut(secondaryAuth); // por higiene, aunque es una app aparte
    return uid;
  } finally {
    await deleteApp(secondaryApp); // limpia la app temporal, no deja rastro
  }
}