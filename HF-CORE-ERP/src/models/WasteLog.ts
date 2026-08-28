export type WasteType = "process" | "error";
export type WasteReason = "burned" | "spill" | "expired" | "mishandling" | "other";

export interface WasteLogEntry {
  id: string;
  type: WasteType;

  // Tipo A — merma de proceso
  recipeId?: string;
  recipeName?: string;
  plannedQuantity?: number;
  actualQuantity?: number;

  // Tipo B — merma por error
  rawMaterialId?: string;
  componentRecipeId?: string;
  productId?: string;
  itemName?: string;
  reason?: WasteReason;
  note?: string;

  wasteQuantity: number;
  unit: string;
  createdAt: string;
}