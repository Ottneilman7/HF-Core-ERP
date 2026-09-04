import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Supplier } from "../models/Supplier";
import type { PurchaseOrder, PurchaseOrderItem } from "../models/PurchaseOrder";
import * as rawMaterialInventoryService from "./rawMaterialInventoryService";
import * as recipeStockService from "./recipeStockService";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";

function suppliersCol() { return collection(db, "businesses", CURRENT_BUSINESS_ID, "suppliers"); }
function supplierDocRef(id: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "suppliers", id); }
function ordersCol() { return collection(db, "businesses", CURRENT_BUSINESS_ID, "purchaseOrders"); }
function orderRef(id: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "purchaseOrders", id); }

const IVA_PCT = 16; // misma tasa hardcodeada que ya usa PurchasesPage.tsx — se replica aquí para calcular el total que se le debe al proveedor

/** Total de una orden con IVA (16% sobre ítems no exentos) — misma fórmula que ya usa PurchasesPage.tsx. */
export function calculateOrderTotal(order: PurchaseOrder): number {
  const taxable = order.items.filter((i) => !(i.isVatExempt ?? false)).reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const exempt = order.items.filter((i) => i.isVatExempt ?? false).reduce((s, i) => s + i.quantity * i.unitCost, 0);
  return Math.round((exempt + taxable * (1 + IVA_PCT / 100)) * 100) / 100;
}

export async function getSupplierById(id: string): Promise<Supplier | undefined> {
  const snap = await getDoc(supplierDocRef(id));
  return snap.exists() ? (snap.data() as Supplier) : undefined;
}

/** Cuentas por Pagar (BP-XXX): ajusta el saldo que le debemos a un proveedor. Espejo de customerBalanceService.adjustBalance. */
export async function adjustSupplierBalance(supplierId: string, amount: number): Promise<void> {
  const current = await getSupplierById(supplierId);
  if (!current) throw new Error(`Proveedor no encontrado: ${supplierId}`);
  if (!Number.isFinite(amount)) throw new Error(`Monto de ajuste inválido para ${supplierId}.`);
  const safeCurrentBalance = Number.isFinite(current.balance) ? (current.balance as number) : 0;
  const newBalance = Math.round((safeCurrentBalance + amount) * 100) / 100;
  await setDoc(supplierDocRef(supplierId), { ...current, balance: newBalance });
}

export async function getSuppliers(): Promise<Supplier[]> {
  return (await getDocs(suppliersCol())).docs.map((d) => d.data() as Supplier);
}
export async function createSupplier(input: Omit<Supplier, "id" | "createdAt" | "balance">): Promise<Supplier> {
  const s: Supplier = { ...input, id: crypto.randomUUID(), balance: 0, createdAt: new Date().toISOString() };
  await setDoc(supplierDocRef(s.id), s);
  return s;
}
export async function updateSupplier(id: string, updates: Partial<Omit<Supplier, "id" | "createdAt">>): Promise<void> {
  const snap = await getDoc(supplierDocRef(id));
  if (!snap.exists()) throw new Error(`Proveedor no encontrado: ${id}`);
  await setDoc(supplierDocRef(id), { ...snap.data(), ...updates });
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

  // Cuentas por Pagar (BP-XXX): solo las compras a crédito generan deuda con el proveedor.
  if (order.paymentTerm === "credit") {
    await adjustSupplierBalance(order.supplierId, calculateOrderTotal(order));
  }
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

  // Cuentas por Pagar (BP-XXX): si ya se había recibido a crédito (y por
  // tanto ya se le sumó deuda al proveedor), revertirla al anular.
  if (order.status === "received" && order.paymentTerm === "credit") {
    await adjustSupplierBalance(order.supplierId, -calculateOrderTotal(order));
  }
  return updated;
}