import { collection, doc, getDoc, getDocs, runTransaction, setDoc, type Transaction } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { RawMaterial } from "../models/RawMaterial";

function rawMaterialsCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "rawMaterials");
}
export function rawMaterialDocRef(id: string) {
  return doc(db, "businesses", CURRENT_BUSINESS_ID, "rawMaterials", id);
}

export async function getEffectiveRawMaterials(): Promise<RawMaterial[]> {
  const snap = await getDocs(rawMaterialsCollectionRef());
  return snap.docs.map((d) => d.data() as RawMaterial);
}

export async function getRawMaterialById(id: string): Promise<RawMaterial | undefined> {
  const snap = await getDoc(rawMaterialDocRef(id));
  return snap.exists() ? (snap.data() as RawMaterial) : undefined;
}

/**
 * Lee la materia prima dentro de una transacción en curso. Úsalo cuando
 * esta operación es parte de un flujo más grande (ej. confirmProduction)
 * que debe aplicarse todo-o-nada junto con otras colecciones.
 */
async function getInTx(tx: Transaction, rawMaterialId: string): Promise<RawMaterial> {
  const snap = await tx.get(rawMaterialDocRef(rawMaterialId));
  if (!snap.exists()) throw new Error(`Materia prima no encontrada: ${rawMaterialId}`);
  return snap.data() as RawMaterial;
}

export async function receiveStock(rawMaterialId: string, quantityReceived: number, newUnitCost?: number): Promise<void> {
  const ref = rawMaterialDocRef(rawMaterialId);
  await runTransaction(db, async (tx) => {
    const current = await getInTx(tx, rawMaterialId);
    tx.set(ref, {
      ...current,
      currentStock: current.currentStock + quantityReceived,
      unitCost: newUnitCost ?? current.unitCost,
    });
  });
}

export async function consumeStock(rawMaterialId: string, quantityConsumed: number): Promise<void> {
  const ref = rawMaterialDocRef(rawMaterialId);
  await runTransaction(db, async (tx) => {
    const current = await getInTx(tx, rawMaterialId);
    if (quantityConsumed > current.currentStock)
      throw new Error(`Inventario insuficiente de ${current.name} (disponible: ${current.currentStock}).`);
    tx.set(ref, { ...current, currentStock: current.currentStock - quantityConsumed });
  });
}

/**
 * Variante para usar DENTRO de una transacción ya abierta por otro
 * servicio (ver productionExecutionService.confirmProduction). No abre
 * su propia transacción — reusa la que le pasan, para que todo el
 * conjunto de lecturas/escrituras se aplique de forma atómica.
 */
export async function consumeStockInTx(tx: Transaction, rawMaterialId: string, quantityConsumed: number): Promise<void> {
  const current = await getInTx(tx, rawMaterialId);
  if (quantityConsumed > current.currentStock)
    throw new Error(`Inventario insuficiente de ${current.name} (disponible: ${current.currentStock}).`);
  tx.set(rawMaterialDocRef(rawMaterialId), { ...current, currentStock: current.currentStock - quantityConsumed });
}

// BP-045: ajuste directo de stock (requiere PIN de supervisor)
export async function setStock(rawMaterialId: string, newStock: number): Promise<void> {
  const ref = rawMaterialDocRef(rawMaterialId);
  await runTransaction(db, async (tx) => {
    const current = await getInTx(tx, rawMaterialId);
    tx.set(ref, { ...current, currentStock: newStock });
  });
}

// BP-045: actualizar stock mínimo
export async function setMinimumStock(rawMaterialId: string, minimumStock: number): Promise<void> {
  const current = await getRawMaterialById(rawMaterialId);
  if (!current) throw new Error(`Materia prima no encontrada: ${rawMaterialId}`);
  await setDoc(rawMaterialDocRef(rawMaterialId), { ...current, minimumStock });
}