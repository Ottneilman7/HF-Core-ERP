export type RetentionAgentType = "none" | "agent_75" | "agent_100";

export interface Customer {

  id: string;

  code: string;

  businessName: string; // Razón social

  tradeName?: string; // Denominación comercial, si es distinta

  taxId?: string; // RIF o Cédula

  contactName: string;

  phone: string;

  email: string;

  city: string;

  address?: string; // Dirección fiscal/comercial

  customerType: string; // "Persona Natural" | "Persona Jurídica"

  retentionAgentType?: RetentionAgentType;

  creditDays: number;

  creditLimit: number;

  balance: number;

  lastPurchase: string;

  priority: "HIGH" | "MEDIUM" | "LOW";

  active: boolean;

}