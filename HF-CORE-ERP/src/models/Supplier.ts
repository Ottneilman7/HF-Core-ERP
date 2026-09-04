export interface Supplier {
  id: string;
  name: string; // Razón social
  tradeName?: string; // Denominación comercial
  taxId?: string; // RIF/CI
  contactName?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  /** Cuentas por Pagar (BP-XXX): cuánto le debemos, en $. Ausente en
   * proveedores creados antes de esta fecha — tratar como 0 (mismo
   * patrón defensivo que Customer.balance en todo el código). */
  balance?: number;
  createdAt: string;
}