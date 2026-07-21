export type PaymentType = "cash" | "credit";

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  customerId: string;
  items: SaleItem[];
  paymentType: PaymentType;
  total: number;
  createdAt: string; // ISO date
}