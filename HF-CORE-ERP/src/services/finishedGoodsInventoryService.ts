import { collection, doc, getDoc, getDocs, runTransaction } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";

function finishedGoodsCol() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "finishedGoods");
}
function productDocRef(productId: string) {
  return doc(db, "businesses", CURRENT_BUSINESS_ID, "finishedGoods", productId);
}

export async function getStock(productId: string): Promise<number> {
  const snap = await getDoc(productDocRef(productId));
  if (!snap.exists()) return 0;
  const val = snap.data()?.stock;
  return Number.isFinite(val) ? (val as number) : 0;
}

export async function getAllStock(): Promise<Record<string, number>> {
  const snap = await getDocs(finishedGoodsCol());
  const result: Record<string, number> = {};
  for (const d of snap.docs) {
    const val = d.data()?.stock;
    result[d.id] = Number.isFinite(val) ? (val as number) : 0;
  }
  return result;
}

export async function increaseStock(productId: string, quantity: number): Promise<void> {
  const ref = productDocRef(productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = Number.isFinite(snap.data()?.stock) ? (snap.data()!.stock as number) : 0;
    tx.set(ref, { stock: current + quantity }, { merge: true });
  });
}

export async function decreaseStock(productId: string, quantity: number): Promise<void> {
  const ref = productDocRef(productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = Number.isFinite(snap.data()?.stock) ? (snap.data()!.stock as number) : 0;
    if (quantity > current) throw new Error(`Inventario insuficiente del producto ${productId} (disponible: ${current}).`);
    tx.set(ref, { stock: current - quantity }, { merge: true });
  });
}

// BP-045: ajuste directo de stock (requiere PIN de supervisor)
export async function setStock(productId: string, newStock: number): Promise<void> {
  const ref = productDocRef(productId);
  await runTransaction(db, async (tx) => {
    tx.set(ref, { stock: newStock }, { merge: true });
  });
}