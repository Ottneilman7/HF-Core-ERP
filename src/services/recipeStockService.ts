/**
 * Servicio: Stock real de Semielaborados — Fase Firestore (BP-026)
 *
 * Reemplaza la versión de localStorage (BP-021). Mismas funciones, ahora
 * async, leyendo/escribiendo businesses/{CURRENT_BUSINESS_ID}/recipes.
 * recipes.ts (la semilla) ya no se importa aquí.
 */
import { collection, doc, deleteDoc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Recipe } from "../models/Recipe";

function recipesCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "recipes");
}

function recipeDocRef(id: string) {
  return doc(db, "businesses", CURRENT_BUSINESS_ID, "recipes", id);
}

export async function getEffectiveRecipes(): Promise<Recipe[]> {
  const snap = await getDocs(recipesCollectionRef());
  return snap.docs.map((d) => d.data() as Recipe);
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  const snap = await getDoc(recipeDocRef(id));
  return snap.exists() ? (snap.data() as Recipe) : undefined;
}

export async function increaseStock(recipeId: string, quantity: number): Promise<void> {
  const current = await getRecipeById(recipeId);
  if (!current) {
    throw new Error(`Receta no encontrada: ${recipeId}`);
  }
  await setDoc(recipeDocRef(recipeId), {
    ...current,
    currentStock: (current.currentStock ?? 0) + quantity,
  });
}

export async function decreaseStock(recipeId: string, quantity: number): Promise<void> {
  const current = await getRecipeById(recipeId);
  if (!current) {
    throw new Error(`Receta no encontrada: ${recipeId}`);
  }
  const available = current.currentStock ?? 0;
  if (quantity > available) {
    throw new Error(`Inventario insuficiente de ${current.name ?? recipeId} (disponible: ${available}).`);
  }
  await setDoc(recipeDocRef(recipeId), {
    ...current,
    currentStock: available - quantity,
  });
}

/**
 * Crea o actualiza una receta completa (BOM) — no solo el stock.
 * BP-039: módulo de Recetas en Configuración. Si `recipe.id` ya existe,
 * la sobreescribe (edición); si no, la crea.
 */
export async function saveRecipe(recipe: Recipe): Promise<void> {
  await setDoc(recipeDocRef(recipe.id), recipe);
}

export async function deleteRecipe(id: string): Promise<void> {
  await deleteDoc(recipeDocRef(id));
}