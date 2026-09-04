import { collection, doc, deleteDoc, getDoc, getDocs, runTransaction, setDoc, type Transaction } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Recipe } from "../models/Recipe";

function recipesCollectionRef() { return collection(db, "businesses", CURRENT_BUSINESS_ID, "recipes"); }
export function recipeDocRef(id: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "recipes", id); }

export async function getEffectiveRecipes(): Promise<Recipe[]> {
  const snap = await getDocs(recipesCollectionRef());
  return snap.docs.map((d) => d.data() as Recipe);
}
export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  const snap = await getDoc(recipeDocRef(id));
  return snap.exists() ? (snap.data() as Recipe) : undefined;
}

async function getInTx(tx: Transaction, recipeId: string): Promise<Recipe> {
  const snap = await tx.get(recipeDocRef(recipeId));
  if (!snap.exists()) throw new Error(`Receta no encontrada: ${recipeId}`);
  return snap.data() as Recipe;
}

export async function increaseStock(recipeId: string, quantity: number): Promise<void> {
  const ref = recipeDocRef(recipeId);
  await runTransaction(db, async (tx) => {
    const current = await getInTx(tx, recipeId);
    tx.set(ref, { ...current, currentStock: (current.currentStock ?? 0) + quantity });
  });
}
export async function decreaseStock(recipeId: string, quantity: number): Promise<void> {
  const ref = recipeDocRef(recipeId);
  await runTransaction(db, async (tx) => {
    const current = await getInTx(tx, recipeId);
    const available = current.currentStock ?? 0;
    if (quantity > available) throw new Error(`Inventario insuficiente de ${current.name ?? recipeId} (disponible: ${available}).`);
    tx.set(ref, { ...current, currentStock: available - quantity });
  });
}

/** Variante para usar dentro de una transacción ya abierta (ver productionExecutionService). */
export async function decreaseStockInTx(tx: Transaction, recipeId: string, quantity: number): Promise<void> {
  const current = await getInTx(tx, recipeId);
  const available = current.currentStock ?? 0;
  if (quantity > available) throw new Error(`Inventario insuficiente de ${current.name ?? recipeId} (disponible: ${available}).`);
  tx.set(recipeDocRef(recipeId), { ...current, currentStock: available - quantity });
}
/** Variante para usar dentro de una transacción ya abierta (ver productionExecutionService). */
export async function increaseStockInTx(tx: Transaction, recipeId: string, quantity: number): Promise<void> {
  const current = await getInTx(tx, recipeId);
  tx.set(recipeDocRef(recipeId), { ...current, currentStock: (current.currentStock ?? 0) + quantity });
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  await setDoc(recipeDocRef(recipe.id), recipe);
}
export async function deleteRecipe(id: string): Promise<void> {
  await deleteDoc(recipeDocRef(id));
}
// BP-XXX: stock mínimo de semielaborados (antes solo existía para materia prima)
export async function setMinimumStock(recipeId: string, minimumStock: number): Promise<void> {
  const current = await getRecipeById(recipeId);
  if (!current) throw new Error(`Receta no encontrada: ${recipeId}`);
  await setDoc(recipeDocRef(recipeId), { ...current, minimumStock });
}
// BP-045: ajuste directo de stock (requiere PIN de supervisor)
export async function setStock(recipeId: string, newStock: number): Promise<void> {
  const ref = recipeDocRef(recipeId);
  await runTransaction(db, async (tx) => {
    const current = await getInTx(tx, recipeId);
    tx.set(ref, { ...current, currentStock: newStock });
  });
}