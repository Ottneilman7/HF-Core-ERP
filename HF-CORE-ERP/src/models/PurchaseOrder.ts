// BP-044: se agrega finishedProductId y customItemName para soportar
// compra de Producto Terminado y "Otro" (ítem libre sin catálogo).
export type PurchaseOrderStatus = "ordered" | "received" | "voided";
export type PaymentTerm = "cash" | "credit";

export interface PurchaseOrderItem {
  rawMaterialId?: string;       // Materia prima del catálogo
  componentRecipeId?: string;   // Semielaborado comprado ya hecho (emergencia)
  finishedProductId?: string;   // Producto terminado para revender (BP-044)
  customItemName?: string;      // "Otro" — ítem libre sin catálogo (BP-044)
  customItemUnit?: string;      // Unidad del ítem libre
  quantity: number;
  unitCost: number;
  isVatExempt?: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  purchaseDate: string;
  supplierInvoiceNumber?: string;
  paymentTerm: PaymentTerm;
  createdAt: string;
  receivedAt?: string;
}