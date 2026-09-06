import { useState, useEffect, useCallback } from "react";
import * as recipeStockService from "../services/recipeStockService";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
import * as finishedGoodsInventoryService from "../services/finishedGoodsInventoryService";
import type { Recipe, RecipeItem } from "../models/Recipe";
import type { RawMaterial } from "../models/RawMaterial";
import { FormInput } from "../components/FormInput";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";

/**
 * Página: Recetas de Productos (BOM)
 * Ruta: /settings/recipes
 *
 * BP-048 (revisión 2): se elimina por completo la dependencia de
 * data/products.ts. La receta ES el producto — no necesita enlazarse
 * a un catálogo externo.
 *
 * Tipos de receta:
 * - Semielaborado: tiene inventario propio (tracksInventory = true).
 *   Puede usarse como ingrediente en otras recetas Y puede venderse.
 *   Ejemplos: Granola a granel, Peanut Butter a granel.
 * - Producto Terminado: se produce y va al inventario de venta.
 *   No tiene inventario propio en el sistema — se vende directo.
 *   Ejemplos: Honestly Bar Classic, Granola 50g.
 *
 * La distinción clave: un Semielaborado aparece en el inventario con
 * su propio stock; un Producto Terminado va al inventario de
 * finishedGoods (indexado por recipe.id).
 *
 * productionExecutionService usa recipe.tracksInventory para decidir
 * a dónde sumar el resultado: true → recipeStock, false → finishedGoods.
 */

type ProductType = "semiFinished" | "finished";
type ItemKind = "rawMaterial" | "componentRecipe";
// BP-056: separa "¿qué es?" (productType) de "¿cómo se cuenta su stock?"
// (measurementType) — antes se confundían en un solo campo de texto libre
// y era fácil terminar contando gramos cuando en realidad eran barras.
type MeasurementType = "discrete" | "bulk";

function productTypeLabel(t: ProductType): string {
  return t === "semiFinished"
    ? "Semielaborado — tiene inventario propio. Puede usarse como ingrediente y/o venderse (ej. Granola a granel, Peanut Butter)"
    : "Producto Terminado — va al inventario de venta al confirmarse su producción (ej. Barras, Granola empacada)";
}

function recipeToProductType(r: Recipe): ProductType {
  return r.tracksInventory ? "semiFinished" : "finished";
}

// Heurística para recetas ya existentes: si su rendimiento es exactamente
// 1, casi seguro se pensó como "1 unidad discreta"; cualquier otro valor,
// como a granel (peso/volumen).
function recipeToMeasurementType(r: Recipe): MeasurementType {
  if (r.tracksInventory) return "bulk";
  return (r.yieldQuantity ?? 1) === 1 ? "discrete" : "bulk";
}

const BULK_UNITS = ["Gramos", "Kilogramos", "Mililitros", "Litros"];

function emptyRecipe(): Partial<Recipe> & { productType: ProductType; isResale: boolean; measurementType: MeasurementType } {
  return {
    code: "",
    name: "",
    category: "",
    description: "",
    productType: "finished",
    isResale: false,
    measurementType: "discrete",
    items: [],
    active: true,
    tracksInventory: false,
    unit: "Gramos",
    minimumStock: 0,
    yieldQuantity: 1,
    yieldUnit: "Unidad",
    version: 1,
  };
}

export default function RecipeConfigPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Partial<Recipe> & { productType: ProductType; isResale: boolean; measurementType: MeasurementType }) | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itemKind, setItemKind] = useState<ItemKind>("rawMaterial");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number>(0);
  const [itemUnit, setItemUnit] = useState("Gramos");

  const load = useCallback(async () => {
    setLoading(true);
    const [r, m] = await Promise.all([
      recipeStockService.getEffectiveRecipes(),
      rawMaterialInventoryService.getEffectiveRawMaterials(),
    ]);
    setRecipes(r);
    setRawMaterials(m.filter((x) => x.active));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setEditing(emptyRecipe());
    setAddingCategory(recipes.length === 0); // sin categorías todavía, abre directo el campo de texto
    setError(null);
    setItemKind("rawMaterial");
    setSelectedSourceId("");
    setItemQuantity(0);
  }

  function startEdit(r: Recipe) {
    setEditing({ ...r, items: [...r.items], productType: recipeToProductType(r), isResale: r.items.length === 0, measurementType: recipeToMeasurementType(r) });
    setAddingCategory(false);
    setError(null);
  }

  function addItemToRecipe() {
    if (!selectedSourceId || itemQuantity <= 0 || !editing) return;
    const newItem: RecipeItem =
      itemKind === "rawMaterial"
        ? { rawMaterialId: selectedSourceId, quantity: itemQuantity, unit: itemUnit }
        : { componentRecipeId: selectedSourceId, quantity: itemQuantity, unit: itemUnit };
    setEditing({ ...editing, items: [...(editing.items ?? []), newItem] });
    setSelectedSourceId("");
    setItemQuantity(0);
  }

  function removeItem(idx: number) {
    if (!editing) return;
    setEditing({ ...editing, items: (editing.items ?? []).filter((_, i) => i !== idx) });
  }

  function itemLabel(item: RecipeItem): string {
    if (item.rawMaterialId) return rawMaterials.find((m) => m.id === item.rawMaterialId)?.name ?? item.rawMaterialId;
    if (item.componentRecipeId) return recipes.find((r) => r.id === item.componentRecipeId)?.name ?? item.componentRecipeId;
    return "?";
  }

  function typeLabel(r: Recipe): string {
    if (r.tracksInventory) return "Semielaborado";
    return r.items.length === 0 ? "Producto Terminado (reventa)" : "Producto Terminado";
  }

  async function handleSave() {
    setError(null);
    if (!editing?.code?.trim()) { setError("El código es obligatorio."); return; }
    if (!editing?.name?.trim()) { setError("El nombre es obligatorio."); return; }
    if (!editing?.category?.trim()) { setError("La categoría es obligatoria — escribe una existente o una nueva."); return; }
    if (!editing.isResale && (!editing.items || editing.items.length === 0)) {
      setError("Agrega al menos un ingrediente, o marca \"Producto de reventa\" si no se fabrica aquí.");
      return;
    }

    const isSemi = editing.productType === "semiFinished";
    const isDiscrete = editing.measurementType === "discrete" && !isSemi;

    const recipe: Recipe = {
      id: editing.id ?? crypto.randomUUID(),
      code: editing.code,
      name: editing.name,
      category: editing.category.trim(),
      description: editing.description?.trim() || undefined,
      productId: undefined,
      version: editing.version ?? 1,
      yieldQuantity: isDiscrete ? 1 : (editing.yieldQuantity ?? 1),
      yieldUnit: isDiscrete ? (editing.yieldUnit?.trim() || "Unidad") : (editing.yieldUnit ?? editing.unit ?? "Gramos"),
      items: editing.isResale ? [] : (editing.items ?? []),
      active: editing.active ?? true,
      tracksInventory: isSemi,
      unit: isSemi ? (editing.unit ?? "Gramos") : undefined,
      currentStock: editing.currentStock ?? (editing.id ? undefined : 0),
      minimumStock: isSemi ? (editing.minimumStock ?? 0) : undefined,
    };

    try {
      await recipeStockService.saveRecipe(recipe);
      if (!editing.id) {
        // Producto nuevo: inicializa su stock de terminado en 0 para que
        // aparezca de inmediato en Inventario (BP-055).
        try { await finishedGoodsInventoryService.setMinimumStock(recipe.id, 0); } catch { /* no bloquea el guardado */ }
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la receta.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta receta? El stock ya producido no se verá afectado.")) return;
    await recipeStockService.deleteRecipe(id);
    await load();
  }

  const sectionStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
  };

  if (loading) return <p style={{ color: colors.textMuted }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: "720px" }}>
      <h1 style={{ color: colors.text }}>Recetas de Productos (BOM)</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        Cada receta define los ingredientes de un producto. Al confirmar una producción,
        el sistema descuenta los ingredientes y suma el resultado al inventario automáticamente.
      </p>

      {!editing && (
        <>
          <FormButton type="button" onClick={startNew} style={{ marginBottom: "20px" }}>
            + Nueva receta
          </FormButton>

          {recipes.length === 0 && (
            <p style={{ color: colors.textMuted }}>No hay recetas todavía.</p>
          )}

          {recipes.map((r) => (
            <div key={r.id} style={{ ...sectionStyle, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ color: colors.text }}>{r.name ?? r.code}</strong>
                  <div style={{ color: colors.textMuted, fontSize: "12px", marginTop: "2px" }}>
                    Código: {r.code} — {typeLabel(r)}{r.category ? ` — ${r.category}` : ""}
                    {r.tracksInventory && ` — Stock: ${r.currentStock ?? 0} ${r.unit ?? ""}`}
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: "12px" }}>
                    {r.items.length} ingrediente{r.items.length !== 1 ? "s" : ""}:{" "}
                    {r.items.slice(0, 3).map((item) => itemLabel(item)).join(", ")}
                    {r.items.length > 3 ? "..." : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => startEdit(r)} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(r.id)} style={{ background: "transparent", border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {editing && (
        <div style={sectionStyle}>
          <h2 style={{ color: colors.text, marginTop: 0 }}>
            {editing.id ? "Editar receta" : "Nueva receta"}
          </h2>

          <FormInput
            label="Código (codificación interna del negocio, ej. BAR-001)"
            value={editing.code ?? ""}
            onChange={(e) => setEditing({ ...editing, code: e.target.value })}
          />
          <FormInput
            label="Nombre del producto"
            value={editing.name ?? ""}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          />
          {(() => {
            const existingCategories = Array.from(new Set(recipes.map((r) => r.category).filter((c): c is string => !!c)));
            const isNewCategory = !editing.category || !existingCategories.includes(editing.category) || addingCategory;
            return (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: colors.textMuted, fontSize: "13px", display: "block", marginBottom: "6px" }}>
                  Categoría
                </label>
                {!isNewCategory ? (
                  <select
                    value={editing.category ?? ""}
                    onChange={(e) => {
                      if (e.target.value === "__new__") { setAddingCategory(true); setEditing({ ...editing, category: "" }); }
                      else setEditing({ ...editing, category: e.target.value });
                    }}
                    style={{ background: colors.card, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px", width: "100%", fontSize: "13px" }}
                  >
                    {existingCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="__new__">+ Agregar categoría nueva</option>
                  </select>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={editing.category ?? ""}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                      placeholder="ej. Mercancía Seca"
                      style={{ flex: 1, background: colors.card, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px", fontSize: "13px" }}
                    />
                    {existingCategories.length > 0 && (
                      <button type="button" onClick={() => { setAddingCategory(false); setEditing({ ...editing, category: existingCategories[0] }); }} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", padding: "0 12px", fontSize: "12px", cursor: "pointer" }}>
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          <FormInput
            label="Descripción (opcional)"
            value={editing.description ?? ""}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
          />

          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: colors.text, fontSize: "13px", margin: "16px 0", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={editing.isResale}
              onChange={(e) => setEditing({ ...editing, isResale: e.target.checked, productType: e.target.checked ? "finished" : editing.productType })}
              style={{ marginTop: "2px" }}
            />
            Producto de reventa (no se fabrica aquí — se recibe por Compras, sin receta/BOM)
          </label>

          {!editing.isResale && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: colors.textMuted, fontSize: "13px", display: "block", marginBottom: "10px" }}>
                Tipo de producto
              </label>
              {(["semiFinished", "finished"] as ProductType[]).map((t) => (
                <label key={t} style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: colors.text, fontSize: "13px", marginBottom: "10px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="productType"
                    value={t}
                    checked={editing.productType === t}
                    onChange={() => setEditing({ ...editing, productType: t, measurementType: t === "semiFinished" ? "bulk" : editing.measurementType })}
                    style={{ marginTop: "2px", flexShrink: 0 }}
                  />
                  {productTypeLabel(t)}
                </label>
              ))}
            </div>
          )}

          {/* BP-056: antes un solo campo de texto libre confundía "peso de
              la mezcla" con "unidad de conteo del stock". Ahora se pregunta
              explícitamente cómo se cuenta este producto. */}
          {!editing.isResale && editing.productType === "finished" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: colors.textMuted, fontSize: "13px", display: "block", marginBottom: "10px" }}>
                ¿Cómo se cuenta el stock de este producto?
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: colors.text, fontSize: "13px", marginBottom: "10px", cursor: "pointer" }}>
                <input type="radio" name="measurementType" checked={editing.measurementType === "discrete"} onChange={() => setEditing({ ...editing, measurementType: "discrete" })} style={{ marginTop: "2px" }} />
                Por unidad (ej. cada barra, cada bolsa, cada caja) — lo más común para producto terminado
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: colors.text, fontSize: "13px", cursor: "pointer" }}>
                <input type="radio" name="measurementType" checked={editing.measurementType === "bulk"} onChange={() => setEditing({ ...editing, measurementType: "bulk" })} style={{ marginTop: "2px" }} />
                A granel, por peso o volumen (ej. se vende suelto por kg o por litro)
              </label>
            </div>
          )}

          {editing.measurementType === "discrete" && !editing.isResale && editing.productType === "finished" ? (
            <div style={{ background: colors.card, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: colors.textMuted, fontSize: "12px", margin: "0 0 12px" }}>
                Los ingredientes de abajo, en las cantidades que pongas, producen exactamente <strong>1 unidad</strong>{" "}
                de este producto (ej. 1 barra). Producción va a multiplicar esas cantidades por cuántas unidades quieras fabricar.
              </p>
              <FormInput
                label='¿Cómo se llama 1 unidad? (ej. "Barra 50gr", "Bolsa 100g", "Unidad")'
                value={editing.yieldUnit ?? ""}
                onChange={(e) => setEditing({ ...editing, yieldUnit: e.target.value })}
                placeholder="Barra 50gr"
              />
            </div>
          ) : !editing.isResale && (
            <div style={{ background: colors.card, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: colors.textMuted, fontSize: "12px", margin: "0 0 12px" }}>
                <strong>¿Cuánto produce normalmente esta receta?</strong> Es la cantidad esperada
                cuando preparas todos los ingredientes de arriba. Producción usará esto para
                calcular proporcionalmente cuánto ingrediente sacar según lo que quieras fabricar.
                Ejemplo: si la receta tiene 90g de maní y produce 100g de Peanut Butter, pon 100.
                Si quieres hacer 750g, el sistema pedirá 675g de maní automáticamente.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <FormInput
                    label="Cantidad esperada de esta receta"
                    type="number"
                    value={editing.yieldQuantity ?? 1}
                    onChange={(e) => setEditing({ ...editing, yieldQuantity: Number(e.target.value) })}
                    min={1}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: colors.textMuted, fontSize: "13px", display: "block", marginBottom: "6px" }}>Unidad</label>
                  <select
                    value={editing.yieldUnit ?? "Gramos"}
                    onChange={(e) => setEditing({ ...editing, yieldUnit: e.target.value, unit: e.target.value })}
                    style={{ background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px", width: "100%", fontSize: "13px" }}
                  >
                    {BULK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {editing.productType === "semiFinished" && (
            <div style={{ background: colors.card, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: colors.textMuted, fontSize: "12px", margin: "0 0 12px" }}>
                Al producir este semielaborado, su stock aumenta y queda disponible
                para usarse en otras recetas o venderse directamente desde Ventas.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <FormInput
                    label="Stock mínimo"
                    type="number"
                    value={editing.minimumStock ?? 0}
                    onChange={(e) => setEditing({ ...editing, minimumStock: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          {!editing.isResale && (
            <>
              <h3 style={{ color: colors.text, marginTop: "20px", marginBottom: "12px" }}>
                Ingredientes
              </h3>

              {(editing.items ?? []).length > 0 && (
                <ul style={{ color: colors.text, paddingLeft: "18px", marginBottom: "16px" }}>
                  {(editing.items ?? []).map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "6px" }}>
                      {itemLabel(item)} — {item.quantity} {item.unit}{" "}
                      <button onClick={() => removeItem(idx)} style={{ background: "transparent", border: "none", color: colors.danger, cursor: "pointer", fontSize: "12px" }}>
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ marginBottom: "12px" }}>
                <label style={{ color: colors.textMuted, fontSize: "13px", display: "block", marginBottom: "6px" }}>
                  Tipo de ingrediente
                </label>
                <select
                  value={itemKind}
                  onChange={(e) => { setItemKind(e.target.value as ItemKind); setSelectedSourceId(""); }}
                  style={{ background: colors.card, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px", width: "100%", fontSize: "13px", marginBottom: "10px" }}
                >
                  <option value="rawMaterial">Materia prima</option>
                  <option value="componentRecipe">Semielaborado (otra receta con inventario propio)</option>
                </select>

                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  style={{ background: colors.card, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px", width: "100%", fontSize: "13px" }}
                >
                  <option value="">Selecciona</option>
                  {itemKind === "rawMaterial"
                    ? rawMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)
                    : recipes
                        .filter((r) => r.tracksInventory && r.id !== editing.id)
                        .map((r) => <option key={r.id} value={r.id}>{r.name ?? r.code}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <FormInput label="Cantidad" type="number" value={itemQuantity} onChange={(e) => setItemQuantity(Number(e.target.value))} />
                </div>
                <div style={{ flex: 1 }}>
                  <FormInput label="Unidad" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} />
                </div>
              </div>

              <FormButton type="button" variant="secondary" onClick={addItemToRecipe}>
                Agregar ingrediente
              </FormButton>
            </>
          )}

          {error && <p style={{ color: colors.danger, marginTop: "12px" }}>⚠️ {error}</p>}

          <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
            <FormButton type="button" onClick={handleSave}>Guardar receta</FormButton>
            <FormButton type="button" variant="secondary" onClick={() => setEditing(null)}>Cancelar</FormButton>
          </div>
        </div>
      )}
    </div>
  );
}