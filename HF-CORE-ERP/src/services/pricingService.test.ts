import { describe, it, expect } from "vitest";
import {
  allocateFixedCostsByMaterialCost,
  allocateFixedCostsByTime,
  calculateFixedCosts,
  calculateSuggestedPrice,
  calculateRealMargin,
  calculateBreakEven,
  calculateRecipeMaterialUnitCost,
} from "./pricingService";
import type { Recipe } from "../models/Recipe";
import type { RawMaterial } from "../models/RawMaterial";
import type { CostingSettings } from "../models/BusinessParameters";

describe("pricingService — Método 1 (prorrateo por materia prima)", () => {
  // Caso exacto del documento del CFO: Granola y Barras, CIF total $460
  it("reproduce el ejemplo del CFO (Granola 67.65%, $1.94 CIF unitario)", () => {
    const products = [
      { recipeId: "granola", name: "Granola (400g)", targetProduction: 160, materialUnitCost: 2.51 },
      { recipeId: "barra-classic", name: "Barra Classic (50g)", targetProduction: 120, materialUnitCost: 0.75 },
      { recipeId: "barra-recovery", name: "Barra Recovery", targetProduction: 60, materialUnitCost: 0.90 },
      { recipeId: "barra-energy", name: "Barra Energy", targetProduction: 60, materialUnitCost: 0.80 },
    ];

    const result = allocateFixedCostsByMaterialCost(products, 460);

    const granola = result.find((r) => r.recipeId === "granola")!;
    expect(granola.materialTotalCost).toBeCloseTo(401.6, 2);
    expect(granola.participationPercentage * 100).toBeCloseTo(67.65, 1);
    expect(granola.cifAssigned).toBeCloseTo(311.19, 1);
    expect(granola.cifUnitCost).toBeCloseTo(1.94, 1); // el doc del CFO ya viene redondeado en cada paso intermedio

    const classic = result.find((r) => r.recipeId === "barra-classic")!;
    expect(classic.cifUnitCost).toBeCloseTo(0.58, 2);

    const totalCifAssigned = result.reduce((sum, r) => sum + r.cifAssigned, 0);
    expect(totalCifAssigned).toBeCloseTo(460, 0); // no se debe perder ni sobrar dinero al repartir
  });
});

describe("pricingService — Método 2 (ABC por tiempo)", () => {
  it("calcula tasa por hora y CIF unitario según tiempo del lote", () => {
    const products = [
      {
        recipeId: "torta-decorada",
        name: "Torta decorada",
        targetProduction: 10,
        materialUnitCost: 5,
        manufacturingTimeMinutes: 120, // 2 horas por lote
        batchYieldUnits: 1, // el lote rinde 1 torta
      },
    ];
    // Tasa = 460 / 160 horas = $2.875/hora
    const result = allocateFixedCostsByTime(products, 460, 160);
    const torta = result[0];
    // CIF unitario = (2h * 2.875) / 1 = $5.75
    expect(torta.cifUnitCost).toBeCloseTo(5.75, 2);
    expect(torta.totalUnitCost).toBeCloseTo(10.75, 2);
  });
});

describe("pricingService — costos fijos y precio sugerido", () => {
  it("calcula la cuota mensual de ROI y el total de costos fijos", () => {
    const settings: CostingSettings = {
      roi: { equipmentAmount: 3600, toolsAmount: 400, paybackMonths: 24 }, // (3600+400)/24 = 166.67
      cif: { laborCost: 100, servicesCost: 50, rentCost: 100, otherCosts: [{ id: "1", label: "Internet", monthlyAmount: 20 }] },
      marketing: { monthlyAmount: 40 },
      allocationMethod: "direct_cost_proration",
    };
    const breakdown = calculateFixedCosts(settings);
    expect(breakdown.roiMonthly).toBeCloseTo(166.67, 1);
    expect(breakdown.cifMonthly).toBe(270); // 100+50+100+20
    expect(breakdown.marketingMonthly).toBe(40);
    expect(breakdown.totalFixedCosts).toBeCloseTo(476.67, 1);
  });

  it("usa MARGEN REAL, no markup: precio = costo / (1 - margen)", () => {
    // costo total $2.51+$1.94=$4.45, margen deseado 30%
    const price = calculateSuggestedPrice(4.45, 0.30);
    expect(price).toBeCloseTo(6.36, 2);
    // el margen real efectivo de ese precio debe dar exactamente 30%, no ~23% como un markup
    const realMargin = calculateRealMargin(4.45, price);
    expect(realMargin).toBeCloseTo(0.30, 2);
  });

  it("rechaza un margen inválido (>= 100% o negativo)", () => {
    expect(() => calculateSuggestedPrice(4.45, 1)).toThrow();
    expect(() => calculateSuggestedPrice(4.45, -0.1)).toThrow();
  });
});

describe("pricingService — punto de equilibrio", () => {
  it("calcula unidades combinadas necesarias para cubrir costos fijos", () => {
    const products = [
      { targetProduction: 160, materialUnitCost: 2.51, sellingPrice: 6.36 },
      { targetProduction: 120, materialUnitCost: 0.75, sellingPrice: 2.0 },
    ];
    const result = calculateBreakEven(products, 460);
    expect(result.breakEvenUnits).toBeGreaterThan(0);
    expect(result.projectedTotalUnits).toBe(280);
    expect(typeof result.isViable).toBe("boolean");
  });

  it("lanza error si el precio promedio no cubre el costo variable", () => {
    const products = [{ targetProduction: 100, materialUnitCost: 5, sellingPrice: 4 }]; // vendiendo con pérdida
    expect(() => calculateBreakEven(products, 460)).toThrow();
  });
});

describe("pricingService — costo de materia prima recursivo (semielaborados)", () => {
  it("calcula el costo de una receta simple (solo materia prima directa)", () => {
    const rawMaterials: RawMaterial[] = [
      { id: "avena", code: "MP-01", name: "Avena", category: "Cereal", unit: "g", supplier: "X", currentStock: 1000, minimumStock: 100, unitCost: 0.002, active: true },
    ];
    const recipe: Recipe = {
      id: "granola", code: "R-01", version: 1, yieldQuantity: 400, yieldUnit: "g", active: true,
      items: [{ rawMaterialId: "avena", quantity: 400, unit: "g" }],
    };
    // 400g de avena a $0.002/g = $0.80, entre 400g de rendimiento = $0.002/g de producto
    const unitCost = calculateRecipeMaterialUnitCost(recipe, rawMaterials, [recipe]);
    expect(unitCost).toBeCloseTo(0.002, 4);
  });

  it("calcula el costo de una receta que usa un semielaborado (recursivo)", () => {
    const rawMaterials: RawMaterial[] = [
      { id: "avena", code: "MP-01", name: "Avena", category: "Cereal", unit: "g", supplier: "X", currentStock: 1000, minimumStock: 100, unitCost: 0.002, active: true },
    ];
    const base: Recipe = {
      id: "base", code: "R-BASE", version: 1, yieldQuantity: 1000, yieldUnit: "g", active: true, tracksInventory: true,
      items: [{ rawMaterialId: "avena", quantity: 1000, unit: "g" }],
    }; // $0.002/g
    const final: Recipe = {
      id: "granola-bar", code: "R-02", version: 1, yieldQuantity: 50, yieldUnit: "g", active: true,
      items: [{ componentRecipeId: "base", quantity: 50, unit: "g" }],
    };
    const unitCost = calculateRecipeMaterialUnitCost(final, rawMaterials, [base, final]);
    expect(unitCost).toBeCloseTo(0.002, 4);
  });

  it("detecta ciclos (receta que se referencia indirectamente a sí misma)", () => {
    const a: Recipe = { id: "a", code: "A", version: 1, yieldQuantity: 10, yieldUnit: "g", active: true, items: [{ componentRecipeId: "b", quantity: 1, unit: "g" }] };
    const b: Recipe = { id: "b", code: "B", version: 1, yieldQuantity: 10, yieldUnit: "g", active: true, items: [{ componentRecipeId: "a", quantity: 1, unit: "g" }] };
    expect(() => calculateRecipeMaterialUnitCost(a, [], [a, b])).toThrow();
  });
});