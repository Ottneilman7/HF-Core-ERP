/**
 * Servicio: Dashboards — BP-050
 * Agrega datos de ventas, compras, producción y merma para gráficos.
 * Todo se calcula en el navegador desde Firestore — sin colección nueva.
 */
import * as invoiceService from "./invoiceService";
import * as salesService from "./salesService";
import * as customerBalanceService from "./customerBalanceService";
import * as purchaseService from "./purchaseService";
import * as wasteLogService from "./wasteLogService";
import * as recipeStockService from "./recipeStockService";

export type Period = "weekly" | "monthly" | "quarterly" | "semiannual" | "annual";

export const PERIOD_LABELS: Record<Period, string> = {
  weekly: "Última semana", monthly: "Último mes",
  quarterly: "Último trimestre", semiannual: "Último semestre", annual: "Último año",
};

function periodStart(period: Period): Date {
  const now = new Date();
  const start = new Date(now);
  switch (period) {
    case "weekly":    start.setDate(now.getDate() - 7); break;
    case "monthly":   start.setMonth(now.getMonth() - 1); break;
    case "quarterly": start.setMonth(now.getMonth() - 3); break;
    case "semiannual":start.setMonth(now.getMonth() - 6); break;
    case "annual":    start.setFullYear(now.getFullYear() - 1); break;
  }
  return start;
}

export interface BarDatum { name: string; total: number; secondary?: number; }

// ─── VENTAS ───────────────────────────────────────────────────────────────────

export async function salesByCustomer(period: Period): Promise<BarDatum[]> {
  const [invoices, customers] = await Promise.all([
    invoiceService.getInvoices(), customerBalanceService.getEffectiveCustomers(),
  ]);
  const since = periodStart(period);
  const totals = new Map<string, number>();
  for (const inv of invoices) {
    if (new Date(inv.createdAt) < since) continue;
    totals.set(inv.customerId, (totals.get(inv.customerId) ?? 0) + inv.total);
  }
  return [...totals.entries()]
    .map(([id, total]) => ({ name: customers.find((c) => c.id === id)?.businessName ?? id, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total).slice(0, 10);
}

export async function salesByProduct(period: Period): Promise<BarDatum[]> {
  const [sales, recipes] = await Promise.all([
    salesService.getSales(), recipeStockService.getEffectiveRecipes(),
  ]);
  const since = periodStart(period);
  const totals = new Map<string, number>();
  for (const sale of sales) {
    if (sale.status === "voided" || new Date(sale.createdAt) < since) continue;
    for (const item of sale.items) {
      const id = item.productId ?? item.componentRecipeId ?? item.rawMaterialId ?? "";
      if (!id) continue;
      totals.set(id, (totals.get(id) ?? 0) + item.quantity);
    }
  }
  return [...totals.entries()]
    .map(([id, total]) => {
      // Busca la receta por id (BP-048: productId = recipe.id) o por productId legacy
      const recipe = recipes.find((r) => r.id === id || r.productId === id);
      return { name: recipe?.name ?? recipe?.code ?? id, total };
    })
    .filter((d) => d.name && !/^\d+$/.test(d.name)) // excluir IDs numéricos sin nombre
    .sort((a, b) => b.total - a.total).slice(0, 10);
}

export async function customersByZone(): Promise<BarDatum[]> {
  const customers = await customerBalanceService.getEffectiveCustomers();
  const totals = new Map<string, number>();
  for (const c of customers.filter((c) => c.active)) {
    const z = c.city || "Sin ciudad";
    totals.set(z, (totals.get(z) ?? 0) + 1);
  }
  return [...totals.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
}

// ─── COMPRAS ──────────────────────────────────────────────────────────────────

/** Concentración de compras por proveedor — ideal para detectar dependencia >60% */
export async function purchasesBySupplier(period: Period): Promise<BarDatum[]> {
  const [orders, suppliers] = await Promise.all([
    purchaseService.getPurchaseOrders(), purchaseService.getSuppliers(),
  ]);
  const since = periodStart(period);
  const totals = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "voided" || new Date(o.purchaseDate ?? o.createdAt) < since) continue;
    const lineTotal = o.items.reduce((s, i) => {
      const base = i.quantity * i.unitCost;
      return s + (i.isVatExempt ? base : base * 1.16);
    }, 0);
    totals.set(o.supplierId, (totals.get(o.supplierId) ?? 0) + lineTotal);
  }
  return [...totals.entries()]
    .map(([id, total]) => {
      const sup = suppliers.find((s) => s.id === id);
      return { name: sup?.tradeName ?? sup?.name ?? id, total: Math.round(total * 100) / 100 };
    })
    .sort((a, b) => b.total - a.total);
}

/** Materias primas más compradas (por cantidad en gramos) en el período */
export async function purchasesByMaterial(period: Period): Promise<BarDatum[]> {
  const [orders, recipes, rawMaterials] = await Promise.all([
    purchaseService.getPurchaseOrders(),
    recipeStockService.getEffectiveRecipes(),
    (await import("./rawMaterialInventoryService")).getEffectiveRawMaterials(),
  ]);
  const since = periodStart(period);
  const totals = new Map<string, { name: string; qty: number }>();
  for (const o of orders) {
    if (o.status === "voided" || new Date(o.purchaseDate ?? o.createdAt) < since) continue;
    for (const item of o.items) {
      const id = item.rawMaterialId ?? item.componentRecipeId ?? item.finishedProductId ?? item.customItemName ?? "";
      if (!id) continue;
      const existing = totals.get(id);
      // Busca nombre en rawMaterials primero, luego recipes, luego customItemName
      const rawMat = rawMaterials.find((m) => m.id === item.rawMaterialId);
      const recipe = recipes.find((r) => r.id === item.componentRecipeId || r.id === item.finishedProductId);
      const name = rawMat?.name ?? item.customItemName ?? recipe?.name ?? recipe?.code ?? id;
      totals.set(id, { name, qty: (existing?.qty ?? 0) + item.quantity });
    }
  }
  return [...totals.values()]
    .filter((d) => !/^\d+$/.test(d.name)) // excluir IDs numéricos sin nombre
    .map(({ name, qty }) => ({ name, total: Math.round(qty * 10) / 10 }))
    .sort((a, b) => b.total - a.total).slice(0, 10);
}

// ─── MERMA ────────────────────────────────────────────────────────────────────

/** Merma total por producto — proceso + error, en el período */
export async function wasteByProduct(period: Period): Promise<BarDatum[]> {
  const entries = await wasteLogService.getWasteLog();
  const since = periodStart(period);
  // Agrupa por NOMBRE (no por ID) para que proceso + error del mismo producto se sumen
  const totals = new Map<string, { process: number; error: number }>();
  for (const e of entries) {
    if (new Date(e.createdAt) < since) continue;
    const name = e.recipeName ?? e.itemName ?? e.recipeId ?? "otro";
    const ex = totals.get(name) ?? { process: 0, error: 0 };
    if (e.type === "process") ex.process += e.wasteQuantity;
    else ex.error += e.wasteQuantity;
    totals.set(name, ex);
  }
  return [...totals.entries()]
    .map(([name, { process, error }]) => ({
      name,
      total: Math.round((process + error) * 100) / 100,
      secondary: Math.round(error * 100) / 100, // para tooltip detallado
    }))
    .sort((a, b) => b.total - a.total).slice(0, 10);
}