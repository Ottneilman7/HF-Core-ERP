export type PurchaseOrderStatus = "ordered" | "received" | "voided";
export type PaymentTerm = "cash" | "credit";

/**
 * ADR-007: un ítem de compra puede ser materia prima directa
 * (`rawMaterialId`) o un semielaborado con inventario propio comprado
 * ya hecho (`componentRecipeId`) — nunca ambos a la vez.
 *
 * BP-037: se agrega `isVatExempt` (algunos alimentos crudos están
 * exentos de IVA por ley, otros no) — dato contable por ítem, no por
 * orden completa, porque una misma compra puede mezclar ambos.
 *
 * `quantity` y `unitCost` SIEMPRE se guardan en la unidad base del
 * catálogo (Gramos) — la conversión Kg↔Gr que ve el usuario ocurre en
 * la UI (PurchasesPage), no aquí, para no romper el cálculo de
 * producción que ya asume Gramos en todo el sistema.
 */
export interface PurchaseOrderItem {
  rawMaterialId?: string;
  componentRecipeId?: string;
  quantity: number;
  unitCost: number;
  isVatExempt?: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  purchaseDate: string; // fecha de la FACTURA del proveedor (para contabilidad), no de creación del registro
  supplierInvoiceNumber?: string; // N° de factura del proveedor
  paymentTerm: PaymentTerm; // contado o crédito
  createdAt: string; // ISO date — cuándo se registró en el sistema
  receivedAt?: string; // ISO date
}