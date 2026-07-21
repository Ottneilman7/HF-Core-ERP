/**
 * Servicio: Inventario de Producto Terminado
 *
 * Product.ts no tiene (ni tenía) campo de stock — a diferencia de
 * RawMaterial. No se le agrega uno (Regla 1: no tocar el modelo
 * existente); el stock de producto terminado vive completo en
 * localStorage, arrancando en 0 para todo producto que no se le haya
 * indicado lo contrario.
 *
 * `increaseStock` hoy se usa desde el "puente manual" de SalesPage
 * (ver ADR-006) mientras Producción no ejecuta su Fase 2 (BP-014:
 * confirmar producción y sumar inventario real). Cuando esa Fase 2 se
 * construya, llamará a esta misma función — no habrá que tocar este
 * servicio.
 */
const STOCK_KEY = "hf_finishedgoods_stock";

function readStock(): Record<string, number> {
  const raw = localStorage.getItem(STOCK_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function writeStock(stock: Record<string, number>): void {
  localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
}

export function getStock(productId: string): number {
  return readStock()[productId] ?? 0;
}

export function getAllStock(): Record<string, number> {
  return readStock();
}

export function increaseStock(productId: string, quantity: number): void {
  const stock = readStock();
  stock[productId] = (stock[productId] ?? 0) + quantity;
  writeStock(stock);
}

export function decreaseStock(productId: string, quantity: number): void {
  const current = getStock(productId);
  if (quantity > current) {
    throw new Error(`Inventario insuficiente del producto ${productId} (disponible: ${current}).`);
  }
  const stock = readStock();
  stock[productId] = current - quantity;
  writeStock(stock);
}