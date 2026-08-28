// recipes.ts — recetas reales de Honestly Foods (BP-011/012)
//
// Dos semielaborados con inventario propio (tracksInventory: true): al
// usarse dentro de otra receta (ej. una barra), el cálculo verifica su
// stock y NO los desarma en sus propios ingredientes. Cuando se calcula
// la receta del semielaborado directamente (ej. producir más Granola en
// alguna de sus presentaciones), sí se desarma hasta materia prima real.
//
// ⚠️ currentStock/minimumStock de los semielaborados son PLACEHOLDER (0) —
// el CEO debe cargarlos desde la app con el inventario real de granola y
// mantequilla de maní ya producidos.

import type { Recipe } from "../models/Recipe";

export const recipes: Recipe[] = [
  // --- Semielaborados con inventario propio ---
  {
    id: "granola-base",
    code: "GRANOLA_BASE",
    name: "Granola Tradicional (a granel)",
    version: 1,
    yieldQuantity: 3200,
    yieldUnit: "Gramos",
    active: true,
    tracksInventory: true,
    unit: "Gramos",
    currentStock: 0,   // ⚠️ placeholder
    minimumStock: 500, // ⚠️ placeholder
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
    id: "peanut-butter",
    code: "PEANUT_BUTTER",
    name: "Honestly Peanut Butter (a granel)",
    version: 1,
    yieldQuantity: 100,
    yieldUnit: "Gramos",
    active: true,
    tracksInventory: true,
    unit: "Gramos",
    currentStock: 0,   // ⚠️ placeholder
    minimumStock: 200, // ⚠️ placeholder
    // Presentaciones de venta: por definir con el CEO (Backlog, BP-012)
    items: [
      { rawMaterialId: "5", quantity: 90, unit: "g" },
      { rawMaterialId: "10", quantity: 8, unit: "g" },
      { rawMaterialId: "9", quantity: 2, unit: "g" },
    ],
  },

  // --- Presentaciones vendibles de Granola (BP-012) ---
  // Fórmula derivada proporcionalmente de GRANOLA_BASE (misma receta, escalada
  // al tamaño del paquete). Se registran aparte porque, a diferencia de una
  // barra, aquí SÍ interesa ver el detalle de materia prima al planear producción.
  {
    id: "hg-t050", code: "HG_T050", productId: "4", version: 1,
    yieldQuantity: 1, yieldUnit: "Paquete (50g)", active: true,
    items: [
      { rawMaterialId: "1", quantity: 25, unit: "g" },
      { rawMaterialId: "4", quantity: 7.8125, unit: "g" },
      { rawMaterialId: "5", quantity: 4.6875, unit: "g" },
      { rawMaterialId: "6", quantity: 3.125, unit: "g" },
      { rawMaterialId: "7", quantity: 3.125, unit: "g" },
      { rawMaterialId: "14", quantity: 3.125, unit: "g" },
      { rawMaterialId: "8", quantity: 23.4375, unit: "g" },
      { rawMaterialId: "9", quantity: 0.234375, unit: "g" },
    ],
  },
  {
    id: "hg-t200", code: "HG_T200", productId: "5", version: 1,
    yieldQuantity: 1, yieldUnit: "Paquete (200g)", active: true,
    items: [
      { rawMaterialId: "1", quantity: 100, unit: "g" },
      { rawMaterialId: "4", quantity: 31.25, unit: "g" },
      { rawMaterialId: "5", quantity: 18.75, unit: "g" },
      { rawMaterialId: "6", quantity: 12.5, unit: "g" },
      { rawMaterialId: "7", quantity: 12.5, unit: "g" },
      { rawMaterialId: "14", quantity: 12.5, unit: "g" },
      { rawMaterialId: "8", quantity: 93.75, unit: "g" },
      { rawMaterialId: "9", quantity: 0.9375, unit: "g" },
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

  // --- Barras (usan Granola y Peanut Butter como semielaborados, no los desarman) ---
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
  {
    id: "2", code: "HB_R1", productId: "2", version: 1,
    yieldQuantity: 1, yieldUnit: "Barra (50g)", active: true,
    items: [
      { componentRecipeId: "granola-base", quantity: 22, unit: "g" },
      { rawMaterialId: "12", quantity: 5, unit: "g" },
      { rawMaterialId: "11", quantity: 3, unit: "g" },
      { componentRecipeId: "peanut-butter", quantity: 12, unit: "g" },
      { rawMaterialId: "2", quantity: 8, unit: "g" },
    ],
  },
  {
    id: "3", code: "HB_E1", productId: "3", version: 1,
    yieldQuantity: 1, yieldUnit: "Barra (50g)", active: true,
    items: [
      { componentRecipeId: "granola-base", quantity: 21, unit: "g" },
      { rawMaterialId: "14", quantity: 5, unit: "g" },
      { componentRecipeId: "peanut-butter", quantity: 10, unit: "g" },
      { rawMaterialId: "2", quantity: 7, unit: "g" },
      { rawMaterialId: "13", quantity: 7, unit: "g" },
    ],
  },
];