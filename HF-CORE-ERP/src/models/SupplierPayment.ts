import type { PaymentMethod } from "./Payment";

export type { PaymentMethod };

/**
 * Modelo: Pago a Proveedor (Cuentas por Pagar, BP-XXX).
 * Espejo exacto de Payment.ts (cobranza a clientes), aplicado al lado
 * de compras — misma forma, mismos campos, para mantener consistencia.
 */
export interface SupplierPayment {
  id: string;
  supplierId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string; // fecha/hora real en que se hizo el pago al proveedor
  referenceNumber?: string;
  originInstitution?: string; // banco/entidad propia desde donde se pagó
  destinationInstitution?: string; // banco/entidad del proveedor que recibió
  note?: string;
  createdAt: string; // ISO date — cuándo se REGISTRÓ en el sistema
}