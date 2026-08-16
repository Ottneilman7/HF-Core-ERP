import { useState, useEffect, useCallback } from "react";
import * as recipeStockService from "../services/recipeStockService";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
import { products } from "../data/products";
import type { Recipe, RecipeItem } from "../models/Recipe";
import type { RawMaterial } from "../models/RawMaterial";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";

type ItemKind = "rawMaterial" | "componentRecipe";

const emptyRecipe = (): Partial<Recipe> => ({
  code: "",
  name: "",
  productId: undefined,
  yieldQuantity: 1,
  yieldUnit: "Gramos",
  items: [],
  active: true,
  tracksInventory: false,
  unit: "Gramos",
  minimumStock: 0,
});

/**
 * Página: Recetas de Productos (Semielaborados y Terminados)
 * Ruta: /settings/recipes — accesible desde Configuración.
 * BP-039 (segunda parte): reemplaza la edición manual de recipes.ts.
 * Crear/editar receta aquí actualiza directamente lo que usa
 * productionCalculatorService para calcular Producción.
 */
export default function RecipeConfigPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Recipe> | null>(null);
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

  useEffect(() => {
    load();
  }, [load]);

  function startNew() {
    setEditing(emptyRecipe());
    setError(null);
  }

  function startEdit(r: Recipe) {
    setEditing({ ...r, items: [...r.items] });
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

  async function handleSave() {
    setError(null);
    if (!editing?.code?.trim()) {
      setError("El código de la receta es obligatorio.");
      return;
    }
    if (!editing.items || editing.items.length === 0) {
      setError("Agrega al menos un ingrediente.");
      return;
    }
    try {
      const recipe: Recipe = {
        id: editing.id ?? crypto.randomUUID(),
        code: editing.code,
        name: editing.name || editing.code,
        productId: editing.productId || undefined,
        version: editing.version ?? 1,
        yieldQuantity: editing.yieldQuantity ?? 1,
        yieldUnit: editing.yieldUnit ?? "Gramos",
        items: editing.items,
        active: editing.active ?? true,
        tracksInventory: editing.tracksInventory ?? false,
        unit: editing.tracksInventory ? editing.unit ?? "Gramos" : undefined,
        currentStock: editing.currentStock ?? (editing.id ? undefined : 0),
        minimumStock: editing.tracksInventory ? editing.minimumStock ?? 0 : undefined,
      };
      await recipeStockService.saveRecipe(recipe);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la receta.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta receta? Esto no afecta el stock ya producido, solo la fórmula.")) return;
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

  return (
    <div style={{ maxWidth: "720px" }}>
      <h1 style={{ color: colors.text }}>Recetas de Productos</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        Semielaborados (con inventario propio, ej. Granola a granel) y productos terminados vendibles. Esto es lo
        que usa Producción para calcular qué sacar de almacén.
      </p>

      {loading && <p style={{ color: colors.textMuted }}>Cargando...</p>}

      {!loading && !editing && (
        <>
          <FormButton type="button" onClick={startNew} style={{ marginBottom: "20px" }}>
            + Nueva receta
          </FormButton>

          {recipes.map((r) => (
            <div key={r.id} style={{ ...sectionStyle, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ color: colors.text }}>{r.name ?? r.code}</strong>
                  <div style={{ color: colors.textMuted, fontSize: "12px" }}>
                    {r.code} — rinde {r.yieldQuantity} {r.yieldUnit}
                    {r.tracksInventory && " — semielaborado con inventario propio"}
                    {r.productId && " — vendible"}
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
          <h2 style={{ color: colors.text, marginTop: 0 }}>{editing.id ? "Editar receta" : "Nueva receta"}</h2>

          <FormInput label="Código" value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
          <FormInput label="Nombre" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />

          <FormSelect label="¿Es un producto vendible? (opcional)" value={editing.productId ?? ""} onChange={(e) => setEditing({ ...editing, productId: e.target.value || undefined })}>
            <option value="">No — es un semielaborado interno</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </FormSelect>

          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <FormInput label="Rinde (cantidad por lote)" type="number" value={editing.yieldQuantity ?? 1} onChange={(e) => setEditing({ ...editing, yieldQuantity: Number(e.target.value) })} />
            </div>
            <div style={{ flex: 1 }}>
              <FormInput label="Unidad de rendimiento" value={editing.yieldUnit ?? ""} onChange={(e) => setEditing({ ...editing, yieldUnit: e.target.value })} placeholder="Gramos, Barra (50g)..." />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.text, margin: "16px 0" }}>
            <input type="checkbox" checked={editing.tracksInventory ?? false} onChange={(e) => setEditing({ ...editing, tracksInventory: e.target.checked })} />
            Semielaborado con inventario propio (no se desarma al usarse en otra receta)
          </label>

          {editing.tracksInventory && (
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <FormInput label="Unidad de stock" value={editing.unit ?? ""} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <FormInput label="Stock mínimo" type="number" value={editing.minimumStock ?? 0} onChange={(e) => setEditing({ ...editing, minimumStock: Number(e.target.value) })} />
              </div>
            </div>
          )}

          <h3 style={{ color: colors.text, marginTop: "20px" }}>Ingredientes</h3>
          {(editing.items ?? []).length > 0 && (
            <ul style={{ color: colors.text, paddingLeft: "18px" }}>
              {(editing.items ?? []).map((item, idx) => (
                <li key={idx}>
                  {itemLabel(item)} — {item.quantity} {item.unit}{" "}
                  <button onClick={() => removeItem(idx)} style={{ background: "transparent", border: "none", color: colors.danger, cursor: "pointer", fontSize: "12px" }}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <FormSelect label="Tipo de ingrediente" value={itemKind} onChange={(e) => { setItemKind(e.target.value as ItemKind); setSelectedSourceId(""); }}>
            <option value="rawMaterial">Materia prima</option>
            <option value="componentRecipe">Semielaborado (otra receta)</option>
          </FormSelect>

          <FormSelect label={itemKind === "rawMaterial" ? "Materia prima" : "Semielaborado"} value={selectedSourceId} onChange={(e) => setSelectedSourceId(e.target.value)}>
            <option value="">Selecciona</option>
            {itemKind === "rawMaterial"
              ? rawMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)
              : recipes.filter((r) => r.tracksInventory && r.id !== editing.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </FormSelect>

          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <FormInput label="Cantidad" type="number" value={itemQuantity} onChange={(e) => setItemQuantity(Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <FormInput label="Unidad" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} />
            </div>
          </div>
          <FormButton type="button" variant="secondary" onClick={addItemToRecipe}>Agregar ingrediente</FormButton>

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