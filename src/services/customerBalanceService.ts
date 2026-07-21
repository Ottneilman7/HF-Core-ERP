/**
 * Servicio: Saldo real de Cliente (Cuentas por Cobrar)
 *
 * Mismo patrón que rawMaterialInventoryService (ADR-005): customers.ts
 * sigue siendo la semilla; localStorage guarda el override vigente de
 * `balance`. Customer.ts (el modelo) no se toca.
 */
import type { Customer } from "../models/Customer";
import { customers as seedCustomers } from "../data/customers";

interface BalanceOverride {
  balance: number;
  updatedAt: string;
}

const OVERRIDES_KEY = "hf_customer_balance_overrides";

function readOverrides(): Record<string, BalanceOverride> {
  const raw = localStorage.getItem(OVERRIDES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, BalanceOverride>;
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Record<string, BalanceOverride>): void {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

export function getEffectiveCustomers(): Customer[] {
  const overrides = readOverrides();
  return seedCustomers.map((c) => {
    const override = overrides[c.id];
    if (!override) return c;
    return { ...c, balance: override.balance };
  });
}

export function getCustomerById(id: string): Customer | undefined {
  return getEffectiveCustomers().find((c) => c.id === id);
}

/** Suma (o resta, con monto negativo) al saldo vigente del cliente. */
export function adjustBalance(customerId: string, amount: number): void {
  const current = getCustomerById(customerId);
  if (!current) {
    throw new Error(`Cliente no encontrado: ${customerId}`);
  }
  const overrides = readOverrides();
  overrides[customerId] = {
    balance: current.balance + amount,
    updatedAt: new Date().toISOString(),
  };
  writeOverrides(overrides);
}