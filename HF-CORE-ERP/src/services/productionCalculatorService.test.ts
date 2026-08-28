// productionCalculatorService.test.ts — BP-011/012, datos reales

import { describe, it, expect } from "vitest";
import {
  getLowStockRawMaterials,
  getLowStockTrackedRecipes,
  getActiveRecipe,
  calculateProductionNeeds,
  getShortages,
  ProductionCalculationError,
} from "./productionCalculatorService";
import type { Recipe } from "../models/Recipe";
import type { RawMaterial } from "../models/RawMaterial";

const rawMaterials: RawMaterial[] = [
  { id: "1", code: "MP-0001", name: "Avena", category: "Cereal", unit: "Gramos", supplier: "", currentStock: 12000, minimumStock: 3000, unitCost: 0.00222, active: true },
  { id: "2", code: "MP-0002", name: "Miel", category: "Endulzante", unit: "Gramos", supplier: "", currentStock: 500, minimumStock: 1000, unitCost: 0.01, active: true },
  { id: "4", code: "MP-0004", name: "Coco", category: "Fruto Seco", unit: "Gramos", supplier: "", currentStock: 1000, minimumStock: 500, unitCost: 0.00095, active: true },
  { id: "5", code: "MP-0005", name: "Maní", category: "Fruto Seco", unit: "Gramos", supplier: "", currentStock: 1000, minimumStock: 500, unitCost: 0.005, active: true },
  { id: "6", code: "MP-0006", name: "Ajonjolí", category: "Semilla", unit: "Gramos", supplier: "", currentStock: 1000, minimumStock: 300, unitCost: 0.00567, active: true },
  { id: "7", code: "MP-0007", name: "Uvas Pasas", category: "Fruta Deshidratada", unit: "Gramos", supplier: "", currentStock: 1000, minimumStock: 300, unitCost: 0.00755, active: true },
  { id: "8", code: "MP-0008", name: "Papelón", category: "Endulzante", unit: "Gramos", supplier: "", currentStock: 5000, minimumStock: 1500, unitCost: 0.00128, active: true },
  { id: "9", code: "MP-0009", name: "Sal", category: "Condimento", unit: "Gramos", supplier: "", currentStock: 500, minimumStock: 200, unitCost: 0.0015, active: true },
  { id: "10", code: "MP-0010", name: "Aceite de coco", category: "Grasa", unit: "Gramos", supplier: "", currentStock: 500, minimumStock: 200, unitCost: 0.01235, active: true },
  { id: "14", code: "MP-0014", name: "Fruit Roll", category: "Fruta Deshidratada", unit: "Gramos", supplier: "", currentStock: 300, minimumStock: 200, unitCost: 0, active: true },
];

const recipes: Recipe[] = [
  {
    id: "granola-base", code: "GRANOLA_BASE", name: "Granola Tradicional (a granel)",
    version: 1, yieldQuantity: 3200, yieldUnit: "Gramos", active: true,
    tracksInventory: true, unit: "Gramos", currentStock: 100, minimumStock: 500,
    items: [
      { rawMaterialId: "1", quantity: 1600, unit: "g" },
      { rawMaterialId: "4", quantity: 500, unit: "g" },
      { rawMaterialId: "5", quantity: 300, unit: "g" },
      { rawMaterialId: "6", quantity: 200, unit: "g" },
      { rawMaterialId: "7", quantity: 200, unit: "g" },
      { rawMaterialId: "14", quantity: 200, unit: "g" },
      { rawMaterialId: "8", quantity: 1500, unit: "g" },
      { rawMaterialId: "9", quantity: 15, unit: "g" },
    ],
  },
  {
    id: "peanut-butter", code: "PEANUT_BUTTER", name: "Honestly Peanut Butter (a granel)",
    version: 1, yieldQuantity: 100, yieldUnit: "Gramos", active: true,
    tracksInventory: true, unit: "Gramos", currentStock: 50, minimumStock: 200,
    items: [
      { rawMaterialId: "5", quantity: 90, unit: "g" },
      { rawMaterialId: "10", quantity: 8, unit: "g" },
      { rawMaterialId: "9", quantity: 2, unit: "g" },
    ],
  },
  {
    id: "hg-t400", code: "HG_T400", productId: "6", version: 1,
    yieldQuantity: 1, yieldUnit: "Paquete (400g)", active: true,
    items: [
      { rawMaterialId: "1", quantity: 200, unit: "g" },
      { rawMaterialId: "4", quantity: 62.5, unit: "g" },
      { rawMaterialId: "5", quantity: 37.5, unit: "g" },
      { rawMaterialId: "6", quantity: 25, unit: "g" },
      { rawMaterialId: "7", quantity: 25, unit: "g" },
      { rawMaterialId: "14", quantity: 25, unit: "g" },
      { rawMaterialId: "8", quantity: 187.5, unit: "g" },
      { rawMaterialId: "9", quantity: 1.875, unit: "g" },
    ],
  },
  {
    id: "1", code: "HB_C1", productId: "1", version: 2,
    yieldQuantity: 1, yieldUnit: "Barra (50g)", active: true,
    items: [
      { componentRecipeId: "granola-base", quantity: 25, unit: "g" },
      { componentRecipeId: "peanut-butter", quantity: 12, unit: "g" },
      { rawMaterialId: "2", quantity: 8, unit: "g" },
      { rawMaterialId: "14", quantity: 5, unit: "g" },
    ],
  },
];

describe("Barra (HB_C1): NO se desarma la Granola ni el Peanut Butter", () => {
  it("500 barras -> exactamente 4 necesidades: Granola, Peanut Butter, Miel, Fruit Roll", () => {
    const recipe = getActiveRecipe(recipes, "1");
    const needs = calculateProductionNeeds(recipe, 500, rawMaterials, recipes);

    expect(needs).toHaveLength(4);
    expect(needs.map((n) => n.name).sort()).toEqual(
      ["Fruit Roll", "Granola Tradicional (a granel)", "Honestly Peanut Butter (a granel)", "Miel"].sort()
    );

    // No debe aparecer Avena, Coco, Maní, Ajonjolí, Papelón, Sal (ingredientes internos de Granola/PB)
    const names = needs.map((n) => n.name);
    expect(names).not.toContain("Avena");
    expect(names).not.toContain("Coco");
    expect(names).not.toContain("Papelón");
  });

  it("la Granola se verifica como stock insuficiente, con sourceType recipeStock", () => {
    const recipe = getActiveRecipe(recipes, "1");
    const needs = calculateProductionNeeds(recipe, 500, rawMaterials, recipes);
    const granola = needs.find((n) => n.sourceId === "granola-base")!;

    expect(granola.sourceType).toBe("recipeStock");
    expect(granola.requiredQuantity).toBe(500 * 25); // 12500g
    expect(granola.isSufficient).toBe(false); // stock de prueba: 100g
    expect(getShortages(needs).map((n) => n.name)).toContain("Granola Tradicional (a granel)");
  });
});

describe("Granola 400g (HG_T400): SÍ se desarma hasta materia prima", () => {
  it("36 paquetes (3 docenas) -> necesidades son materia prima real, no la Granola misma", () => {
    const recipe = getActiveRecipe(recipes, "6");
    const needs = calculateProductionNeeds(recipe, 36, rawMaterials, recipes);

    const names = needs.map((n) => n.name);
    expect(names).toContain("Avena");
    expect(names).toContain("Coco");
    expect(names).toContain("Papelón");
    expect(names).not.toContain("Granola Tradicional (a granel)");

    const avena = needs.find((n) => n.name === "Avena")!;
    expect(avena.requiredQuantity).toBe(36 * 200); // 7200g
    expect(avena.sourceType).toBe("rawMaterial");
  });
});

describe("Alertas generales (sin simulación)", () => {
  it("detecta Granola y Peanut Butter bajo mínimo directamente del catálogo", () => {
    const low = getLowStockTrackedRecipes(recipes);
    expect(low.map((r) => r.id).sort()).toEqual(["granola-base", "peanut-butter"]);
  });

  it("detecta Miel bajo mínimo en materia prima", () => {
    const low = getLowStockRawMaterials(rawMaterials);
    expect(low.map((rm) => rm.id)).toContain("2");
  });
});

describe("Errores esperados", () => {
  it("lanza error si no hay receta activa para el producto", () => {
    expect(() => getActiveRecipe(recipes, "999")).toThrow(ProductionCalculationError);
  });

  it("lanza error si quantityToProduce es 0 o negativo", () => {
    const recipe = getActiveRecipe(recipes, "1");
    expect(() => calculateProductionNeeds(recipe, 0, rawMaterials, recipes)).toThrow(ProductionCalculationError);
  });
});