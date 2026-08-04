export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  number: string;
  saleId: string;
  customerId: string;
  customerName: string;
  customerTaxId?: string;
  customerAddress?: string;
  lines: InvoiceLine[];
  baseImponible: number;
  ivaPercentage: number;
  ivaAmount: number;
  total: number; // baseImponible + ivaAmount (monto fiscal de la factura)
  retentionFraction: number; // 0 | 0.75 | 1 — % de IVA que retiene el cliente
  retainedAmount: number; // ivaAmount * retentionFraction — lo retiene el cliente, no lo cobra Otto
  netAmountDue: number; // lo que el cliente debe pagar de verdad = total - retainedAmount
  createdAt: string;
}