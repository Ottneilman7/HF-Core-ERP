/**
 * Servicio: Dashboards. Agrega ventas/facturas/clientes por período y
 * dimensión (Cliente, Producto, Zona) — todo se calcula en el navegador
 * a partir de lo que ya está en Firestore, sin nueva colección.
 */
import * as invoiceService from "./invoiceService";
import * as salesService from "./salesService";
import * as customerBalanceService from "./customerBalanceService";
import { products } from "../data/products";

export type Period = "weekly" | "monthly" | "quarterly" | "semiannual" | "annual";

function periodStart(period: Period): Date {
  const now = new Date();
  const start = new Date(now);
  switch (period) {
    case "weekly": start.setDate(now.getDate() - 7); break;
    case "monthly": start.setMonth(now.getMonth() - 1); break;
    case "quarterly": start.setMonth(now.getMonth() - 3); break;
    case "semiannual": start.setMonth(now.getMonth() - 6); break;
    case "annual": start.setFullYear(now.getFullYear() - 1); break;
  }
  return start;
}

export interface BarDatum {
  name: string;
  total: number;
}

/** Ventas totales (monto de factura) agrupadas por cliente, en el período. */
export async function salesByCustomer(period: Period): Promise<BarDatum[]> {
  const [invoices, customers] = await Promise.all([invoiceService.getInvoices(), customerBalanceService.getEffectiveCustomers()]);
  const since = periodStart(period);
  const totals = new Map<string, number>();

  for (const inv of invoices) {
    if (new Date(inv.createdAt) < since) continue;
    totals.set(inv.customerId, (totals.get(inv.customerId) ?? 0) + inv.total);
  }

  return [...totals.entries()]
    .map(([customerId, total]) => ({
      name: customers.find((c) => c.id === customerId)?.businessName ?? customerId,
      total: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

/** Unidades vendidas por producto terminado, en el período (rotación). */
export async function salesByProduct(period: Period): Promise<BarDatum[]> {
  const sales = await salesService.getSales();
  const since = periodStart(period);
  const totals = new Map<string, number>();

  for (const sale of sales) {
    if (sale.status === "voided") continue;
    if (new Date(sale.createdAt) < since) continue;
    for (const item of sale.items) {
      if (!item.productId) continue;
      totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
    }
  }

  return [...totals.entries()]
    .map(([productId, qty]) => ({
      name: products.find((p) => p.id === productId)?.name ?? productId,
      total: qty,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Cantidad de clientes activos por ciudad (zona). No depende de período — es una foto de hoy. */
export async function customersByZone(): Promise<BarDatum[]> {
  const customers = await customerBalanceService.getEffectiveCustomers();
  const totals = new Map<string, number>();

  for (const c of customers.filter((c) => c.active)) {
    const zone = c.city || "Sin ciudad";
    totals.set(zone, (totals.get(zone) ?? 0) + 1);
  }

  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}