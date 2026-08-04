/**
 * Servicio: Clientes y saldo real — Fase Firestore (BP-032).
 * Reemplaza el patrón semilla+overrides de localStorage. Firestore es
 * ahora la única fuente de verdad para el catálogo de clientes.
 */
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Customer } from "../models/Customer";

function customersCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "customers");
}
function customerDocRef(id: string) {
  return doc(db, "businesses", CURRENT_BUSINESS_ID, "customers", id);
}

export async function getEffectiveCustomers(): Promise<Customer[]> {
  const snap = await getDocs(customersCollectionRef());
  return snap.docs.map((d) => d.data() as Customer);
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const snap = await getDoc(customerDocRef(id));
  return snap.exists() ? (snap.data() as Customer) : undefined;
}

export async function createCustomer(
  input: Omit<Customer, "id" | "balance" | "lastPurchase" | "active">
): Promise<Customer> {
  const newCustomer: Customer = {
    ...input,
    id: crypto.randomUUID(),
    balance: 0,
    lastPurchase: "",
    active: true,
  };
  await setDoc(customerDocRef(newCustomer.id), newCustomer);
  return newCustomer;
}

export async function updateCustomer(id: string, updates: Partial<Omit<Customer, "id">>): Promise<void> {
  const current = await getCustomerById(id);
  if (!current) {
    throw new Error(`Cliente no encontrado: ${id}`);
  }
  await setDoc(customerDocRef(id), { ...current, ...updates });
}

export async function adjustBalance(customerId: string, amount: number): Promise<void> {
  const current = await getCustomerById(customerId);
  if (!current) {
    throw new Error(`Cliente no encontrado: ${customerId}`);
  }
  if (!Number.isFinite(amount)) {
    throw new Error(`Monto de ajuste inválido para ${customerId} (probablemente un dato faltante en una factura antigua).`);
  }
  const safeCurrentBalance = Number.isFinite(current.balance) ? current.balance : 0;
  const newBalance = Math.round((safeCurrentBalance + amount) * 100) / 100;
  await setDoc(customerDocRef(customerId), { ...current, balance: newBalance });
}