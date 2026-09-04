/**
 * Servicio: Pagos a Proveedores (Cuentas por Pagar, BP-XXX).
 * Espejo exacto de paymentService.ts (cobranza a clientes) — misma
 * estructura, mismo patrón atómico de escritura (writeBatch).
 */
import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { SupplierPayment, PaymentMethod } from "../models/SupplierPayment";
import * as purchaseService from "./purchaseService";

function supplierPaymentsCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "supplierPayments");
}

export async function getPayments(): Promise<SupplierPayment[]> {
  const snap = await getDocs(supplierPaymentsCollectionRef());
  return snap.docs.map((d) => d.data() as SupplierPayment);
}

export async function getPaymentById(id: string): Promise<SupplierPayment | undefined> {
  return (await getPayments()).find((p) => p.id === id);
}

export async function getPaymentsBySupplier(supplierId: string): Promise<SupplierPayment[]> {
  return (await getPayments()).filter((p) => p.supplierId === supplierId);
}

export async function updatePayment(id: string, updates: Partial<Omit<SupplierPayment, "id" | "supplierId" | "createdAt">>): Promise<void> {
  const current = await getPaymentById(id);
  if (!current) {
    throw new Error(`Pago no encontrado: ${id}`);
  }
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "supplierPayments", id), updates, { merge: true });
}

export interface RegisterSupplierPaymentInput {
  supplierId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  originInstitution?: string;
  destinationInstitution?: string;
  note?: string;
}

export async function registerPayment(input: RegisterSupplierPaymentInput): Promise<SupplierPayment> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("El monto del pago debe ser un número mayor a cero.");
  }

  const supplier = await purchaseService.getSupplierById(input.supplierId);
  if (!supplier) {
    throw new Error(`Proveedor no encontrado: ${input.supplierId}`);
  }

  const safeCurrentBalance = Number.isFinite(supplier.balance) ? (supplier.balance as number) : 0;
  const newBalance = Math.round((safeCurrentBalance - input.amount) * 100) / 100;

  const payment: SupplierPayment = {
    id: crypto.randomUUID(),
    supplierId: input.supplierId,
    amount: input.amount,
    method: input.method,
    paymentDate: input.paymentDate,
    referenceNumber: input.referenceNumber,
    originInstitution: input.originInstitution,
    destinationInstitution: input.destinationInstitution,
    note: input.note,
    createdAt: new Date().toISOString(),
  };

  // Atómico: si uno de los dos escritos falla, no se aplica ninguno —
  // mismo motivo que en paymentService.ts (evita saldo desincronizado
  // del registro de pago si se interrumpe a la mitad).
  const batch = writeBatch(db);
  batch.set(doc(db, "businesses", CURRENT_BUSINESS_ID, "suppliers", input.supplierId), {
    ...supplier,
    balance: newBalance,
  });
  batch.set(doc(db, "businesses", CURRENT_BUSINESS_ID, "supplierPayments", payment.id), payment);
  await batch.commit();

  return payment;
}