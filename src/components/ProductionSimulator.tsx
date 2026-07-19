// ProductionSimulator.tsx
//
// Componente de Nivel Operativo, embebido en RecipesPage. El usuario
// ingresa cuánto quiere producir; delega el cálculo (ahora recursivo,
// BP-011) al servicio y reporta el resultado al Centro de Decisiones.

import { useState } from "react";
import type { Recipe } from "../models/Recipe";
import type { RawMaterial } from "../models/RawMaterial";
import {
  getActiveRecipe,
  calculateProductionNeeds,
  getShortages,
  getLowStockWarnings,
} from "../services/productionCalculatorService";
import { useProductionAlerts } from "../contexts/ProductionAlertsContext";

interface ProductionSimulatorProps {
  productId: string;
  productName: string;
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
}

export function ProductionSimulator({
  productId,
  productName,
  recipes,
  rawMaterials,
}: ProductionSimulatorProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const { reportProductionNeeds } = useProductionAlerts();

  function handleCalculate() {
    setError(null);
    try {
      const recipe = getActiveRecipe(recipes, productId);
      const needs = calculateProductionNeeds(recipe, quantity, rawMaterials, recipes);
      reportProductionNeeds(
        productId,
        productName,
        getShortages(needs),
        getLowStockWarnings(needs)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    }
  }

  return (
    <div style={{ marginTop: "12px", padding: "8px 0" }}>
      <label style={{ display: "block", marginBottom: "8px" }}>
        ¿Cuánto quieres producir?
        <input
          type="number"
          min={0}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          style={{
            display: "block",
            marginTop: "6px",
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </label>
      <button
        onClick={handleCalculate}
        style={{
          padding: "6px 14px",
          fontSize: "13px",
          borderRadius: "6px",
          border: "none",
          background: "#2E7D32",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Calcular materia prima
      </button>
      {error && (
        <p style={{ color: "#c62828", marginTop: "8px" }}>{error}</p>
      )}
    </div>
  );
}
