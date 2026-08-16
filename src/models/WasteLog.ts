export type WasteType = "process" | "error";

export interface WasteLogEntry {
  id: string;
  type: WasteType;
  recipeId?: string;
  recipeName?: string;
  plannedQuantity?: number;
  actualQuantity?: number;
  wasteQuantity: number;
  unit: string;
  reason?: string; // para merma por error (Entrega B)
  createdAt: string;
}