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
  createdAt: string;
}