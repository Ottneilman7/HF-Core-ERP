/**
 * Servicio: Registro de Merma. Entrega A (BP-040): merma de proceso —
 * diferencia entre lo planeado y lo realmente obtenido al confirmar una
 * producción (evaporación, cocción, secado). Entrega B (próxima):
 * pérdidas por error, independientes de una producción.
 */
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { WasteLogEntry, WasteReason } from "../models/WasteLog";
import * as rawMaterialInventoryService from "./rawMaterialInventoryService";
import * as recipeStockService from "./recipeStockService";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";

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

// --- Entrega B: merma por error (quema, derrame, vencido, mala manipulación) ---

export type WasteItemType = "rawMaterial" | "componentRecipe" | "product";

export interface LogErrorWasteInput {
  itemType: WasteItemType;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: WasteReason;
  note?: string;
}

/** Descarta inventario ya existente (no ligado a una producción) y lo descuenta del inventario real. */
export async function logErrorWaste(input: LogErrorWasteInput): Promise<void> {
  if (input.quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a cero.");
  }

  if (input.itemType === "rawMaterial") {
    await rawMaterialInventoryService.consumeStock(input.itemId, input.quantity);
  } else if (input.itemType === "componentRecipe") {
    await recipeStockService.decreaseStock(input.itemId, input.quantity);
  } else {
    finishedGoodsInventoryService.decreaseStock(input.itemId, input.quantity);
  }

  const entry: WasteLogEntry = {
    id: crypto.randomUUID(),
    type: "error",
    rawMaterialId: input.itemType === "rawMaterial" ? input.itemId : undefined,
    componentRecipeId: input.itemType === "componentRecipe" ? input.itemId : undefined,
    productId: input.itemType === "product" ? input.itemId : undefined,
    itemName: input.itemName,
    reason: input.reason,
    note: input.note,
    wasteQuantity: input.quantity,
    unit: input.unit,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "wasteLog", entry.id), entry);
}