// Product.ts — se agrega `code` (SKU real del negocio) sin romper lo existente.
// Regla 1 (TEAM_RULES): campo opcional, todo el código que ya usaba Product sigue funcionando.

export interface Product {
  id: string;
  code?: string; // SKU real, ej. "HB_C1" (BP-011)
  name: string;
  description: string;
  category: string;
  active: boolean;
}