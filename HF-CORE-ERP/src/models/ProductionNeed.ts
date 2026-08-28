// ProductionNeed.ts
// Representa la necesidad de UNA materia prima para producir una cantidad
// determinada de un producto, según su receta activa.


export interface ProductionNeed {
  sourceId: string;          // rawMaterialId o recipeId (semielaborado)
  sourceType: "rawMaterial" | "recipeStock";
  name: string;
  category?: string;         // para elegir ícono en la UI
  requiredQuantity: number;
  unit: string;
  availableStock: number;
  isSufficient: boolean;
  shortfall: number;
  remainingStock: number;
  belowMinimumAfterProduction: boolean;
}