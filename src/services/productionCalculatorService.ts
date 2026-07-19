// productionCalculatorService.ts
//
// BP-011/012/014. Tres capacidades:
// 1) Alertas generales de inventario (materia prima + semielaborados), sin
//    depender de ninguna simulación — alimentan el Centro de Decisiones.
// 2) Cálculo de necesidad para UNA receta (calculateProductionNeeds).
// 3) Orden de Producción Diaria: varias líneas (distintos SKU) calculadas
//    y consolidadas en una sola lista de "qué sacar del almacén hoy"
//    (calculateProductionOrder) — y, si falta un semielaborado (Granola,
//    Peanut Butter), sugerencia de cuánto producir de más y con qué
//    ingredientes (getExtraProductionSuggestions).

import type { ProductionNeed } from "../models/ProductionNeed";
import type { RawMaterial } from "../models/RawMaterial";
import type { Recipe } from "../models/Recipe";

export class ProductionCalculationError extends Error {}

const MAX_RECIPE_DEPTH = 5;

// ---------------------------------------------------------------------
// 1) Alertas generales (Centro de Decisiones)
// ---------------------------------------------------------------------

export function getLowStockRawMaterials(rawMaterials: RawMaterial[]): RawMaterial[] {
  return rawMaterials.filter((rm) => rm.active && rm.currentStock < rm.minimumStock);
}

export function getLowStockTrackedRecipes(recipes: Recipe[]): Recipe[] {
  return recipes.filter(
    (r) => r.active && r.tracksInventory && (r.currentStock ?? 0) < (r.minimumStock ?? 0)
  );
}

// ---------------------------------------------------------------------
// 2) Resolución de necesidades (motor interno, compartido)
// ---------------------------------------------------------------------

export function getActiveRecipe(recipes: Recipe[], productId: string): Recipe {
  const activeRecipes = recipes.filter((r) => r.productId === productId && r.active);
  if (activeRecipes.length === 0) {
    throw new ProductionCalculationError(`No existe una receta activa para el producto ${productId}.`);
  }
  return activeRecipes.reduce((latest, current) => (current.version > latest.version ? current : latest));
}

/** Busca una receta por su id interno (para semielaborados sin productId, ej. planear más Granola). */
export function getRecipeById(recipes: Recipe[], recipeId: string): Recipe {
  const recipe = recipes.find((r) => r.id === recipeId && r.active);
  if (!recipe) {
    throw new ProductionCalculationError(`No existe (o no está activa) la receta ${recipeId}.`);
  }
  return recipe;
}

interface RawRequirement {
  sourceId: string;
  sourceType: "rawMaterial" | "recipeStock";
  quantity: number;
  unit: string;
}

function resolveRequirements(
  recipe: Recipe,
  quantityToProduce: number,
  recipes: Recipe[],
  acc: Map<string, RawRequirement> = new Map(),
  depth = 0
): Map<string, RawRequirement> {
  if (depth > MAX_RECIPE_DEPTH) {
    throw new ProductionCalculationError(
      `Profundidad máxima de receta excedida en ${recipe.code} — posible referencia circular.`
    );
  }
  if (!recipe.yieldQuantity || recipe.yieldQuantity <= 0) {
    throw new ProductionCalculationError(`La receta ${recipe.code} tiene un yieldQuantity inválido.`);
  }

  const batches = quantityToProduce / recipe.yieldQuantity;

  for (const item of recipe.items) {
    const itemQty = batches * item.quantity;

    if (item.rawMaterialId) {
      addRequirement(acc, `rm:${item.rawMaterialId}`, {
        sourceId: item.rawMaterialId,
        sourceType: "rawMaterial",
        quantity: itemQty,
        unit: item.unit,
      });
    } else if (item.componentRecipeId) {
      const subRecipe = recipes.find((r) => r.id === item.componentRecipeId && r.active);
      if (!subRecipe) {
        throw new ProductionCalculationError(
          `Receta componente ${item.componentRecipeId} no existe o está inactiva (referenciada desde ${recipe.code}).`
        );
      }
      if (subRecipe.tracksInventory) {
        addRequirement(acc, `rc:${subRecipe.id}`, {
          sourceId: subRecipe.id,
          sourceType: "recipeStock",
          quantity: itemQty,
          unit: item.unit,
        });
      } else {
        resolveRequirements(subRecipe, itemQty, recipes, acc, depth + 1);
      }
    } else {
      throw new ProductionCalculationError(
        `Ítem de receta en ${recipe.code} no tiene rawMaterialId ni componentRecipeId.`
      );
    }
  }

  return acc;
}

function addRequirement(acc: Map<string, RawRequirement>, key: string, req: RawRequirement) {
  const existing = acc.get(key);
  if (existing) {
    if (existing.unit !== req.unit) {
      throw new ProductionCalculationError(
        `Unidades inconsistentes para ${req.sourceId}: ${existing.unit} vs ${req.unit}.`
      );
    }
    existing.quantity += req.quantity;
  } else {
    acc.set(key, req);
  }
}

function buildProductionNeeds(
  resolved: Map<string, RawRequirement>,
  rawMaterials: RawMaterial[],
  recipes: Recipe[]
): ProductionNeed[] {
  return Array.from(resolved.values()).map((req): ProductionNeed => {
    let name: string;
    let category: string | undefined;
    let availableStock: number;
    let minimumStock: number;

    if (req.sourceType === "rawMaterial") {
      const rawMaterial = rawMaterials.find((rm) => rm.id === req.sourceId);
      if (!rawMaterial) {
        throw new ProductionCalculationError(`Materia prima ${req.sourceId} no existe en el catálogo.`);
      }
      name = rawMaterial.name;
      category = rawMaterial.category;
      availableStock = rawMaterial.currentStock;
      minimumStock = rawMaterial.minimumStock;
    } else {
      const componentRecipe = recipes.find((r) => r.id === req.sourceId);
      if (!componentRecipe) {
        throw new ProductionCalculationError(`Receta semielaborada ${req.sourceId} no existe.`);
      }
      name = componentRecipe.name ?? componentRecipe.code;
      category = "Semielaborado";
      availableStock = componentRecipe.currentStock ?? 0;
      minimumStock = componentRecipe.minimumStock ?? 0;
    }

    const isSufficient = availableStock >= req.quantity;
    const remainingStock = availableStock - req.quantity;

    return {
      sourceId: req.sourceId,
      sourceType: req.sourceType,
      name,
      category,
      requiredQuantity: req.quantity,
      unit: req.unit,
      availableStock,
      isSufficient,
      shortfall: isSufficient ? 0 : req.quantity - availableStock,
      remainingStock,
      belowMinimumAfterProduction: remainingStock < minimumStock,
    };
  });
}

// ---------------------------------------------------------------------
// 3) Cálculo para UNA receta (se mantiene por compatibilidad y para
//    calcular "producción extra" de un semielaborado)
// ---------------------------------------------------------------------

export function calculateProductionNeeds(
  recipe: Recipe,
  quantityToProduce: number,
  rawMaterials: RawMaterial[],
  recipes: Recipe[]
): ProductionNeed[] {
  if (quantityToProduce <= 0) {
    throw new ProductionCalculationError(`La cantidad a producir debe ser mayor que cero.`);
  }
  const resolved = resolveRequirements(recipe, quantityToProduce, recipes);
  return buildProductionNeeds(resolved, rawMaterials, recipes);
}

export function getShortages(needs: ProductionNeed[]): ProductionNeed[] {
  return needs.filter((n) => !n.isSufficient);
}

export function getLowStockWarnings(needs: ProductionNeed[]): ProductionNeed[] {
  return needs.filter((n) => n.isSufficient && n.belowMinimumAfterProduction);
}

// ---------------------------------------------------------------------
// 4) Orden de Producción Diaria (BP-014) — varias líneas, un solo resultado
// ---------------------------------------------------------------------

export interface ProductionOrderLine {
  productId: string;
  quantity: number;
}

export function calculateProductionOrder(
  lines: ProductionOrderLine[],
  rawMaterials: RawMaterial[],
  recipes: Recipe[]
): ProductionNeed[] {
  const acc = new Map<string, RawRequirement>();

  for (const line of lines) {
    if (line.quantity <= 0) continue;
    const recipe = getActiveRecipe(recipes, line.productId);
    resolveRequirements(recipe, line.quantity, recipes, acc);
  }

  return buildProductionNeeds(acc, rawMaterials, recipes);
}

export interface ExtraProductionSuggestion {
  recipeId: string;
  recipeName: string;
  missingQuantity: number;
  unit: string;
  ingredients: ProductionNeed[];
}

/**
 * Para cada semielaborado insuficiente en la orden consolidada (ej. falta
 * Granola), calcula cuánto habría que producir de más y con qué materia
 * prima — usando la propia receta base del semielaborado.
 */
export function getExtraProductionSuggestions(
  consolidatedNeeds: ProductionNeed[],
  rawMaterials: RawMaterial[],
  recipes: Recipe[]
): ExtraProductionSuggestion[] {
  const shortages = consolidatedNeeds.filter((n) => n.sourceType === "recipeStock" && !n.isSufficient);

  return shortages.map((need) => {
    const recipe = getRecipeById(recipes, need.sourceId);
    const ingredients = calculateProductionNeeds(recipe, need.shortfall, rawMaterials, recipes);
    return {
      recipeId: recipe.id,
      recipeName: need.name,
      missingQuantity: need.shortfall,
      unit: need.unit,
      ingredients,
    };
  });
}

// ---------------------------------------------------------------------
// Mensajes accionables (presentación de texto, no de íconos — eso va en UI)
// ---------------------------------------------------------------------

export function toDecisionMessage(need: ProductionNeed): string {
  return `No tienes suficiente ${need.name} — faltan ${need.shortfall.toFixed(2)} ${need.unit}.`;
}

export function toLowStockWarning(need: ProductionNeed): string {
  return `${need.name} quedará bajo el mínimo después de esta producción (${need.remainingStock.toFixed(2)} ${need.unit} restantes).`;
}

export function toRestockMessage(name: string, unit: string, currentStock: number, minimumStock: number): string {
  const missing = minimumStock - currentStock;
  return `Faltan ${missing.toFixed(2)} ${unit} de ${name} (hay ${currentStock.toFixed(2)}, mínimo ${minimumStock.toFixed(2)}).`;
}

/**
 * ¿Cuánto puedo producir de esta receta con el stock actual? (BP-014, feedback CEO)
 * Toma la necesidad de UN lote completo (yieldQuantity) y ve cuál materia
 * prima/semielaborado es el más limitante (menor stock relativo a lo que pide).
 */
export function calculateMaxProducible(
  recipe: Recipe,
  rawMaterials: RawMaterial[],
  recipes: Recipe[]
): number {
  const perBatchNeeds = calculateProductionNeeds(recipe, recipe.yieldQuantity, rawMaterials, recipes);

  let minRatio = Infinity;
  for (const need of perBatchNeeds) {
    if (need.requiredQuantity <= 0) continue;
    const ratio = need.availableStock / need.requiredQuantity;
    if (ratio < minRatio) minRatio = ratio;
  }

  if (!isFinite(minRatio)) return 0;
  return Math.max(0, minRatio * recipe.yieldQuantity);
}