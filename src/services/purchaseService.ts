/**
 * Servicio: Compras — Fase Firestore (BP-031). Mismas funciones que la
 * versión localStorage, ahora async, sobre businesses/{id}/suppliers y
 * businesses/{id}/purchaseOrders.
 */
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Supplier } from "../models/Supplier";
import type { PurchaseOrder, PurchaseOrderItem } from "../models/PurchaseOrder";
import * as rawMaterialInventoryService from "./rawMaterialInventoryService";
import * as recipeStockService from "./recipeStockService";

function suppliersCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "suppliers");
}
function ordersCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "purchaseOrders");
}
function orderDocRef(id: string) {
  return doc(db, "businesses", CURRENT_BUSINESS_ID, "purchaseOrders", id);
}

export async function getSuppliers(): Promise<Supplier[]> {
  const snap = await getDocs(suppliersCollectionRef());
  return snap.docs.map((d) => d.data() as Supplier);
}

export async function createSupplier(input: Omit<Supplier, "id" | "createdAt">): Promise<Supplier> {
  const supplier: Supplier = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "suppliers", supplier.id), supplier);
  return supplier;
}

export async function updateSupplier(id: string, updates: Partial<Omit<Supplier, "id" | "createdAt">>): Promise<void> {
  const snap = await getDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "suppliers", id));
  if (!snap.exists()) {
    throw new Error(`Proveedor no encontrado: ${id}`);
  }
  const current = snap.data() as Supplier;
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "suppliers", id), { ...current, ...updates });
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const snap = await getDocs(ordersCollectionRef());
  return snap.docs.map((d) => d.data() as PurchaseOrder);
}

export async function getPendingOrders(): Promise<PurchaseOrder[]> {
  return (await getPurchaseOrders()).filter((o) => o.status === "ordered");
}

function validateItem(item: PurchaseOrderItem): void {
  const hasRawMaterial = Boolean(item.rawMaterialId);
  const hasRecipe = Boolean(item.componentRecipeId);
  if (hasRawMaterial === hasRecipe) {
    throw new Error(
      "Cada ítem de compra debe ser materia prima O un semielaborado comprado ya hecho, nunca ambos ni ninguno."
    );
  }
}

export async function createPurchaseOrder(
  supplierId: string,
  items: PurchaseOrderItem[],
  purchaseDate: string,
  paymentTerm: PurchaseOrder["paymentTerm"],
  supplierInvoiceNumber?: string
): Promise<PurchaseOrder> {
  if (items.length === 0) {
    throw new Error("Una orden de compra necesita al menos un ítem.");
  }
  items.forEach(validateItem);

  const order: PurchaseOrder = {
    id: crypto.randomUUID(),
    supplierId,
    items,
    status: "ordered",
    purchaseDate,
    supplierInvoiceNumber,
    paymentTerm,
    createdAt: new Date().toISOString(),
  };
  await setDoc(orderDocRef(order.id), order);
  return order;
}

export async function receivePurchaseOrder(orderId: string): Promise<PurchaseOrder> {
  const snap = await getDoc(orderDocRef(orderId));
  if (!snap.exists()) {
    throw new Error(`Orden de compra no encontrada: ${orderId}`);
  }
  const order = snap.data() as PurchaseOrder;
  if (order.status === "received") {
    return order;
  }

  for (const item of order.items) {
    if (item.rawMaterialId) {
      await rawMaterialInventoryService.receiveStock(item.rawMaterialId, item.quantity, item.unitCost);
    } else if (item.componentRecipeId) {
      await recipeStockService.increaseStock(item.componentRecipeId, item.quantity);
    }
  }

  const updated: PurchaseOrder = { ...order, status: "received", receivedAt: new Date().toISOString() };
  await setDoc(orderDocRef(orderId), updated);
  return updated;
}

/**
 * Anula una orden de compra — para devoluciones al proveedor. Si la
 * orden ya estaba "received", revierte el inventario que había sumado
 * (resta lo que se había recibido). Si estaba "ordered" (nunca
 * recibida), simplemente se marca anulada, sin tocar inventario.
 */
export async function voidPurchaseOrder(orderId: string): Promise<PurchaseOrder> {
  const snap = await getDoc(orderDocRef(orderId));
  if (!snap.exists()) {
    throw new Error(`Orden de compra no encontrada: ${orderId}`);
  }
  const order = snap.data() as PurchaseOrder;
  if (order.status === "voided") {
    return order;
  }

  if (order.status === "received") {
    for (const item of order.items) {
      if (item.rawMaterialId) {
        await rawMaterialInventoryService.consumeStock(item.rawMaterialId, item.quantity);
      } else if (item.componentRecipeId) {
        await recipeStockService.decreaseStock(item.componentRecipeId, item.quantity);
      }
    }
  }

  const updated: PurchaseOrder = { ...order, status: "voided" };
  await setDoc(orderDocRef(orderId), updated);
  return updated;
}