/**
 * Servicio: Facturación. BP-035: calcula el monto REAL a cobrar según el
 * agente de retención del cliente, y es quien ajusta el saldo del
 * cliente (no salesService — Sale no sabe de impuestos, Invoice sí).
 *
 * Fórmula: netAmountDue = baseImponible + ivaAmount - retainedAmount
 * retentionFraction: none → 0 (paga todo) | agent_75 → 0.75 (paga 25%
 * del IVA) | agent_100 → 1 (no paga IVA, solo la base).
 */
import { collection, doc, getDocs, runTransaction, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Invoice, InvoiceLine } from "../models/Invoice";
import type { Sale } from "../models/Sale";
import type { Customer } from "../models/Customer";
import type { TaxConfig } from "../models/TaxConfig";
import * as customerBalanceService from "./customerBalanceService";

function invoicesCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "invoices");
}

export async function getInvoices(): Promise<Invoice[]> {
  const snap = await getDocs(invoicesCollectionRef());
  return snap.docs.map((d) => d.data() as Invoice);
}

export async function getInvoiceBySaleId(saleId: string): Promise<Invoice | undefined> {
  return (await getInvoices()).find((inv) => inv.saleId === saleId);
}

async function nextInvoiceNumber(): Promise<string> {
  const businessRef = doc(db, "businesses", CURRENT_BUSINESS_ID);
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(businessRef);
    const current = (snap.data()?.invoiceCounter as number) ?? 0;
    const updated = current + 1;
    tx.set(businessRef, { invoiceCounter: updated }, { merge: true });
    return updated;
  });
  return String(next).padStart(5, "0");
}

function retentionFractionFor(customer: Customer): number {
  if (customer.retentionAgentType === "agent_75") return 0.75;
  if (customer.retentionAgentType === "agent_100") return 1;
  return 0;
}

export async function createInvoiceFromSale(
  sale: Sale,
  customer: Customer,
  itemLabels: string[],
  taxConfig: TaxConfig
): Promise<Invoice> {
  const lines: InvoiceLine[] = sale.items.map((item, idx) => ({
    description: itemLabels[idx],
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.quantity * item.unitPrice,
  }));

  const baseImponible = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const defaultTax = taxConfig.taxes.find((t) => t.isDefault);
  const ivaPercentage = defaultTax?.percentage ?? 0;
  const ivaAmount = baseImponible * (ivaPercentage / 100);
  const total = baseImponible + ivaAmount;

  const retentionFraction = retentionFractionFor(customer);
  const retainedAmount = ivaAmount * retentionFraction;
  const netAmountDue = total - retainedAmount;

  const invoice: Invoice = {
    id: crypto.randomUUID(),
    number: await nextInvoiceNumber(),
    saleId: sale.id,
    customerId: customer.id,
    customerName: customer.businessName,
    customerTaxId: customer.taxId,
    customerAddress: customer.address,
    lines,
    baseImponible,
    ivaPercentage,
    ivaAmount,
    total,
    retentionFraction,
    retainedAmount,
    netAmountDue,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "invoices", invoice.id), invoice);

  if (sale.paymentType === "credit") {
    await customerBalanceService.adjustBalance(customer.id, netAmountDue);
  }

  return invoice;
}