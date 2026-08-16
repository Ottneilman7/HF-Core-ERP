/**
 * Servicio: Registro de Merma. Entrega A (BP-040): merma de proceso —
 * diferencia entre lo planeado y lo realmente obtenido al confirmar una
 * producción (evaporación, cocción, secado). Entrega B (próxima):
 * pérdidas por error, independientes de una producción.
 */
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { WasteLogEntry } from "../models/WasteLog";

function wasteCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "wasteLog");
}

export async function getWasteLog(): Promise<WasteLogEntry[]> {
  const snap = await getDocs(wasteCollectionRef());
  return snap.docs.map((d) => d.data() as WasteLogEntry);
}

export async function logProcessWaste(
  recipeId: string,
  recipeName: string,
  plannedQuantity: number,
  actualQuantity: number,
  unit: string
): Promise<void> {
  const wasteQuantity = plannedQuantity - actualQuantity;
  if (wasteQuantity <= 0) return; // sin merma, o incluso rindió más — no se registra

  const entry: WasteLogEntry = {
    id: crypto.randomUUID(),
    type: "process",
    recipeId,
    recipeName,
    plannedQuantity,
    actualQuantity,
    wasteQuantity,
    unit,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "wasteLog", entry.id), entry);
}