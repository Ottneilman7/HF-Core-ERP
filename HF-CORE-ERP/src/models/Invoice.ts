// Invoice.ts — BP-047: InvoiceLine ahora distingue si el ítem es
// exento de IVA, para que la factura refleje correctamente la base
// imponible real vs. el monto exento.

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isVatExempt?: boolean; // true = este ítem no entra en la base imponible
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
  exemptAmount: number;    // suma de lineTotals exentos — no genera IVA
  baseImponible: number;   // suma de lineTotals gravados — sobre esto se calcula el IVA
  ivaPercentage: number;
  ivaAmount: number;       // baseImponible * ivaPercentage / 100
  total: number;           // exemptAmount + baseImponible + ivaAmount (monto fiscal completo)
  retentionFraction: number;
  retainedAmount: number;
  netAmountDue: number;    // total - retainedAmount (lo que el cliente paga de verdad)
  createdAt: string;
}