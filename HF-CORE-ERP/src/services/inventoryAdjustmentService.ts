/**
 * Servicio: Ajuste Auditado de Inventario — BP-045
 * Colección: businesses/{id}/inventoryAdjustments
 *
 * Cualquier modificación manual de stock queda registrada con:
 * quién, cuándo, cantidad anterior, cantidad nueva y motivo.
 *
 * PIN de supervisor: viene de VITE_SUPERVISOR_PIN (variable de entorno,
 * definida en .env.local — NUNCA se commitea a git). Antes vivía como
 * texto plano en este archivo, lo cual lo exponía en el repo público de
 * GitHub. Ver .env.example para la variable requerida.
 *
 * Sigue siendo un control débil (un solo PIN compartido, sin auditoría de
 * quién lo usa más allá del campo `supervisorNote`) — el Backlog real es
 * reemplazarlo por roles de usuario reales (ver H6 en la auditoría de
 * arquitectura).
 */
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import * as rawMaterialInventoryService from "./rawMaterialInventoryService";
import * as recipeStockService from "./recipeStockService";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";

const SUPERVISOR_PIN = import.meta.env.VITE_SUPERVISOR_PIN as string | undefined;

if (!SUPERVISOR_PIN && import.meta.env.DEV) {
  console.warn(
    "VITE_SUPERVISOR_PIN no está definido. Los ajustes de inventario que " +
    "requieren PIN de supervisor quedarán bloqueados hasta configurarlo " +
    "en .env.local."
  );
}

export interface InventoryAdjustment {
  id: string;
  itemType: "rawMaterial" | "semiFinished" | "finished";
  itemId: string;
  itemName: string;
  /** Qué campo se modificó. Opcional y ausente en registros anteriores a
   * esta fecha — todos esos eran ajustes de `stock`, así que `field`
   * ausente se interpreta como `"stock"` (ver AdjustmentLogPage). */
  field?: "stock" | "minimumStock" | "unitCost";
  previousStock: number; // valor anterior del campo ajustado (se mantiene este nombre por compatibilidad con registros existentes)
  newStock: number;      // valor nuevo del campo ajustado
  reason: string;
  supervisorNote: string;
  createdAt: string;
}

function adjCol() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "inventoryAdjustments");
}

export function verifyPin(pin: string): boolean {
  if (!SUPERVISOR_PIN) return false; // sin PIN configurado, no se autoriza nada
  return pin === SUPERVISOR_PIN;
}

export async function getAdjustments(): Promise<InventoryAdjustment[]> {
  const snap = await getDocs(adjCol());
  return snap.docs.map((d) => d.data() as InventoryAdjustment);
}

async function logAdjustment(entry: Omit<InventoryAdjustment, "id" | "createdAt">): Promise<void> {
  const adj: InventoryAdjustment = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "inventoryAdjustments", adj.id), adj);
}

export async function adjustRawMaterial(
  itemId: string, itemName: string, newStock: number, reason: string, note: string
): Promise<void> {
  const current = await rawMaterialInventoryService.getRawMaterialById(itemId);
  const prev = current?.currentStock ?? 0;
  await rawMaterialInventoryService.setStock(itemId, newStock);
  await logAdjustment({ itemType: "rawMaterial", itemId, itemName, field: "stock", previousStock: prev, newStock, reason, supervisorNote: note });
}

export async function adjustSemiFinished(
  itemId: string, itemName: string, newStock: number, reason: string, note: string
): Promise<void> {
  const current = await recipeStockService.getRecipeById(itemId);
  const prev = current?.currentStock ?? 0;
  await recipeStockService.setStock(itemId, newStock);
  await logAdjustment({ itemType: "semiFinished", itemId, itemName, field: "stock", previousStock: prev, newStock, reason, supervisorNote: note });
}

export async function adjustFinished(
  itemId: string, itemName: string, newStock: number, reason: string, note: string
): Promise<void> {
  const prev = await finishedGoodsInventoryService.getStock(itemId);
  await finishedGoodsInventoryService.setStock(itemId, newStock);
  await logAdjustment({ itemType: "finished", itemId, itemName, field: "stock", previousStock: prev, newStock, reason, supervisorNote: note });
}

// --- BP-XXX: ajustes de STOCK MÍNIMO y COSTO UNITARIO, con la misma exigencia de PIN + motivo auditado que el stock ---

export async function adjustRawMaterialMinimumStock(itemId: string, itemName: string, newValue: number, reason: string): Promise<void> {
  const current = await rawMaterialInventoryService.getRawMaterialById(itemId);
  const prev = current?.minimumStock ?? 0;
  await rawMaterialInventoryService.setMinimumStock(itemId, newValue);
  await logAdjustment({ itemType: "rawMaterial", itemId, itemName, field: "minimumStock", previousStock: prev, newStock: newValue, reason, supervisorNote: "" });
}

export async function adjustRawMaterialUnitCost(itemId: string, itemName: string, newValue: number, reason: string): Promise<void> {
  const current = await rawMaterialInventoryService.getRawMaterialById(itemId);
  const prev = current?.unitCost ?? 0;
  await rawMaterialInventoryService.setUnitCost(itemId, newValue);
  await logAdjustment({ itemType: "rawMaterial", itemId, itemName, field: "unitCost", previousStock: prev, newStock: newValue, reason, supervisorNote: "" });
}

export async function adjustSemiFinishedMinimumStock(itemId: string, itemName: string, newValue: number, reason: string): Promise<void> {
  const current = await recipeStockService.getRecipeById(itemId);
  const prev = current?.minimumStock ?? 0;
  await recipeStockService.setMinimumStock(itemId, newValue);
  await logAdjustment({ itemType: "semiFinished", itemId, itemName, field: "minimumStock", previousStock: prev, newStock: newValue, reason, supervisorNote: "" });
}

export async function adjustFinishedMinimumStock(itemId: string, itemName: string, newValue: number, reason: string): Promise<void> {
  const prev = await finishedGoodsInventoryService.getMinimumStock(itemId);
  await finishedGoodsInventoryService.setMinimumStock(itemId, newValue);
  await logAdjustment({ itemType: "finished", itemId, itemName, field: "minimumStock", previousStock: prev, newStock: newValue, reason, supervisorNote: "" });
}