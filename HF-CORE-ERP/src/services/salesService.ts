import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Sale, SaleItem, PaymentType } from "../models/Sale";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";
import * as rawMaterialInventoryService from "./rawMaterialInventoryService";
import * as recipeStockService from "./recipeStockService";
import * as customerBalanceService from "./customerBalanceService";
import * as invoiceService from "./invoiceService";

function salesCollectionRef() { return collection(db, "businesses", CURRENT_BUSINESS_ID, "sales"); }
function saleDocRef(id: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "sales", id); }

export async function getSales(): Promise<Sale[]> {
  const snap = await getDocs(salesCollectionRef());
  return snap.docs.map((d) => d.data() as Sale);
}

function validateItemShape(item: SaleItem): void {
  const count = [item.productId, item.componentRecipeId, item.rawMaterialId].filter(Boolean).length;
  if (count !== 1) throw new Error("Cada ítem debe ser exactamente uno: producto, semielaborado o materia prima.");
}

async function getAvailableStock(item: SaleItem): Promise<{ name: string; stock: number }> {
  if (item.productId) {
    // BP-045 fix: await faltante — getStock es async
    const stock = await finishedGoodsInventoryService.getStock(item.productId);
    return { name: item.productId, stock };
  }
  if (item.componentRecipeId) {
    const recipe = await recipeStockService.getRecipeById(item.componentRecipeId);
    return { name: recipe?.name ?? item.componentRecipeId, stock: recipe?.currentStock ?? 0 };
  }
  const rawMaterial = await rawMaterialInventoryService.getRawMaterialById(item.rawMaterialId!);
  return { name: rawMaterial?.name ?? item.rawMaterialId!, stock: rawMaterial?.currentStock ?? 0 };
}

export async function createSale(customerId: string, items: SaleItem[], paymentType: PaymentType): Promise<Sale> {
  if (items.length === 0) throw new Error("Una venta necesita al menos un ítem.");
  items.forEach(validateItemShape);

  for (const item of items) {
    const { name, stock } = await getAvailableStock(item);
    if (item.quantity > stock) throw new Error(`Inventario insuficiente de ${name} (disponible: ${stock}).`);
  }

  for (const item of items) {
    if (item.productId) await finishedGoodsInventoryService.decreaseStock(item.productId, item.quantity);
    else if (item.componentRecipeId) await recipeStockService.decreaseStock(item.componentRecipeId, item.quantity);
    else if (item.rawMaterialId) await rawMaterialInventoryService.consumeStock(item.rawMaterialId, item.quantity);
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const sale: Sale = { id: crypto.randomUUID(), customerId, items, paymentType, total, status: "active", createdAt: new Date().toISOString() };
  await setDoc(saleDocRef(sale.id), sale);
  return sale;
}

export async function voidSale(saleId: string): Promise<void> {
  const snap = await getDoc(saleDocRef(saleId));
  if (!snap.exists()) throw new Error(`Venta no encontrada: ${saleId}`);
  const sale = snap.data() as Sale;
  if (sale.status === "voided") return;

  for (const item of sale.items) {
    if (item.productId) await finishedGoodsInventoryService.increaseStock(item.productId, item.quantity);
    else if (item.componentRecipeId) await recipeStockService.increaseStock(item.componentRecipeId, item.quantity);
    else if (item.rawMaterialId) await rawMaterialInventoryService.receiveStock(item.rawMaterialId, item.quantity);
  }

  if (sale.paymentType === "credit") {
    const invoice = await invoiceService.getInvoiceBySaleId(saleId);
    if (invoice) await customerBalanceService.adjustBalance(sale.customerId, -(invoice.netAmountDue ?? invoice.total ?? sale.total));
  }

  await setDoc(saleDocRef(saleId), { ...sale, status: "voided" });
}