/**
 * Servicio: Ventas
 *
 * FASE ATÓMICA (Roadmap 1.2): crear venta + factura + ajuste de saldo +
 * descuento de inventario ocurren en UNA transacción de Firestore.
 *
 * Antes, `createSale` descontaba stock llamando a tres servicios
 * separados y la página generaba la factura DESPUÉS, con `setDoc` en
 * frío. Si la factura fallaba, el inventario ya quedaba descontado sin
 * venta ni factura — saldo e inventario corruptos. Ahora es todo o nada:
 * cualquier error dentro de la transacción revierte el lote completo.
 */
import {
  collection, doc, getDoc, getDocs, runTransaction, setDoc,
  type Transaction,
} from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Sale, SaleItem, PaymentType } from "../models/Sale";
import type { Invoice, InvoiceLine } from "../models/Invoice";
import type { Customer } from "../models/Customer";
import type { TaxConfig } from "../models/TaxConfig";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";
import * as rawMaterialInventoryService from "./rawMaterialInventoryService";
import * as recipeStockService from "./recipeStockService";
import * as customerBalanceService from "./customerBalanceService";
import * as invoiceService from "./invoiceService";

function salesCollectionRef() { return collection(db, "businesses", CURRENT_BUSINESS_ID, "sales"); }
function saleDocRef(id: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "sales", id); }
function businessRef() { return doc(db, "businesses", CURRENT_BUSINESS_ID); }
function customerDocRef(customerId: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "customers", customerId); }
function invoiceRef(id: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "invoices", id); }
function finishedGoodDocRef(productId: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "finishedGoods", productId); }
function recipeDocRef(recipeId: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "recipes", recipeId); }
function rawMaterialDocRef(rawMaterialId: string) { return doc(db, "businesses", CURRENT_BUSINESS_ID, "rawMaterials", rawMaterialId); }

export async function getSales(): Promise<Sale[]> {
  const snap = await getDocs(salesCollectionRef());
  return snap.docs.map((d) => d.data() as Sale);
}

function validateItemShape(item: SaleItem): void {
  const count = [item.productId, item.componentRecipeId, item.rawMaterialId].filter(Boolean).length;
  if (count !== 1) throw new Error("Cada ítem debe ser exactamente uno: producto, semielaborado o materia prima.");
}

/**
 * Crea una venta de forma ATÓMICA.
 *
 * Todo dentro de `runTransaction`: descuento de stock (finishedGoods /
 * recipes / rawMaterials), creación de la venta, y — solo si es a
 * crédito — la factura con numeración secuencial (contador en el
 * documento del negocio) y el aumento del saldo del cliente.
 *
 * Devuelve la venta y (si aplica) la factura generada. Cualquier fallo
 * (stock insuficiente, cliente inexistente) revierte TODO el lote.
 */
export async function createSale(
  customerId: string,
  items: SaleItem[],
  paymentType: PaymentType,
  itemLabels?: string[],
  taxConfig?: TaxConfig
): Promise<{ sale: Sale; invoice: Invoice | null }> {
  if (items.length === 0) throw new Error("Una venta necesita al menos un ítem.");
  items.forEach(validateItemShape);

  const sale: Sale = {
    id: crypto.randomUUID(),
    customerId,
    items,
    paymentType,
    total: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    status: "active",
    createdAt: new Date().toISOString(),
  };

  const invoice = await runTransaction(db, async (tx) => {
    // 1. Descuento de inventario (dentro de la tx: leer stock real, validar, escribir)
    for (const item of items) {
      await applyStockDecrease(tx, item);
    }

    // 2. Registrar la venta
    tx.set(saleDocRef(sale.id), sale);

    // Ventas al contado NO generan factura ni ajuste de saldo.
    if (paymentType === "cash") {
      return null;
    }

    // 3. Crédito → factura atómica: cliente, impuestos y contador dentro de la tx.
    const customerSnap = await tx.get(customerDocRef(customerId));
    const customer = customerSnap.data() as Customer | undefined;
    if (!customer) throw new Error(`Cliente no encontrado: ${customerId}`);

    const businessSnap = await tx.get(businessRef());
    const effectiveTax = taxConfig ?? (businessSnap.data()?.taxConfig as TaxConfig | undefined);
    if (!effectiveTax) throw new Error("No se pudo leer el catálogo de impuestos.");

    const lines: InvoiceLine[] = items.map((item, idx) => ({
      description: itemLabels?.[idx] ?? "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
      isVatExempt: item.isVatExempt ?? false,
    }));

    // BP-047: IVA solo sobre ítems no exentos.
    const exemptAmount = lines.filter((l) => l.isVatExempt).reduce((sum, l) => sum + l.lineTotal, 0);
    const baseImponible = lines.filter((l) => !l.isVatExempt).reduce((sum, l) => sum + l.lineTotal, 0);
    const ivaPercentage = effectiveTax.taxes.find((t) => t.isDefault)?.percentage ?? 0;
    const ivaAmount = baseImponible * (ivaPercentage / 100);
    const total = exemptAmount + baseImponible + ivaAmount;
    const retentionFraction = retentionFractionFor(customer);
    const retainedAmount = ivaAmount * retentionFraction;
    const netAmountDue = total - retainedAmount;

    // Numeración secuencial con contador atómico en el doc del negocio.
    const currentCounter = (businessSnap.data()?.invoiceCounter as number) ?? 0;
    tx.set(businessRef(), { invoiceCounter: currentCounter + 1 }, { merge: true });

    const invoiceObj: Invoice = {
      id: crypto.randomUUID(),
      number: String(currentCounter + 1).padStart(5, "0"),
      saleId: sale.id,
      customerId: customer.id,
      customerName: customer.businessName,
      customerTaxId: customer.taxId,
      customerAddress: customer.address,
      lines,
      exemptAmount,
      baseImponible,
      ivaPercentage,
      ivaAmount,
      total,
      retentionFraction,
      retainedAmount,
      netAmountDue,
      createdAt: sale.createdAt,
    };
    tx.set(invoiceRef(invoiceObj.id), invoiceObj);

    // 4. Ajuste de saldo del cliente (incremento por la deuda) dentro de la tx.
    const currentBalance = (customerSnap.data()?.balance as number) ?? 0;
    tx.set(customerDocRef(customerId), { balance: currentBalance + netAmountDue }, { merge: true });

    return invoiceObj;
  });

  return { sale, invoice };
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

// ---------------------------------------------------------------------
// Helpers de la FASE ATÓMICA (Roadmap 1.2)
// ---------------------------------------------------------------------

/**
 * Descuenta un ítem del inventario DENTRO de la transacción: lee el stock
 * real, valida disponibilidad y escribe el valor decrementado. Nunca
 * escribe a ciegas (evita stocks negativos en condiciones de carrera).
 */
async function applyStockDecrease(tx: Transaction, item: SaleItem): Promise<void> {
  if (item.productId) {
    const ref = finishedGoodDocRef(item.productId);
    const snap = await tx.get(ref);
    const current = Number.isFinite(snap.data()?.stock) ? (snap.data()!.stock as number) : 0;
    if (item.quantity > current) throw new Error(`Inventario insuficiente del producto ${item.productId} (disponible: ${current}).`);
    tx.set(ref, { stock: current - item.quantity }, { merge: true });
    return;
  }
  if (item.componentRecipeId) {
    const ref = recipeDocRef(item.componentRecipeId);
    const snap = await tx.get(ref);
    const current = (snap.data()?.currentStock as number) ?? 0;
    if (item.quantity > current) throw new Error(`Inventario insuficiente del semielaborado ${item.componentRecipeId} (disponible: ${current}).`);
    tx.set(ref, { currentStock: current - item.quantity }, { merge: true });
    return;
  }
  if (item.rawMaterialId) {
    const ref = rawMaterialDocRef(item.rawMaterialId);
    const snap = await tx.get(ref);
    const current = (snap.data()?.currentStock as number) ?? 0;
    if (item.quantity > current) throw new Error(`Inventario insuficiente de la materia prima ${item.rawMaterialId} (disponible: ${current}).`);
    tx.set(ref, { currentStock: current - item.quantity }, { merge: true });
  }
}

/**
 * Factor de retención según el tipo de agente de IVA del cliente —
 * misma lógica que `invoiceService` (ADR-009).
 */
function retentionFractionFor(customer: Customer): number {
  if (customer.retentionAgentType === "agent_75") return 0.75;
  if (customer.retentionAgentType === "agent_100") return 1;
  return 0;
}