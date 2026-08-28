import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Supplier } from "../models/Supplier";
import type { PurchaseOrder, PurchaseOrderItem } from "../models/PurchaseOrder";
import * as rawMaterialInventoryService from "./rawMaterialInventoryService";
import * as recipeStockService from "./recipeStockService";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";

function suppliersCol() { return collection(db, "businesses", CURRENT_BUSINESS_ID, "suppliers"); }
function ordersCol() { return collection(db, "businesses", CURRENT_BUSINESS_ID, "purchaseOrders"); }
function orderRef(id: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "purchaseOrders", id); }

export async function getSuppliers(): Promise<Supplier[]> {
  return (await getDocs(suppliersCol())).docs.map((d) => d.data() as Supplier);
}
export async function createSupplier(input: Omit<Supplier, "id" | "createdAt">): Promise<Supplier> {
  const s: Supplier = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "suppliers", s.id), s);
  return s;
}
export async function updateSupplier(id: string, updates: Partial<Omit<Supplier, "id" | "createdAt">>): Promise<void> {
  const snap = await getDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "suppliers", id));
  if (!snap.exists()) throw new Error(`Proveedor no encontrado: ${id}`);
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "suppliers", id), { ...snap.data(), ...updates });
}
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return (await getDocs(ordersCol())).docs.map((d) => d.data() as PurchaseOrder);
}
export async function getPendingOrders(): Promise<PurchaseOrder[]> {
  return (await getPurchaseOrders()).filter((o) => o.status === "ordered");
}

function validateItem(item: PurchaseOrderItem): void {
  const kinds = [item.rawMaterialId, item.componentRecipeId, item.finishedProductId, item.customItemName].filter(Boolean);
  if (kinds.length !== 1) throw new Error("Cada ítem debe ser exactamente uno: materia prima, semielaborado, producto terminado o personalizado.");
}

export async function createPurchaseOrder(
  supplierId: string, items: PurchaseOrderItem[],
  purchaseDate: string, paymentTerm: PurchaseOrder["paymentTerm"],
  supplierInvoiceNumber?: string
): Promise<PurchaseOrder> {
  if (items.length === 0) throw new Error("Una orden necesita al menos un ítem.");
  items.forEach(validateItem);
  const order: PurchaseOrder = {
    id: crypto.randomUUID(), supplierId, items, status: "ordered",
    purchaseDate, supplierInvoiceNumber, paymentTerm, createdAt: new Date().toISOString(),
  };
  await setDoc(orderRef(order.id), order);
  return order;
}

export async function receivePurchaseOrder(orderId: string): Promise<PurchaseOrder> {
  const snap = await getDoc(orderRef(orderId));
  if (!snap.exists()) throw new Error(`Orden no encontrada: ${orderId}`);
  const order = snap.data() as PurchaseOrder;
  if (order.status === "received") return order;
  for (const item of order.items) {
    if (item.rawMaterialId) await rawMaterialInventoryService.receiveStock(item.rawMaterialId, item.quantity, item.unitCost);
    else if (item.componentRecipeId) await recipeStockService.increaseStock(item.componentRecipeId, item.quantity);
    else if (item.finishedProductId) await finishedGoodsInventoryService.increaseStock(item.finishedProductId, item.quantity);
    // customItemName: no tiene catálogo, no afecta inventario automáticamente
  }
  const updated = { ...order, status: "received" as const, receivedAt: new Date().toISOString() };
  await setDoc(orderRef(orderId), updated);
  return updated;
}

export async function voidPurchaseOrder(orderId: string): Promise<PurchaseOrder> {
  const snap = await getDoc(orderRef(orderId));
  if (!snap.exists()) throw new Error(`Orden no encontrada: ${orderId}`);
  const order = snap.data() as PurchaseOrder;
  if (order.status === "voided") return order;
  if (order.status === "received") {
    for (const item of order.items) {
      if (item.rawMaterialId) await rawMaterialInventoryService.consumeStock(item.rawMaterialId, item.quantity);
      else if (item.componentRecipeId) await recipeStockService.decreaseStock(item.componentRecipeId, item.quantity);
      else if (item.finishedProductId) await finishedGoodsInventoryService.decreaseStock(item.finishedProductId, item.quantity);
    }
  }
  const updated = { ...order, status: "voided" as const };
  await setDoc(orderRef(orderId), updated);
  return updated;
}