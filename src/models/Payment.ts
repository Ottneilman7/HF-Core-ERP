export type PaymentMethod = "cash" | "transfer" | "mobile_payment" | "check" | "card" | "crypto";

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string; // fecha/hora en que ocurrió el pago (para conciliar) — la indica el usuario
  referenceNumber?: string;
  originInstitution?: string; // banco/entidad del cliente que paga
  destinationInstitution?: string; // banco/entidad donde se recibió
  proofUrl?: string; // URL de descarga en Firebase Storage
  proofFileName?: string;
  note?: string;
  createdAt: string; // ISO date — cuándo se REGISTRÓ en el sistema, no cuándo se pagó
}