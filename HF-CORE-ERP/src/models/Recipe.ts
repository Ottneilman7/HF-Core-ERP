// Recipe.ts — extendido por BP-011/012 (ADR-004 + Adenda)

export interface RecipeItem {
  rawMaterialId?: string;       // materia prima directa
  componentRecipeId?: string;   // otra receta usada como ingrediente
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  code: string;
  name?: string;            // nombre amigable para mostrar en UI (ej. "Granola Tradicional a Granel")
  productId?: string;       // presente solo si esta receta ES un SKU vendible
  version: number;
  yieldQuantity: number;
  yieldUnit: string;
  items: RecipeItem[];
  active: boolean;

  // Semielaborados con inventario propio (Granola a granel, Peanut Butter):
  // cuando otra receta los usa como componentRecipeId, el cálculo NO los
  // desarma en sus propios ingredientes — solo verifica si hay stock
  // suficiente, igual que con una materia prima. Ver Adenda ADR-004.
  tracksInventory?: boolean;
  unit?: string;             // unidad de este stock (ej. "Gramos")
  currentStock?: number;
  minimumStock?: number;

  // --- Módulo de Costeo/Precios (BP-XXX) ---
  // Todos opcionales: una receta puede no tener aún su precio configurado.
  targetProduction?: number;        // "Producción mínima estimada" mensual, en yieldUnit — base para prorratear CIF y para el punto de equilibrio
  targetMarginPercentage?: number;  // margen deseado para ESTE producto (si no se define, se usa defaultMarginPercentage del negocio)
  manufacturingTimeMinutes?: number; // tiempo de elaboración del LOTE completo (yieldQuantity unidades) — solo se usa si el negocio eligió el método ABC por tiempo
  sellingPrice?: number;            // precio de venta vigente (manual, o aceptado desde el simulador)
}