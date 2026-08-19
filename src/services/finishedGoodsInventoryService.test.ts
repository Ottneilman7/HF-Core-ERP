/**
 * Servicio: Inventario de Producto Terminado
 *
 * BP-042 (Entrega 2): migrado de localStorage a Firestore.
 * Colección: businesses/{businessId}/finishedGoods
 * Estructura: un documento por producto, con campo `stock: number`.
 *
 * Las firmas públicas (getStock, getAllStock, increaseStock, decreaseStock)
 * son ahora async — todos los llamadores se actualizan en este mismo BP.
 *
 * Regla ADR-009 aplicada: cualquier documento sin campo `stock` se lee
 * como 0 (nunca undefined).
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";

function finishedGoodsCol() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "finishedGoods");
}

function productDocRef(productId: string) {
  return doc(db, "businesses", CURRENT_BUSINESS_ID, "finishedGoods", productId);
}

/** Devuelve el stock actual de un producto terminado (0 si no existe). */
export async function getStock(productId: string): Promise<number> {
  const snap = await getDoc(productDocRef(productId));
  if (!snap.exists()) return 0;
  const val = snap.data()?.stock;
  return Number.isFinite(val) ? (val as number) : 0;
}

/** Devuelve el stock de todos los productos terminados como { productId: stock }. */
export async function getAllStock(): Promise<Record<string, number>> {
  const snap = await getDocs(finishedGoodsCol());
  const result: Record<string, number> = {};
  for (const d of snap.docs) {
    const val = d.data()?.stock;
    result[d.id] = Number.isFinite(val) ? (val as number) : 0;
  }
  return result;
}

/** Suma `quantity` al stock del producto. Crea el documento si no existe. */
export async function increaseStock(
  productId: string,
  quantity: number
): Promise<void> {
  const ref = productDocRef(productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = Number.isFinite(snap.data()?.stock)
      ? (snap.data()!.stock as number)
      : 0;
    tx.set(ref, { stock: current + quantity }, { merge: true });
  });
}

/**
 * Resta `quantity` del stock. Lanza error si no hay suficiente inventario.
 * Usa transacción para evitar condiciones de carrera (todo o nada).
 */
export async function decreaseStock(
  productId: string,
  quantity: number
): Promise<void> {
  const ref = productDocRef(productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = Number.isFinite(snap.data()?.stock)
      ? (snap.data()!.stock as number)
      : 0;
    if (quantity > current) {
      throw new Error(
        `Inventario insuficiente del producto ${productId} (disponible: ${current}).`
      );
    }
    tx.set(ref, { stock: current - quantity }, { merge: true });
  });
}