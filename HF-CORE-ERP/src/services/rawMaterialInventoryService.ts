import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { RawMaterial } from "../models/RawMaterial";

function rawMaterialsCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "rawMaterials");
}
function rawMaterialDocRef(id: string) {
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

export async function receiveStock(rawMaterialId: string, quantityReceived: number, newUnitCost?: number): Promise<void> {
  const current = await getRawMaterialById(rawMaterialId);
  if (!current) throw new Error(`Materia prima no encontrada: ${rawMaterialId}`);
  await setDoc(rawMaterialDocRef(rawMaterialId), {
    ...current,
    currentStock: current.currentStock + quantityReceived,
    unitCost: newUnitCost ?? current.unitCost,
  });
}

export async function consumeStock(rawMaterialId: string, quantityConsumed: number): Promise<void> {
  const current = await getRawMaterialById(rawMaterialId);
  if (!current) throw new Error(`Materia prima no encontrada: ${rawMaterialId}`);
  if (quantityConsumed > current.currentStock)
    throw new Error(`Inventario insuficiente de ${current.name} (disponible: ${current.currentStock}).`);
  await setDoc(rawMaterialDocRef(rawMaterialId), { ...current, currentStock: current.currentStock - quantityConsumed });
}

// BP-045: ajuste directo de stock (requiere PIN de supervisor)
export async function setStock(rawMaterialId: string, newStock: number): Promise<void> {
  const current = await getRawMaterialById(rawMaterialId);
  if (!current) throw new Error(`Materia prima no encontrada: ${rawMaterialId}`);
  await setDoc(rawMaterialDocRef(rawMaterialId), { ...current, currentStock: newStock });
}

// BP-045: actualizar stock mínimo
export async function setMinimumStock(rawMaterialId: string, minimumStock: number): Promise<void> {
  const current = await getRawMaterialById(rawMaterialId);
  if (!current) throw new Error(`Materia prima no encontrada: ${rawMaterialId}`);
  await setDoc(rawMaterialDocRef(rawMaterialId), { ...current, minimumStock });
}