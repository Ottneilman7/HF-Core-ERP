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
  if (!SUPERVISOR_PIN) return false; // sin PIN configurado, no se autoriza nada
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