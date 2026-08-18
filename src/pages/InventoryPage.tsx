import { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
import * as recipeStockService from "../services/recipeStockService";
import * as finishedGoodsInventoryService from "../services/finishedGoodsInventoryService";
import * as wasteLogService from "../services/wasteLogService";
import type { WasteItemType } from "../services/wasteLogService";
import type { WasteReason } from "../models/WasteLog";
import { products } from "../data/products";
import type { RawMaterial } from "../models/RawMaterial";
import type { Recipe } from "../models/Recipe";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const WASTE_REASON_LABELS: Record<WasteReason, string> = {
  burned: "Quemado",
  spill: "Derrame",
  expired: "Vencido",
  mishandling: "Mala manipulación",
  other: "Otro",
};

const LETTER_GROUPS = ["A-D", "E-H", "I-L", "M-P", "Q-T", "U-Z"];

function groupFor(letter: string): string {
  const upper = letter.toUpperCase();
  if (upper <= "D") return "A-D";
  if (upper <= "H") return "E-H";
  if (upper <= "L") return "I-L";
  if (upper <= "P") return "M-P";
  if (upper <= "T") return "Q-T";
  return "U-Z";
}

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  names: string[]; // para calcular qué grupos de letras existen realmente
  activeGroup: string | null;
  onSelectGroup: (group: string | null) => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, subtitle, names, activeGroup, onSelectGroup, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false);
  const groupsPresent = new Set(names.map((n) => groupFor(n[0] ?? "A")));

  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", marginBottom: "20px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <span style={{ color: colors.secondary, fontSize: typography.subtitle, fontWeight: 700 }}>{title}</span>
          {subtitle && <p style={{ color: colors.textMuted, fontSize: "13px", margin: "4px 0 0" }}>{subtitle}</p>}
        </div>
        <span style={{ color: colors.textMuted, fontSize: "20px" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 24px 24px" }}>
          {names.length > 8 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
              <button
                onClick={() => onSelectGroup(null)}
                style={{ padding: "4px 12px", borderRadius: "999px", border: `1px solid ${colors.border}`, background: activeGroup === null ? colors.primary : "transparent", color: activeGroup === null ? "#fff" : colors.text, fontSize: "12px", cursor: "pointer" }}
              >
                Todos
              </button>
              {LETTER_GROUPS.filter((g) => groupsPresent.has(g)).map((g) => (
                <button
                  key={g}
                  onClick={() => onSelectGroup(g)}
                  style={{ padding: "4px 12px", borderRadius: "999px", border: `1px solid ${colors.border}`, background: activeGroup === g ? colors.primary : "transparent", color: activeGroup === g ? "#fff" : colors.text, fontSize: "12px", cursor: "pointer" }}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [semiFinished, setSemiFinished] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const finishedGoodsStock = finishedGoodsInventoryService.getAllStock();

  const [rawGroup, setRawGroup] = useState<string | null>(null);
  const [semiGroup, setSemiGroup] = useState<string | null>(null);
  const [productGroup, setProductGroup] = useState<string | null>(null);

  const [wasteOpen, setWasteOpen] = useState(false);
  const [wasteItemType, setWasteItemType] = useState<WasteItemType>("rawMaterial");
  const [wasteItemId, setWasteItemId] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState<number>(0);
  const [wasteReason, setWasteReason] = useState<WasteReason>("burned");
  const [wasteNote, setWasteNote] = useState("");
  const [wasteError, setWasteError] = useState<string | null>(null);
  const [wasteSuccess, setWasteSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  function loadInventory() {
    setLoading(true);
    Promise.all([
      rawMaterialInventoryService.getEffectiveRawMaterials(),
      recipeStockService.getEffectiveRecipes(),
    ]).then(([materials, recipes]) => {
      setRawMaterials(materials.filter((m) => m.active));
      setSemiFinished(recipes.filter((r) => r.active && r.tracksInventory));
      setLoading(false);
    });
  }

  function currentWasteItemName(): string {
    if (wasteItemType === "rawMaterial") return rawMaterials.find((m) => m.id === wasteItemId)?.name ?? "";
    if (wasteItemType === "componentRecipe") return semiFinished.find((r) => r.id === wasteItemId)?.name ?? "";
    return products.find((p) => p.id === wasteItemId)?.name ?? "";
  }

  function currentWasteItemUnit(): string {
    if (wasteItemType === "rawMaterial") return rawMaterials.find((m) => m.id === wasteItemId)?.unit ?? "Gramos";
    if (wasteItemType === "componentRecipe") return semiFinished.find((r) => r.id === wasteItemId)?.unit ?? "Gramos";
    return "unidades";
  }

  async function handleRegisterWaste() {
    setWasteError(null);
    setWasteSuccess(null);
    if (!wasteItemId || wasteQuantity <= 0) {
      setWasteError("Selecciona un artículo y una cantidad mayor a cero.");
      return;
    }
    try {
      await wasteLogService.logErrorWaste({
        itemType: wasteItemType,
        itemId: wasteItemId,
        itemName: currentWasteItemName(),
        quantity: wasteQuantity,
        unit: currentWasteItemUnit(),
        reason: wasteReason,
        note: wasteNote || undefined,
      });
      setWasteSuccess(`Pérdida registrada: ${wasteQuantity} ${currentWasteItemUnit()} de ${currentWasteItemName()}.`);
      setWasteItemId("");
      setWasteQuantity(0);
      setWasteNote("");
      loadInventory();
    } catch (err) {
      setWasteError(err instanceof Error ? err.message : "No se pudo registrar la pérdida.");
    }
  }

  const filteredRawMaterials = rawGroup ? rawMaterials.filter((m) => groupFor(m.name[0]) === rawGroup) : rawMaterials;
  const filteredSemiFinished = semiGroup
    ? semiFinished.filter((r) => groupFor((r.name ?? r.code)[0]) === semiGroup)
    : semiFinished;
  const filteredProducts = productGroup ? products.filter((p) => groupFor(p.name[0]) === productGroup) : products;

  return (
    <>
      <h1 style={{ color: colors.primary, fontSize: typography.title, marginBottom: "8px" }}>Inventario</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        Todo lo que el negocio tiene disponible ahora mismo, agrupado en tres fichas.
      </p>

      {loading && <p style={{ color: colors.textMuted }}>Cargando inventario...</p>}

      {!loading && (
        <>
          <div style={{ background: colors.surface, border: `1px solid ${colors.warning}`, borderRadius: "16px", marginBottom: "20px", overflow: "hidden" }}>
            <button
              onClick={() => setWasteOpen(!wasteOpen)}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ color: colors.warning, fontSize: typography.subtitle, fontWeight: 700 }}>⚠️ Registrar Pérdida</span>
              <span style={{ color: colors.textMuted, fontSize: "20px" }}>{wasteOpen ? "▲" : "▼"}</span>
            </button>

            {wasteOpen && (
              <div style={{ padding: "0 24px 24px" }}>
                <p style={{ color: colors.textMuted, fontSize: "13px", marginBottom: "16px" }}>
                  Para pérdidas por quema, derrame, vencimiento o mala manipulación — no ligadas a una producción
                  (para merma de proceso, usa "Cantidad real obtenida" en /production).
                </p>

                <FormSelect
                  label="Tipo de inventario"
                  value={wasteItemType}
                  onChange={(e) => { setWasteItemType(e.target.value as WasteItemType); setWasteItemId(""); }}
                >
                  <option value="rawMaterial">Materia prima</option>
                  <option value="componentRecipe">Semielaborado</option>
                  <option value="product">Producto terminado</option>
                </FormSelect>

                <FormSelect label="Artículo" value={wasteItemId} onChange={(e) => setWasteItemId(e.target.value)}>
                  <option value="">Selecciona</option>
                  {wasteItemType === "rawMaterial" &&
                    rawMaterials.map((m) => <option key={m.id} value={m.id}>{m.name} (stock: {m.currentStock} {m.unit})</option>)}
                  {wasteItemType === "componentRecipe" &&
                    semiFinished.map((r) => <option key={r.id} value={r.id}>{r.name ?? r.code} (stock: {r.currentStock ?? 0} {r.unit})</option>)}
                  {wasteItemType === "product" &&
                    products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {finishedGoodsStock[p.id] ?? 0})</option>)}
                </FormSelect>

                <FormInput
                  label="Cantidad perdida"
                  type="number"
                  min={0}
                  value={wasteQuantity}
                  onChange={(e) => setWasteQuantity(Number(e.target.value))}
                />

                <FormSelect label="Motivo" value={wasteReason} onChange={(e) => setWasteReason(e.target.value as WasteReason)}>
                  {Object.entries(WASTE_REASON_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </FormSelect>

                <FormInput label="Nota (opcional)" value={wasteNote} onChange={(e) => setWasteNote(e.target.value)} />

                <FormButton type="button" onClick={handleRegisterWaste}>Registrar pérdida</FormButton>

                {wasteError && <p style={{ color: colors.danger, marginTop: "10px", fontSize: "13px" }}>⚠️ {wasteError}</p>}
                {wasteSuccess && <p style={{ color: colors.primary, marginTop: "10px", fontSize: "13px" }}>✅ {wasteSuccess}</p>}
              </div>
            )}
          </div>

          <CollapsibleSection
            title="Materia Prima"
            names={rawMaterials.map((m) => m.name)}
            activeGroup={rawGroup}
            onSelectGroup={setRawGroup}
          >
            {filteredRawMaterials.map((material) => (
              <Card key={material.id}>
                <h2>{material.name}</h2>
                <p>Código: {material.code}</p>
                <p>Categoría: {material.category}</p>
                <p>Unidad: {material.unit}</p>
                <p>Stock: {material.currentStock}</p>
                <p>Stock mínimo: {material.minimumStock}</p>
              </Card>
            ))}
          </CollapsibleSection>

          <CollapsibleSection
            title="Semielaborados"
            subtitle="Se producen en /production, o se compran ya hechos en /purchases (emergencia)."
            names={semiFinished.map((r) => r.name ?? r.code)}
            activeGroup={semiGroup}
            onSelectGroup={setSemiGroup}
          >
            {filteredSemiFinished.map((recipe) => (
              <Card key={recipe.id}>
                <h2>{recipe.name ?? recipe.code}</h2>
                <p>Unidad: {recipe.unit}</p>
                <p>Stock: {recipe.currentStock ?? 0}</p>
                <p>Stock mínimo: {recipe.minimumStock ?? 0}</p>
              </Card>
            ))}
          </CollapsibleSection>

          <CollapsibleSection
            title="Producto Terminado"
            subtitle="Se actualiza automáticamente al confirmar una producción en /production."
            names={products.map((p) => p.name)}
            activeGroup={productGroup}
            onSelectGroup={setProductGroup}
          >
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <h2>{product.name}</h2>
                <p>Stock: {finishedGoodsStock[product.id] ?? 0} unidades</p>
              </Card>
            ))}
          </CollapsibleSection>
        </>
      )}
    </>
  );
}