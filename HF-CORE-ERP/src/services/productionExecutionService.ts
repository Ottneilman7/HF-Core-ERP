/**
 * Servicio: Ejecución real de Producción (BP-021 — Producción Fase 2)
 *
 * Cierra el puente manual de ADR-006 (BP-019): en vez de que el
 * emprendedor anote a mano cuánto fabricó, "Confirmar producción" aplica
 * de verdad el efecto: consume materia prima y semielaborados, y suma
 * el resultado a producto terminado vendible o al stock del semielaborado.
 *
 * Reutiliza el motor ya probado de productionCalculatorService
 * (calculateProductionNeeds) sin modificarlo — Regla 1.
 *
 * BP-042: increaseStock de finishedGoodsInventoryService es ahora async
 * (migrado a Firestore) — se agrega await en la llamada correspondiente.
 */
import type { Recipe } from "../models/Recipe";
import { calculateProductionNeeds, ProductionCalculationError } from "./productionCalculatorService";
import * as rawMaterialInventoryService from "./rawMaterialInventoryService";
import * as recipeStockService from "./recipeStockService";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";
import * as wasteLogService from "./wasteLogService";

/**
 * Confirma una producción real. Todo o nada: primero valida que TODO lo
 * necesario (materia prima + semielaborados) esté disponible; si algo
 * falta, no se aplica ningún cambio. Si alcanza, descuenta cada insumo
 * según lo PLANEADO (`quantityToProduce`) y suma al inventario lo
 * REALMENTE OBTENIDO (`actualQuantity`, BP-040 — merma de proceso).
 *
 * Si no se indica `actualQuantity`, se asume igual a lo planeado (sin
 * merma) — compatible con cualquier llamada anterior a este cambio.
 */
export async function confirmProduction(
  recipe: Recipe,
  quantityToProduce: number,
  actualQuantity?: number
): Promise<void> {
  if (quantityToProduce <= 0) {
    throw new ProductionCalculationError("La cantidad a producir debe ser mayor que cero.");
  }
  const producedQuantity = actualQuantity ?? quantityToProduce;
  if (producedQuantity < 0) {
    throw new ProductionCalculationError("La cantidad real obtenida no puede ser negativa.");
  }

  const rawMaterials = await rawMaterialInventoryService.getEffectiveRawMaterials();
  const effectiveRecipes = await recipeStockService.getEffectiveRecipes();

  const needs = calculateProductionNeeds(recipe, quantityToProduce, rawMaterials, effectiveRecipes);

  const shortages = needs.filter((n) => !n.isSufficient);
  if (shortages.length > 0) {
    throw new ProductionCalculationError(
      `No se puede confirmar: falta ${shortages.map((s) => s.name).join(", ")}.`
    );
  }

  // Descontar insumos
  for (const need of needs) {
    if (need.sourceType === "rawMaterial") {
      await rawMaterialInventoryService.consumeStock(need.sourceId, need.requiredQuantity);
    } else {
      await recipeStockService.decreaseStock(need.sourceId, need.requiredQuantity);
    }
  }

  // Sumar al inventario de destino
  if (!recipe.tracksInventory) {
    // Producto terminado → indexado por recipe.id (BP-048: productId eliminado,
    // la receta es el producto — se usa recipe.id como clave en finishedGoods)
    await finishedGoodsInventoryService.increaseStock(recipe.id, producedQuantity);
  } else {
    // Semielaborado con inventario propio → Firestore (ya era async)
    await recipeStockService.increaseStock(recipe.id, producedQuantity);
  }

  // Registrar merma si la hubo (BP-040)
  if (producedQuantity < quantityToProduce) {
    await wasteLogService.logProcessWaste(
      recipe.id,
      recipe.name ?? recipe.code,
      quantityToProduce,
      producedQuantity,
      recipe.yieldUnit
    );
  }
}