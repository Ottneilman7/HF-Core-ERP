import { useState, useEffect, useCallback } from "react";
import * as recipeStockService from "../services/recipeStockService";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
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

function productTypeLabel(t: ProductType): string {
  return t === "semiFinished"
    ? "Semielaborado — tiene inventario propio. Puede usarse como ingrediente y/o venderse (ej. Granola a granel, Peanut Butter)"
    : "Producto Terminado — va al inventario de venta al confirmarse su producción (ej. Barras, Granola empacada)";
}

function recipeToProductType(r: Recipe): ProductType {
  return r.tracksInventory ? "semiFinished" : "finished";
}

function emptyRecipe(): Partial<Recipe> & { productType: ProductType } {
  return {
    code: "",
    name: "",
    productType: "finished",
    items: [],
    active: true,
    tracksInventory: false,
    unit: "Gramos",
    minimumStock: 0,
    yieldQuantity: 1,
    yieldUnit: "Gramos",
    version: 1,
  };
}

export default function RecipeConfigPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Partial<Recipe> & { productType: ProductType }) | null>(null);
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
    setError(null);
    setItemKind("rawMaterial");
    setSelectedSourceId("");
    setItemQuantity(0);
  }

  function startEdit(r: Recipe) {
    setEditing({ ...r, items: [...r.items], productType: recipeToProductType(r) });
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
    return r.tracksInventory ? "Semielaborado" : "Producto Terminado";
  }

  async function handleSave() {
    setError(null);
    if (!editing?.code?.trim()) { setError("El código es obligatorio."); return; }
    if (!editing?.name?.trim()) { setError("El nombre es obligatorio."); return; }
    if (!editing.items || editing.items.length === 0) { setError("Agrega al menos un ingrediente."); return; }

    const isSemi = editing.productType === "semiFinished";

    const recipe: Recipe = {
      id: editing.id ?? crypto.randomUUID(),
      code: editing.code,
      name: editing.name,
      productId: undefined,
      version: editing.version ?? 1,
      yieldQuantity: editing.yieldQuantity ?? 1,
      yieldUnit: editing.yieldUnit ?? editing.unit ?? "Gramos",
      items: editing.items,
      active: editing.active ?? true,
      tracksInventory: isSemi,
      unit: isSemi ? (editing.unit ?? "Gramos") : undefined,
      currentStock: editing.currentStock ?? (editing.id ? undefined : 0),
      minimumStock: isSemi ? (editing.minimumStock ?? 0) : undefined,
    };

    try {
      await recipeStockService.saveRecipe(recipe);
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
                    Código: {r.code} — {typeLabel(r)}
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
                  onChange={() => setEditing({ ...editing, productType: t })}
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                {productTypeLabel(t)}
              </label>
            ))}
          </div>

          {/* Rendimiento esperado — necesario para que Producción escale los ingredientes */}
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
                <FormInput
                  label="Unidad"
                  value={editing.yieldUnit ?? "Gramos"}
                  onChange={(e) => setEditing({ ...editing, yieldUnit: e.target.value, unit: e.target.value })}
                />
              </div>
            </div>
          </div>

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