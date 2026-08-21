import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { getEffectiveRawMaterials } from "../services/rawMaterialInventoryService";
import { getEffectiveRecipes } from "../services/recipeStockService";
import { confirmProduction } from "../services/productionExecutionService";
import {
  calculateProductionNeeds,
  calculateMaxProducible,
  getShortages,
  getLowStockWarnings,
  ProductionCalculationError,
} from "../services/productionCalculatorService";
import type { Recipe } from "../models/Recipe";
import type { ProductionNeed } from "../models/ProductionNeed";
import { getMaterialIcon } from "../utils/materialIcons";
import { useProductionAlerts } from "../contexts/ProductionAlertsContext";

/**
 * Página: Producción (Flujo 4)
 * Ruta: /production
 *
 * BP-048 (fix): se elimina la dependencia de data/recipes.ts y
 * data/products.ts — ambas eran catálogos fijos en código que impedían
 * que las recetas nuevas creadas en /settings/recipes aparecieran aquí.
 *
 * Ahora el selector de productos se construye leyendo directamente de
 * Firestore (recipeStockService.getEffectiveRecipes), igual que el resto
 * del sistema. Cualquier receta activa — nueva o existente — aparece
 * automáticamente en la lista.
 *
 * El nombre del producto viene de recipe.name ?? recipe.code, sin
 * necesitar buscar en products.ts.
 */
export default function ProductionPage() {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [results, setResults] = useState<ProductionNeed[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [actualQuantity, setActualQuantity] = useState<number>(0);

  const { reportProductionNeeds } = useProductionAlerts();

  const loadRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    const recipes = await getEffectiveRecipes();
    const active = recipes.filter((r) => r.active);
    setAllRecipes(active);
    setSelectedId((prev) => prev || active[0]?.id || "");
    setLoadingRecipes(false);
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const selectedRecipe = allRecipes.find((r) => r.id === selectedId);

  function recipeLabel(r: Recipe): string {
    return r.name ?? r.code;
  }

  async function handleCalculate() {
    setError(null);
    setResults(null);
    setConfirmMessage(null);
    if (!selectedRecipe) return;

    try {
      const rawMaterials = await getEffectiveRawMaterials();
      const effectiveRecipes = await getEffectiveRecipes();
      const needs = calculateProductionNeeds(selectedRecipe, quantity, rawMaterials, effectiveRecipes);
      setResults(needs);

      const shortages = getShortages(needs);
      const warnings = getLowStockWarnings(needs);
      const maxProducible = calculateMaxProducible(selectedRecipe, rawMaterials, effectiveRecipes);

      reportProductionNeeds(
        selectedRecipe.id,
        recipeLabel(selectedRecipe),
        shortages,
        warnings,
        maxProducible,
        selectedRecipe.yieldUnit
      );
    } catch (err) {
      setError(err instanceof ProductionCalculationError ? err.message : "Error desconocido.");
    }
  }

  async function handleConfirmProduction() {
    setError(null);
    setConfirmMessage(null);
    if (!selectedRecipe) return;

    try {
      const actual = actualQuantity > 0 ? actualQuantity : quantity;
      await confirmProduction(selectedRecipe, quantity, actual);
      const wasted = quantity - actual;
      setConfirmMessage(
        wasted > 0
          ? `✅ Producción confirmada: se planeó ${quantity} ${selectedRecipe.yieldUnit}, se obtuvieron ${actual} — merma de ${wasted.toFixed(2)} ${selectedRecipe.yieldUnit} registrada.`
          : `✅ Producción confirmada: ${quantity} ${selectedRecipe.yieldUnit} de ${recipeLabel(selectedRecipe)}. Inventario actualizado.`
      );
      setResults(null);
      setQuantity(0);
      setActualQuantity(0);
    } catch (err) {
      setError(err instanceof ProductionCalculationError ? err.message : "Error desconocido.");
    }
  }

  if (loadingRecipes) {
    return <p style={{ color: colors.textMuted, padding: "24px" }}>Cargando recetas...</p>;
  }

  if (allRecipes.length === 0) {
    return (
      <div style={{ padding: "24px", maxWidth: "640px" }}>
        <h1 style={{ color: colors.primary, fontSize: typography.title }}>Producción</h1>
        <p style={{ color: colors.textMuted }}>
          No hay recetas activas todavía.{" "}
          <Link to="/settings/recipes" style={{ color: colors.secondary }}>
            Crea una receta en Configuración →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "640px" }}>
      <h1 style={{ color: colors.primary, fontSize: typography.title, marginBottom: "16px" }}>
        Producción
      </h1>

      <Card>
        <h2 style={{ marginBottom: "12px" }}>¿Qué vas a producir hoy?</h2>

        <label style={{ display: "block", marginBottom: "12px" }}>
          Producto o semielaborado
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setResults(null);
              setError(null);
              setConfirmMessage(null);
            }}
            style={{
              display: "block",
              width: "100%",
              marginTop: "6px",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "15px",
              background: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            {allRecipes.map((r) => (
              <option key={r.id} value={r.id}>{recipeLabel(r)}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", marginBottom: "12px" }}>
          Cantidad {selectedRecipe && `(${selectedRecipe.unit ?? selectedRecipe.yieldUnit})`}
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => {
              setQuantity(Number(e.target.value));
              setResults(null);
            }}
            style={{
              display: "block",
              width: "100%",
              marginTop: "6px",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "16px",
              border: `1px solid ${colors.border}`,
              background: colors.card,
              color: colors.text,
            }}
          />
        </label>

        <button
          onClick={handleCalculate}
          disabled={!selectedRecipe || quantity <= 0}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            borderRadius: "6px",
            border: "none",
            background: colors.primary,
            color: "#fff",
            cursor: "pointer",
            opacity: (!selectedRecipe || quantity <= 0) ? 0.5 : 1,
          }}
        >
          Calcular qué sacar de almacén
        </button>

        <p style={{ color: colors.textMuted, fontSize: "12px", marginTop: "10px" }}>
          El resultado también queda visible en el{" "}
          <Link to="/decisions" style={{ color: colors.secondary }}>Centro de Decisiones</Link>.
        </p>

        {error && <p style={{ color: colors.danger, marginTop: "10px" }}>{error}</p>}
        {confirmMessage && (
          <div style={{ color: colors.primary, marginTop: "10px", fontSize: "14px" }}>
            <p>{confirmMessage}</p>
            <Link to="/waste" style={{ color: colors.secondary, fontSize: "12px" }}>
              Ver historial de merma →
            </Link>
          </div>
        )}
      </Card>

      {results && (
        <Card>
          <h3 style={{ marginBottom: "12px" }}>Qué sacar de almacén</h3>
          {results.map((need) => (
            <div
              key={need.sourceId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderLeft: `4px solid ${need.isSufficient ? colors.primary : colors.danger}`,
                borderRadius: "6px",
                background: "rgba(255,255,255,0.03)",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "20px" }}>{getMaterialIcon(need.category)}</span>
              <span style={{ color: colors.text }}>
                {need.isSufficient ? "✅" : "⚠️"} {need.name}: {need.requiredQuantity.toFixed(2)} {need.unit}
                {!need.isSufficient && ` (faltan ${need.shortfall.toFixed(2)} ${need.unit})`}
              </span>
            </div>
          ))}

          {results.every((n) => n.isSufficient) && (
            <div style={{ marginTop: "12px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: colors.textMuted }}>
                Cantidad real obtenida {selectedRecipe && `(${selectedRecipe.unit ?? selectedRecipe.yieldUnit})`} — déjalo en 0 si coincide con lo planeado
                <input
                  type="number"
                  min={0}
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(Number(e.target.value))}
                  placeholder={String(quantity)}
                  style={{
                    display: "block",
                    marginTop: "6px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    fontSize: "15px",
                    border: `1px solid ${colors.border}`,
                    background: colors.card,
                    color: colors.text,
                  }}
                />
              </label>
              <button
                onClick={handleConfirmProduction}
                style={{
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "999px",
                  border: "none",
                  background: "linear-gradient(145deg, #66BB6A, #2E7D32)",
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(46,125,50,0.4)",
                }}
              >
                ✔ Confirmar producción
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}