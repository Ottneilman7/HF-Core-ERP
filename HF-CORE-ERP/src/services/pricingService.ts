/**
 * Servicio: Costeo y Precios (Parte B del módulo, BP-XXX)
 *
 * Implementa la lógica funcional documentada por el CFO del negocio en
 * "Documentación Arquitectónica: Módulo de Costos y Precios":
 *
 * - Método 1 (predeterminado): prorrateo de costos fijos por participación
 *   en el costo de materia prima total.
 * - Método 2 (ABC Lite): prorrateo por tiempo de manufactura, para negocios
 *   donde la mano de obra pesa más que el insumo (ej. repostería artística).
 * - Precio de venta sugerido, usando MARGEN REAL (no markup) — ver
 *   HF-Core-ERP-Knowledge/99_Archive/metodologia_calculo_precios_y_finanzas.md,
 *   sección "Markup vs Margen Real": el margen se calcula sobre el PRECIO
 *   de venta, no sobre el costo. Fórmula: precio = costo / (1 - margen).
 * - Punto de equilibrio combinado (varios productos, costo variable
 *   promedio ponderado).
 *
 * Este archivo es lógica pura (sin Firestore, sin UI) — recibe datos ya
 * cargados y devuelve resultados. Así se puede probar con datos en
 * memoria (ver pricingService.test.ts) sin necesitar el emulador de
 * Firestore, seas la Parte C (UI) haga los cálculos "en vivo" mientras
 * el usuario itera.
 */
import type { Recipe } from "../models/Recipe";
import type { RawMaterial } from "../models/RawMaterial";
import type { CostingSettings } from "../models/BusinessParameters";

export class PricingCalculationError extends Error {}

// ---------------------------------------------------------------------
// 1) Costo de materia prima por unidad de receta (recursivo — soporta
//    semielaborados usados como ingrediente de otra receta)
// ---------------------------------------------------------------------

/**
 * Costo de materia prima por UNIDAD de yieldUnit de la receta (ej. costo
 * por cada 400g de Granola). Recorre recursivamente los componentRecipeId
 * (semielaborados), igual que hace productionCalculatorService para
 * calcular consumo, pero aquí para costo. Detecta ciclos por seguridad.
 */
export function calculateRecipeMaterialUnitCost(
  recipe: Recipe,
  rawMaterials: RawMaterial[],
  allRecipes: Recipe[],
  visiting: Set<string> = new Set()
): number {
  if (visiting.has(recipe.id)) {
    throw new PricingCalculationError(`Ciclo detectado en la receta ${recipe.code}: se referencia a sí misma indirectamente.`);
  }
  if (recipe.yieldQuantity <= 0) {
    throw new PricingCalculationError(`La receta ${recipe.code} tiene yieldQuantity inválido.`);
  }
  const nextVisiting = new Set(visiting).add(recipe.id);

  let totalCost = 0;
  for (const item of recipe.items) {
    if (item.rawMaterialId) {
      const rm = rawMaterials.find((m) => m.id === item.rawMaterialId);
      if (!rm) throw new PricingCalculationError(`Materia prima no encontrada: ${item.rawMaterialId} (usada en ${recipe.code}).`);
      totalCost += item.quantity * rm.unitCost;
    } else if (item.componentRecipeId) {
      const component = allRecipes.find((r) => r.id === item.componentRecipeId);
      if (!component) throw new PricingCalculationError(`Receta componente no encontrada: ${item.componentRecipeId} (usada en ${recipe.code}).`);
      const componentUnitCost = calculateRecipeMaterialUnitCost(component, rawMaterials, allRecipes, nextVisiting);
      totalCost += item.quantity * componentUnitCost;
    }
  }
  return totalCost / recipe.yieldQuantity;
}

// ---------------------------------------------------------------------
// 2) Costos fijos totales mensuales (ROI + CIF + Marketing)
// ---------------------------------------------------------------------

export interface FixedCostsBreakdown {
  roiMonthly: number;
  cifMonthly: number;
  marketingMonthly: number;
  totalFixedCosts: number;
}

export function calculateFixedCosts(settings: CostingSettings): FixedCostsBreakdown {
  const roiMonthly = settings.roi.paybackMonths > 0
    ? (settings.roi.equipmentAmount + settings.roi.toolsAmount) / settings.roi.paybackMonths
    : 0;

  const otherCostsTotal = (settings.cif.otherCosts ?? []).reduce((sum, c) => sum + c.monthlyAmount, 0);
  const cifMonthly = (settings.cif.laborCost ?? 0) + (settings.cif.servicesCost ?? 0) + (settings.cif.rentCost ?? 0) + otherCostsTotal;

  const marketingMonthly = settings.marketing.monthlyAmount ?? 0;

  return {
    roiMonthly,
    cifMonthly,
    marketingMonthly,
    totalFixedCosts: roiMonthly + cifMonthly + marketingMonthly,
  };
}

// ---------------------------------------------------------------------
// 3) Prorrateo — Método 1: por participación en costo de materia prima
// ---------------------------------------------------------------------

export interface ProductForAllocation {
  recipeId: string;
  name: string;
  targetProduction: number;   // unidades a producir en el mes (Recipe.targetProduction)
  materialUnitCost: number;   // de calculateRecipeMaterialUnitCost
  manufacturingTimeMinutes?: number; // solo para Método 2
}

export interface ProductAllocationResult {
  recipeId: string;
  name: string;
  targetProduction: number;
  materialUnitCost: number;
  materialTotalCost: number;
  participationPercentage: number; // 0–1
  cifAssigned: number;
  cifUnitCost: number;
  totalUnitCost: number; // materialUnitCost + cifUnitCost
}

/**
 * Método 1 (predeterminado). Replica exactamente el ejemplo del CFO
 * (Granola/Barras, $460 de costos fijos → Granola absorbe 67.65%).
 */
export function allocateFixedCostsByMaterialCost(
  products: ProductForAllocation[],
  totalFixedCosts: number
): ProductAllocationResult[] {
  if (products.length === 0) return [];
  const withTotals = products.map((p) => ({ ...p, materialTotalCost: p.targetProduction * p.materialUnitCost }));
  const grandTotal = withTotals.reduce((sum, p) => sum + p.materialTotalCost, 0);

  return withTotals.map((p) => {
    const participationPercentage = grandTotal > 0 ? p.materialTotalCost / grandTotal : 0;
    const cifAssigned = totalFixedCosts * participationPercentage;
    const cifUnitCost = p.targetProduction > 0 ? cifAssigned / p.targetProduction : 0;
    return {
      recipeId: p.recipeId,
      name: p.name,
      targetProduction: p.targetProduction,
      materialUnitCost: p.materialUnitCost,
      materialTotalCost: p.materialTotalCost,
      participationPercentage,
      cifAssigned,
      cifUnitCost,
      totalUnitCost: p.materialUnitCost + cifUnitCost,
    };
  });
}

// ---------------------------------------------------------------------
// 4) Prorrateo — Método 2: ABC Lite, por tiempo de manufactura
// ---------------------------------------------------------------------

/**
 * Método 2 (casos especiales — ej. repostería decorada). Requiere que el
 * negocio haya indicado `totalOperativeHoursMonthly` y que cada receta
 * tenga `manufacturingTimeMinutes` (tiempo del LOTE completo, no por
 * unidad — se divide entre yieldQuantity al final).
 */
export function allocateFixedCostsByTime(
  products: (ProductForAllocation & { batchYieldUnits: number })[],
  totalFixedCosts: number,
  totalOperativeHoursMonthly: number
): ProductAllocationResult[] {
  if (totalOperativeHoursMonthly <= 0) {
    throw new PricingCalculationError("Debes indicar las horas operativas mensuales totales para usar el método por tiempo.");
  }
  const cifRatePerHour = totalFixedCosts / totalOperativeHoursMonthly;

  return products.map((p) => {
    const batchTimeHours = (p.manufacturingTimeMinutes ?? 0) / 60;
    const cifUnitCost = p.batchYieldUnits > 0 ? (batchTimeHours * cifRatePerHour) / p.batchYieldUnits : 0;
    const cifAssigned = cifUnitCost * p.targetProduction;
    const materialTotalCost = p.targetProduction * p.materialUnitCost;
    return {
      recipeId: p.recipeId,
      name: p.name,
      targetProduction: p.targetProduction,
      materialUnitCost: p.materialUnitCost,
      materialTotalCost,
      participationPercentage: totalFixedCosts > 0 ? cifAssigned / totalFixedCosts : 0,
      cifAssigned,
      cifUnitCost,
      totalUnitCost: p.materialUnitCost + cifUnitCost,
    };
  });
}

// ---------------------------------------------------------------------
// 5) Precio de venta sugerido — MARGEN REAL (sobre precio, no sobre costo)
// ---------------------------------------------------------------------

/**
 * precio = costo / (1 - margen). Ej.: costo $2.51, margen deseado 30%
 * → precio = 2.51 / 0.70 = $3.59 (el margen real sobre ESE precio sí da 30%,
 * a diferencia de un markup del 30% sobre costo, que da un margen real de
 * solo ~23%). Ver metodologia_calculo_precios_y_finanzas.md.
 */
export function calculateSuggestedPrice(totalUnitCost: number, targetMarginPercentage: number): number {
  if (targetMarginPercentage >= 1 || targetMarginPercentage < 0) {
    throw new PricingCalculationError("El margen debe ser un número entre 0 y menor a 1 (ej. 0.30 para 30%).");
  }
  return totalUnitCost / (1 - targetMarginPercentage);
}

/** Margen real efectivo que resulta de un precio ya definido (para cuando el usuario mete el precio manual en vez del margen). */
export function calculateRealMargin(totalUnitCost: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  return (sellingPrice - totalUnitCost) / sellingPrice;
}

// ---------------------------------------------------------------------
// 6) Punto de equilibrio combinado
// ---------------------------------------------------------------------

export interface BreakEvenResult {
  breakEvenUnits: number;   // unidades combinadas (todos los productos) para cubrir costos fijos
  totalFixedCosts: number;
  avgUnitVariableCost: number; // promedio ponderado por producción proyectada
  avgUnitPrice: number;        // promedio ponderado por producción proyectada
  projectedTotalUnits: number; // suma de targetProduction de todos los productos
  isViable: boolean;            // projectedTotalUnits >= breakEvenUnits
}

export interface ProductForBreakEven {
  targetProduction: number;
  materialUnitCost: number; // costo variable unitario (materia prima)
  sellingPrice: number;
}

export function calculateBreakEven(products: ProductForBreakEven[], totalFixedCosts: number): BreakEvenResult {
  const projectedTotalUnits = products.reduce((sum, p) => sum + p.targetProduction, 0);
  if (projectedTotalUnits <= 0) {
    throw new PricingCalculationError("Necesitas al menos un producto con producción proyectada mayor a cero.");
  }

  const avgUnitVariableCost = products.reduce((sum, p) => sum + p.materialUnitCost * p.targetProduction, 0) / projectedTotalUnits;
  const avgUnitPrice = products.reduce((sum, p) => sum + p.sellingPrice * p.targetProduction, 0) / projectedTotalUnits;

  const contributionMargin = avgUnitPrice - avgUnitVariableCost;
  if (contributionMargin <= 0) {
    throw new PricingCalculationError("El precio de venta promedio no cubre el costo variable promedio — el punto de equilibrio es infinito con estos precios.");
  }

  const breakEvenUnits = totalFixedCosts / contributionMargin;

  return {
    breakEvenUnits,
    totalFixedCosts,
    avgUnitVariableCost,
    avgUnitPrice,
    projectedTotalUnits,
    isViable: projectedTotalUnits >= breakEvenUnits,
  };
}

/**
 * Puntos (x = unidades vendidas, y = monto $) para graficar las 2 líneas
 * del Break-Even Chart (Parte D). Genera un rango razonable alrededor del
 * punto de equilibrio para que el gráfico se vea bien sin importar la escala.
 */
export interface BreakEvenChartPoint {
  units: number;
  totalCosts: number;
  totalRevenue: number;
}

export function buildBreakEvenChartData(breakEven: BreakEvenResult, steps = 20): BreakEvenChartPoint[] {
  const maxUnits = Math.max(breakEven.breakEvenUnits, breakEven.projectedTotalUnits) * 1.5;
  const stepSize = maxUnits / steps;
  const points: BreakEvenChartPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const units = stepSize * i;
    points.push({
      units,
      totalCosts: breakEven.totalFixedCosts + units * breakEven.avgUnitVariableCost,
      totalRevenue: units * breakEven.avgUnitPrice,
    });
  }
  return points;
}