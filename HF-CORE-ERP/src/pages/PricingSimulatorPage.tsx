import { useState, useEffect, useCallback, Fragment } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from "recharts";
import { useConfig } from "../contexts/ConfigContext";
import * as recipeStockService from "../services/recipeStockService";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
import * as pricingService from "../services/pricingService";
import type { Recipe } from "../models/Recipe";
import type { RawMaterial } from "../models/RawMaterial";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";
import { Link } from "react-router-dom";

/**
 * Página: Simulador de Costeo y Precios (Parte D del módulo, BP-XXX)
 * Ruta: /settings/pricing
 *
 * Componente reactivo: el usuario ajusta producción/margen por producto
 * y ve en vivo el costo real, precio sugerido, y si su plan alcanza el
 * punto de equilibrio — sin guardar nada hasta que decide "Guardar todo".
 */

interface ProductDraft {
  targetProduction: number;
  targetMarginPercentage: number; // convención: número entero, ej. 30 = 30% (igual que defaultMarginPercentage)
  manufacturingTimeMinutes: number;
  sellingPrice: number; // si es 0, se usa el precio sugerido calculado
}

const DONUT_COLORS = [colors.primary, colors.secondary, colors.warning, "#A78BFA", "#F472B6", "#38BDF8", "#FB923C"];

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Renderiza el árbol de ingredientes, ordenado del más caro al más barato en cada nivel — así el "culpable" de un costo raro salta a la vista de inmediato. */
function CostBreakdownRows({ lines, depth = 0 }: { lines: pricingService.CostBreakdownLine[]; depth?: number }) {
  const sorted = [...lines].sort((a, b) => b.lineCost - a.lineCost);
  return (
    <>
      {sorted.map((line, i) => (
        <div key={i}>
          <div style={{
            paddingLeft: `${12 + depth * 20}px`, display: "flex", justifyContent: "space-between",
            padding: "4px 8px", fontSize: "12px", color: depth === 0 ? colors.text : colors.textMuted,
          }}>
            <span>{depth > 0 ? "└ " : ""}{line.label} — {line.quantityUsed.toFixed(2)}{line.unit} × ${line.unitCost.toFixed(4)}</span>
            <span style={{ fontWeight: depth === 0 ? 700 : 400 }}>${line.lineCost.toFixed(3)}</span>
          </div>
          {line.children && line.children.length > 0 && <CostBreakdownRows lines={line.children} depth={depth + 1} />}
        </div>
      ))}
    </>
  );
}

export default function PricingSimulatorPage() {
  const { parameters } = useConfig();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ProductDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [allRecipes, allRawMaterials] = await Promise.all([
      recipeStockService.getEffectiveRecipes(),
      rawMaterialInventoryService.getEffectiveRawMaterials(),
    ]);
    const sellable = allRecipes.filter((r) => r.active && r.items.length > 0);
    setRecipes(sellable);
    setRawMaterials(allRawMaterials);

    const initialDrafts: Record<string, ProductDraft> = {};
    for (const r of sellable) {
      initialDrafts[r.id] = {
        targetProduction: r.targetProduction ?? 0,
        targetMarginPercentage: r.targetMarginPercentage ?? parameters.defaultMarginPercentage,
        manufacturingTimeMinutes: r.manufacturingTimeMinutes ?? 0,
        sellingPrice: r.sellingPrice ?? 0,
      };
    }
    setDrafts(initialDrafts);
    setLoading(false);
  }, [parameters.defaultMarginPercentage]);

  useEffect(() => { load(); }, [load]);

  function updateDraft(recipeId: string, patch: Partial<ProductDraft>) {
    setDrafts((prev) => ({ ...prev, [recipeId]: { ...prev[recipeId], ...patch } }));
  }

  const costingSettings = parameters.costingSettings;

  if (loading) {
    return <p style={{ color: colors.textMuted, padding: "24px" }}>Cargando simulador...</p>;
  }

  if (!costingSettings) {
    return (
      <div style={{ maxWidth: "640px" }}>
        <h1 style={{ color: colors.text }}>Simulador de Costeo y Precios</h1>
        <p style={{ color: colors.textMuted }}>
          Primero necesitas llenar la ficha de Costeo y Precios en Configuración (ROI, CIF, Marketing).
        </p>
        <Link to="/settings" style={{ color: colors.secondary }}>← Ir a Configuración</Link>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div style={{ maxWidth: "640px" }}>
        <h1 style={{ color: colors.text }}>Simulador de Costeo y Precios</h1>
        <p style={{ color: colors.textMuted }}>No hay recetas activas todavía. Crea al menos una en Recetas de Productos.</p>
        <Link to="/settings/recipes" style={{ color: colors.secondary }}>← Ir a Recetas</Link>
      </div>
    );
  }

  // --- Cálculo en vivo ---
  const fixedCosts = pricingService.calculateFixedCosts(costingSettings);

  let materialUnitCostByRecipe: Record<string, number> = {};
  let calcError: string | null = null;
  try {
    for (const r of recipes) {
      materialUnitCostByRecipe[r.id] = pricingService.calculateRecipeMaterialUnitCost(r, rawMaterials, recipes);
    }
  } catch (err) {
    calcError = err instanceof Error ? err.message : "Error calculando costos.";
    materialUnitCostByRecipe = {};
  }

  let allocations: pricingService.ProductAllocationResult[] = [];
  if (!calcError) {
    const productsForAllocation = recipes.map((r) => ({
      recipeId: r.id,
      name: r.name ?? r.code,
      targetProduction: drafts[r.id]?.targetProduction ?? 0,
      materialUnitCost: materialUnitCostByRecipe[r.id] ?? 0,
      manufacturingTimeMinutes: drafts[r.id]?.manufacturingTimeMinutes ?? 0,
    }));

    try {
      if (costingSettings.allocationMethod === "abc_time_based") {
        allocations = pricingService.allocateFixedCostsByTime(
          productsForAllocation.map((p) => ({ ...p, batchYieldUnits: recipes.find((r) => r.id === p.recipeId)?.yieldQuantity ?? 1 })),
          fixedCosts.totalFixedCosts,
          costingSettings.totalOperativeHoursMonthly ?? 0
        );
      } else {
        allocations = pricingService.allocateFixedCostsByMaterialCost(productsForAllocation, fixedCosts.totalFixedCosts);
      }
    } catch (err) {
      calcError = err instanceof Error ? err.message : "Error repartiendo costos fijos.";
    }
  }

  const allocationByRecipe: Record<string, pricingService.ProductAllocationResult> = {};
  for (const a of allocations) allocationByRecipe[a.recipeId] = a;

  // Punto de equilibrio (solo con productos que tienen producción > 0)
  let breakEven: pricingService.BreakEvenResult | null = null;
  let breakEvenError: string | null = null;
  if (!calcError) {
    const productsForBreakEven = recipes
      .filter((r) => (drafts[r.id]?.targetProduction ?? 0) > 0)
      .map((r) => {
        const alloc = allocationByRecipe[r.id];
        const draft = drafts[r.id];
        const suggestedPrice = alloc ? pricingService.calculateSuggestedPrice(alloc.totalUnitCost, draft.targetMarginPercentage / 100) : 0;
        return {
          targetProduction: draft.targetProduction,
          materialUnitCost: alloc?.materialUnitCost ?? 0,
          sellingPrice: draft.sellingPrice > 0 ? draft.sellingPrice : suggestedPrice,
        };
      });
    try {
      if (productsForBreakEven.length > 0) {
        breakEven = pricingService.calculateBreakEven(productsForBreakEven, fixedCosts.totalFixedCosts);
      }
    } catch (err) {
      breakEvenError = err instanceof Error ? err.message : "No se pudo calcular el punto de equilibrio.";
    }
  }
  const chartData = breakEven ? pricingService.buildBreakEvenChartData(breakEven) : [];

  async function handleSaveAll() {
    setSaving(true);
    setError(null);
    try {
      for (const r of recipes) {
        const d = drafts[r.id];
        await recipeStockService.saveRecipe({
          ...r,
          targetProduction: d.targetProduction,
          targetMarginPercentage: d.targetMarginPercentage,
          manufacturingTimeMinutes: d.manufacturingTimeMinutes,
          sellingPrice: d.sellingPrice > 0 ? d.sellingPrice : (allocationByRecipe[r.id]
            ? pricingService.calculateSuggestedPrice(allocationByRecipe[r.id].totalUnitCost, d.targetMarginPercentage / 100)
            : 0),
        });
      }
      setSavedMessage("Costeo y precios guardados para todos los productos.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ color: colors.text }}>Simulador de Costeo y Precios</h1>
      <p style={{ color: colors.textMuted, marginBottom: "20px" }}>
        Ajusta la producción estimada y el margen de cada producto. Todo se recalcula en vivo — nada se guarda hasta que le des a "Guardar todo".
      </p>

      {savedMessage && (
        <div style={{ background: `${colors.primary}22`, border: `1px solid ${colors.primary}`, color: colors.primary, borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "14px" }}>
          {savedMessage}
        </div>
      )}
      {(error || calcError) && (
        <div style={{ background: `${colors.danger}22`, border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "14px" }}>
          ⚠️ {error ?? calcError}
        </div>
      )}

      <div style={{ background: colors.card, borderRadius: "12px", padding: "16px", marginBottom: "20px", border: `1px solid ${colors.border}` }}>
        <span style={{ color: colors.textMuted, fontSize: "13px" }}>Costos fijos mensuales totales: </span>
        <span style={{ color: colors.text, fontWeight: 700, fontSize: "16px" }}>{money(fixedCosts.totalFixedCosts)}</span>
        <span style={{ color: colors.textMuted, fontSize: "12px", marginLeft: "8px" }}>
          (método: {costingSettings.allocationMethod === "abc_time_based" ? "por tiempo" : "por materia prima"})
        </span>
      </div>

      {/* Tabla editable por producto */}
      <div style={{ overflowX: "auto", marginBottom: "24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: colors.text, fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}`, textAlign: "left" }}>
              <th style={{ padding: "8px" }}>Producto</th>
              <th style={{ padding: "8px" }}>Producción est.</th>
              <th style={{ padding: "8px" }}>Costo MP unit.</th>
              <th style={{ padding: "8px" }}>CIF unit.</th>
              <th style={{ padding: "8px" }}>Costo total unit.</th>
              <th style={{ padding: "8px" }}>Margen %</th>
              <th style={{ padding: "8px" }}>Precio sugerido</th>
              <th style={{ padding: "8px" }}>Precio de venta</th>
              <th style={{ padding: "8px" }}></th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => {
              const d = drafts[r.id];
              const alloc = allocationByRecipe[r.id];
              const suggestedPrice = alloc ? pricingService.calculateSuggestedPrice(alloc.totalUnitCost, d.targetMarginPercentage / 100) : 0;
              const isExpanded = expandedRecipeId === r.id;

              let breakdownLines: pricingService.CostBreakdownLine[] = [];
              let breakdownError: string | null = null;
              if (isExpanded) {
                try {
                  breakdownLines = pricingService.buildCostBreakdown(r, rawMaterials, recipes);
                } catch (err) {
                  breakdownError = err instanceof Error ? err.message : "No se pudo calcular el desglose.";
                }
              }
              const yieldQty = r.yieldQuantity || 1;

              return (
                <Fragment key={r.id}>
                  <tr style={{ borderBottom: isExpanded ? "none" : `1px solid ${colors.border}` }}>
                    <td style={{ padding: "8px" }}>{r.name ?? r.code}</td>
                    <td style={{ padding: "8px", width: "110px" }}>
                      <input type="number" min={0} value={d.targetProduction}
                        onChange={(e) => updateDraft(r.id, { targetProduction: Number(e.target.value) })}
                        style={{ width: "90px", padding: "6px", borderRadius: "6px", border: `1px solid ${colors.border}`, background: colors.background, color: colors.text }} />
                    </td>
                    <td style={{ padding: "8px" }}>{money(alloc?.materialUnitCost ?? 0)}</td>
                    <td style={{ padding: "8px" }}>{money(alloc?.cifUnitCost ?? 0)}</td>
                    <td style={{ padding: "8px", fontWeight: 700 }}>{money(alloc?.totalUnitCost ?? 0)}</td>
                    <td style={{ padding: "8px", width: "80px" }}>
                      <input type="number" min={0} max={99} value={d.targetMarginPercentage}
                        onChange={(e) => updateDraft(r.id, { targetMarginPercentage: Number(e.target.value) })}
                        style={{ width: "60px", padding: "6px", borderRadius: "6px", border: `1px solid ${colors.border}`, background: colors.background, color: colors.text }} />
                    </td>
                    <td style={{ padding: "8px", color: colors.primary }}>{money(suggestedPrice)}</td>
                    <td style={{ padding: "8px", width: "110px" }}>
                      <input type="number" min={0} placeholder={suggestedPrice.toFixed(2)} value={d.sellingPrice || ""}
                        onChange={(e) => updateDraft(r.id, { sellingPrice: Number(e.target.value) })}
                        style={{ width: "90px", padding: "6px", borderRadius: "6px", border: `1px solid ${colors.border}`, background: colors.background, color: colors.text }} />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <button type="button" onClick={() => setExpandedRecipeId(isExpanded ? null : r.id)}
                        style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.secondary, borderRadius: "6px", padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}>
                        {isExpanded ? "Ocultar" : "Ver desglose"}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td colSpan={9} style={{ padding: "10px 8px", background: colors.card }}>
                        {breakdownError ? (
                          <p style={{ color: colors.danger, fontSize: "12px", margin: 0 }}>⚠️ {breakdownError}</p>
                        ) : (
                          <>
                            <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 6px" }}>
                              Costo de UN LOTE completo ({yieldQty} {r.yieldUnit}) — ordenado de mayor a menor costo, para encontrar rápido qué línea está inflando el total:
                            </p>
                            <CostBreakdownRows lines={breakdownLines} />
                            <p style={{ color: colors.text, fontSize: "12px", fontWeight: 700, margin: "6px 0 0", paddingLeft: "8px" }}>
                              Total del lote: {money(breakdownLines.reduce((s, l) => s + l.lineCost, 0))}
                              {" "}→ por unidad: {money(breakdownLines.reduce((s, l) => s + l.lineCost, 0) / yieldQty)}
                            </p>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {costingSettings.allocationMethod === "abc_time_based" && (
        <p style={{ color: colors.textMuted, fontSize: "12px", marginTop: "-12px", marginBottom: "20px" }}>
          Método por tiempo activo: edita el tiempo de manufactura del lote completo de cada receta en su ficha (Recetas de Productos) para que el CIF se calcule correctamente.
        </p>
      )}

      <FormButton onClick={handleSaveAll} disabled={saving} style={{ marginBottom: "32px" }}>
        {saving ? "Guardando..." : "Guardar todo"}
      </FormButton>

      {/* Donut de distribución de CIF */}
      {allocations.length > 0 && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
          <h2 style={{ color: colors.text, fontSize: "16px", marginTop: 0 }}>Distribución de Costos Fijos</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={allocations.map((a) => ({ name: a.name, value: a.cifAssigned, percentage: a.participationPercentage }))}
                dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                label={(entry: { percent?: number }) => `${((entry.percent ?? 0) * 100).toFixed(1)}%`}
              >
                {allocations.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => money(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de punto de equilibrio */}
      {breakEven && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
          <h2 style={{ color: colors.text, fontSize: "16px", marginTop: 0 }}>Punto de Equilibrio</h2>
          <div style={{
            background: breakEven.isViable ? `${colors.primary}22` : `${colors.warning}22`,
            border: `1px solid ${breakEven.isViable ? colors.primary : colors.warning}`,
            color: breakEven.isViable ? colors.primary : colors.warning,
            borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "14px",
          }}>
            Para cubrir tus gastos fijos, debes vender un mínimo de <strong>{Math.ceil(breakEven.breakEvenUnits)}</strong> unidades combinadas.
            Tu producción estimada actual es <strong>{breakEven.projectedTotalUnits}</strong>.
            {breakEven.isViable ? " ✅ Tu plan actual alcanza el punto de equilibrio." : " ⚠️ Tu plan actual no alcanza — aumenta producción o precios."}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="units" stroke={colors.textMuted} tickFormatter={(v: number) => Math.round(v).toString()} label={{ value: "Unidades", position: "insideBottom", offset: -5, fill: colors.textMuted }} />
              <YAxis stroke={colors.textMuted} tickFormatter={(v: number) => `$${Math.round(v)}`} />
              <Tooltip formatter={(value) => money(Number(value))} labelFormatter={(v) => `${Math.round(Number(v))} unidades`} />
              <Legend />
              <ReferenceLine x={breakEven.breakEvenUnits} stroke={colors.warning} strokeDasharray="4 4" label={{ value: "Equilibrio", fill: colors.warning, fontSize: 11 }} />
              <Line type="monotone" dataKey="totalCosts" name="Costos Totales" stroke={colors.danger} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="totalRevenue" name="Ingresos Totales" stroke={colors.primary} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {breakEvenError && !breakEven && (
        <p style={{ color: colors.warning, fontSize: "13px" }}>⚠️ {breakEvenError}</p>
      )}
    </div>
  );
}