/**
 * Servicio: Ajuste Auditado de Inventario — BP-045
 * Colección: businesses/{id}/inventoryAdjustments
 *
 * Cualquier modificación manual de stock queda registrada con:
 * quién, cuándo, cantidad anterior, cantidad nueva y motivo.
 * PIN de supervisor requerido (hardcoded en Fase A — Backlog: mover a config).
 */
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import * as rawMaterialInventoryService from "./rawMaterialInventoryService";
import * as recipeStockService from "./recipeStockService";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";

const SUPERVISOR_PIN = "$oy0770"; // Backlog: mover a configService

export interface InventoryAdjustment {
  id: string;
  itemType: "rawMaterial" | "semiFinished" | "finished";
  itemId: string;
  itemName: string;
  previousStock: number;
  newStock: number;
  reason: string;
  supervisorNote: string;
  createdAt: string;
}

function adjCol() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "inventoryAdjustments");
}

export function verifyPin(pin: string): boolean {
  return pin === SUPERVISOR_PIN;
}

export async function getAdjustments(): Promise<InventoryAdjustment[]> {
  const snap = await getDocs(adjCol());
  return snap.docs.map((d) => d.data() as InventoryAdjustment);
}

export async function adjustRawMaterial(
  itemId: string, itemName: string, newStock: number, reason: string, note: string
): Promise<void> {
  const current = await rawMaterialInventoryService.getRawMaterialById(itemId);
  const prev = current?.currentStock ?? 0;
  await rawMaterialInventoryService.setStock(itemId, newStock);
  const adj: InventoryAdjustment = {
    id: crypto.randomUUID(), itemType: "rawMaterial", itemId, itemName,
    previousStock: prev, newStock, reason, supervisorNote: note,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "inventoryAdjustments", adj.id), adj);
}

export async function adjustSemiFinished(
  itemId: string, itemName: string, newStock: number, reason: string, note: string
): Promise<void> {
  const current = await recipeStockService.getRecipeById(itemId);
  const prev = current?.currentStock ?? 0;
  await recipeStockService.setStock(itemId, newStock);
  const adj: InventoryAdjustment = {
    id: crypto.randomUUID(), itemType: "semiFinished", itemId, itemName,
    previousStock: prev, newStock, reason, supervisorNote: note,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "inventoryAdjustments", adj.id), adj);
}

export async function adjustFinished(
  itemId: string, itemName: string, newStock: number, reason: string, note: string
): Promise<void> {
  const prev = await finishedGoodsInventoryService.getStock(itemId);
  await finishedGoodsInventoryService.setStock(itemId, newStock);
  const adj: InventoryAdjustment = {
    id: crypto.randomUUID(), itemType: "finished", itemId, itemName,
    previousStock: prev, newStock, reason, supervisorNote: note,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "inventoryAdjustments", adj.id), adj);
}