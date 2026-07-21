/**
 * Servicio: Ventas (Flujo 5 — Clientes → Venta → Factura → Inventario)
 *
 * Una "Sale" cumple el rol de Venta y Factura a la vez (80/20: no se
 * construye un documento de factura formal/PDF en esta entrega — ver
 * Backlog en BP-019).
 */
import type { Sale, SaleItem, PaymentType } from "../models/Sale";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";
import * as customerBalanceService from "./customerBalanceService";

const SALES_KEY = "hf_sales";

function readSales(): Sale[] {
  const raw = localStorage.getItem(SALES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Sale[];
  } catch {
    return [];
  }
}

function writeSales(sales: Sale[]): void {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

export function getSales(): Sale[] {
  return readSales();
}

/**
 * Registra una venta: valida stock suficiente de TODOS los ítems antes
 * de aplicar cualquier cambio (todo o nada — no se descuenta stock de
 * un ítem si otro va a fallar), descuenta inventario de producto
 * terminado y, si es a crédito, aumenta el saldo del cliente.
 */
export function createSale(customerId: string, items: SaleItem[], paymentType: PaymentType): Sale {
  if (items.length === 0) {
    throw new Error("Una venta necesita al menos un ítem.");
  }

  for (const item of items) {
    const stock = finishedGoodsInventoryService.getStock(item.productId);
    if (item.quantity > stock) {
      throw new Error(`Inventario insuficiente para el producto ${item.productId} (disponible: ${stock}).`);
    }
  }

  items.forEach((item) => finishedGoodsInventoryService.decreaseStock(item.productId, item.quantity));

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  if (paymentType === "credit") {
    customerBalanceService.adjustBalance(customerId, total);
  }

  const sale: Sale = {
    id: crypto.randomUUID(),
    customerId,
    items,
    paymentType,
    total,
    createdAt: new Date().toISOString(),
  };
  writeSales([...readSales(), sale]);
  return sale;
}