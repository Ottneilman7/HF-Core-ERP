// Sale.ts — BP-047: se agrega isVatExempt en SaleItem para que la
// factura pueda calcular IVA solo sobre los ítems que corresponde.
export type PaymentType = "cash" | "credit";
export type SaleStatus = "active" | "voided";

export interface SaleItem {
  productId?: string;
  componentRecipeId?: string;
  rawMaterialId?: string;
  quantity: number;
  unitPrice: number;
  isVatExempt?: boolean; // true = este ítem no genera IVA (ej. materia prima, alimentos básicos)
}

export interface Sale {
  id: string;
  customerId: string;
  items: SaleItem[];
  paymentType: PaymentType;
  total: number;
  status: SaleStatus;
  createdAt: string;
}