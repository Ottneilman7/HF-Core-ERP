export type PaymentType = "cash" | "credit";
export type SaleStatus = "active" | "voided";

export interface SaleItem {
  productId?: string;
  componentRecipeId?: string;
  rawMaterialId?: string;
  quantity: number;
  unitPrice: number;
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