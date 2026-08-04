/**
 * Servicio: Cobranza. Registra datos completos del pago (método,
 * referencia, instituciones). El comprobante (foto/PDF) queda pendiente
 * de conectar a Firebase Storage — por ahora se guarda solo el registro
 * de texto, sin archivo (ver nota en FinancePage.tsx).
 */
import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Payment, PaymentMethod } from "../models/Payment";
import * as customerBalanceService from "./customerBalanceService";

function paymentsCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "payments");
}

export async function getPayments(): Promise<Payment[]> {
  const snap = await getDocs(paymentsCollectionRef());
  return snap.docs.map((d) => d.data() as Payment);
}

export async function getPaymentById(id: string): Promise<Payment | undefined> {
  return (await getPayments()).find((p) => p.id === id);
}

export async function getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
  return (await getPayments()).filter((p) => p.customerId === customerId);
}

export async function updatePayment(id: string, updates: Partial<Omit<Payment, "id" | "customerId" | "createdAt">>): Promise<void> {
  const current = await getPaymentById(id);
  if (!current) {
    throw new Error(`Pago no encontrado: ${id}`);
  }
  await setDoc(doc(db, "businesses", CURRENT_BUSINESS_ID, "payments", id), updates, { merge: true });
}

export interface RegisterPaymentInput {
  customerId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string; // fecha/hora real del pago, la indica el usuario
  referenceNumber?: string;
  originInstitution?: string;
  destinationInstitution?: string;
  note?: string;
}

export async function registerPayment(input: RegisterPaymentInput): Promise<Payment> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("El monto del pago debe ser un número mayor a cero.");
  }

  const customer = await customerBalanceService.getCustomerById(input.customerId);
  if (!customer) {
    throw new Error(`Cliente no encontrado: ${input.customerId}`);
  }

  const safeCurrentBalance = Number.isFinite(customer.balance) ? customer.balance : 0;
  const newBalance = Math.round((safeCurrentBalance - input.amount) * 100) / 100;

  const payment: Payment = {
    id: crypto.randomUUID(),
    customerId: input.customerId,
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
  // evita el caso real (Fit Market) donde el saldo cambió pero el pago
  // nunca quedó registrado, por interrumpirse entre los dos pasos.
  const batch = writeBatch(db);
  batch.set(doc(db, "businesses", CURRENT_BUSINESS_ID, "customers", input.customerId), {
    ...customer,
    balance: newBalance,
  });
  batch.set(doc(db, "businesses", CURRENT_BUSINESS_ID, "payments", payment.id), payment);
  await batch.commit();

  return payment;
}