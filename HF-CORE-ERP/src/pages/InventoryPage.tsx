import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
import * as recipeStockService from "../services/recipeStockService";
import * as finishedGoodsInventoryService from "../services/finishedGoodsInventoryService";
import * as wasteLogService from "../services/wasteLogService";
import * as inventoryAdjustmentService from "../services/inventoryAdjustmentService";
import type { WasteItemType } from "../services/wasteLogService";
import type { WasteReason } from "../models/WasteLog";
import type { RawMaterial } from "../models/RawMaterial";
import type { Recipe } from "../models/Recipe";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";
import { useAuth } from "../contexts/AuthContext";
import { isElevatedRole } from "../models/Membership";

const WASTE_REASON_LABELS: Record<WasteReason, string> = {
  burned: "Quemado", spill: "Derrame", expired: "Vencido",
  mishandling: "Mala manipulación", other: "Otro",
};

const LETTER_GROUPS = ["A-D","E-H","I-L","M-P","Q-T","U-Z"];
function groupFor(letter: string) {
  const u = (letter ?? "A").toUpperCase();
  if (u <= "D") return "A-D"; if (u <= "H") return "E-H";
  if (u <= "L") return "I-L"; if (u <= "P") return "M-P";
  if (u <= "T") return "Q-T"; return "U-Z";
}

function Section({ title, subtitle, names, activeGroup, onSelectGroup, children }: {
  title: string; subtitle?: string; names: string[];
  activeGroup: string | null; onSelectGroup: (g: string | null) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const present = new Set(names.map((n) => groupFor(n[0] ?? "A"))) as Set<string>;
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", marginBottom: "20px", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ color: colors.secondary, fontSize: "18px", fontWeight: 700 }}>{title}</span>
          {subtitle && <p style={{ color: colors.textMuted, fontSize: "12px", margin: "4px 0 0" }}>{subtitle}</p>}
        </div>
        <span style={{ color: colors.textMuted, fontSize: "20px" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 24px 24px" }}>
          {names.length > 8 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
              <button onClick={() => onSelectGroup(null)} style={{ padding: "4px 12px", borderRadius: "999px", border: `1px solid ${colors.border}`, background: activeGroup === null ? colors.primary : "transparent", color: activeGroup === null ? "#fff" : colors.text, fontSize: "12px", cursor: "pointer" }}>Todos</button>
              {LETTER_GROUPS.filter((g: string) => present.has(g)).map((g) => (
                <button key={g} onClick={() => onSelectGroup(g)} style={{ padding: "4px 12px", borderRadius: "999px", border: `1px solid ${colors.border}`, background: activeGroup === g ? colors.primary : "transparent", color: activeGroup === g ? "#fff" : colors.text, fontSize: "12px", cursor: "pointer" }}>{g}</button>
              ))}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

interface AdjustModalProps {
  itemType: "rawMaterial" | "semiFinished" | "finished";
  itemId: string; itemName: string; currentStock: number;
  onClose: () => void; onSaved: () => void;
}
function AdjustModal({ itemType, itemId, itemName, currentStock, onClose, onSaved }: AdjustModalProps) {
  const { role } = useAuth();
  const authorized = isElevatedRole(role);
  const [newStock, setNewStock] = useState(currentStock);
  const [reason, setReason] = useState(""); const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null); const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!authorized) { setErr("Solo Dueño/Gerente pueden confirmar este ajuste."); return; }
    if (!reason.trim()) { setErr("Escribe el motivo del ajuste."); return; }
    if (newStock === currentStock) { setErr("El stock nuevo es igual al actual. Modifica la cantidad antes de confirmar."); return; }
    setSaving(true);
    try {
      if (itemType === "rawMaterial") await inventoryAdjustmentService.adjustRawMaterial(itemId, itemName, newStock, reason, note);
      else if (itemType === "semiFinished") await inventoryAdjustmentService.adjustSemiFinished(itemId, itemName, newStock, reason, note);
      else await inventoryAdjustmentService.adjustFinished(itemId, itemName, newStock, reason, note);
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: colors.surface, borderRadius: "16px", padding: "24px", width: "360px", border: `1px solid ${colors.border}` }}>
        <h3 style={{ color: colors.text, marginTop: 0 }}>Ajustar: {itemName}</h3>
        <p style={{ color: colors.textMuted, fontSize: "13px" }}>Stock actual: <strong>{currentStock}</strong></p>
        {!authorized && (
          <p style={{ color: colors.warning, fontSize: "12px" }}>
            Tu rol actual no permite confirmar ajustes de inventario. Puedes ver los campos, pero necesitas a un Dueño/Gerente para guardar.
          </p>
        )}
        <FormInput label="Nuevo stock" type="number" value={newStock} onChange={(e) => setNewStock(Number(e.target.value))} min={0} disabled={!authorized} />
        <FormInput label="Motivo del ajuste" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ej. Conteo físico, corrección de error" disabled={!authorized} />
        <FormInput label="Nota adicional (opcional)" value={note} onChange={(e) => setNote(e.target.value)} disabled={!authorized} />
        {err && <p style={{ color: colors.danger, fontSize: "13px" }}>⚠️ {err}</p>}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <FormButton type="button" onClick={handleSave} disabled={!authorized || saving}>{saving ? "Guardando..." : "Confirmar ajuste"}</FormButton>
          <FormButton type="button" variant="secondary" onClick={onClose}>Cancelar</FormButton>
        </div>
      </div>
    </div>
  );
}

interface SettingsAdjustModalProps {
  itemType: "rawMaterial" | "semiFinished" | "finished";
  field: "minimumStock" | "unitCost";
  itemId: string; itemName: string; currentValue: number; unitLabel: string;
  onClose: () => void; onSaved: () => void;
}
function SettingsAdjustModal({ itemType, field, itemId, itemName, currentValue, unitLabel, onClose, onSaved }: SettingsAdjustModalProps) {
  const { role } = useAuth();
  const authorized = isElevatedRole(role);
  const [newValue, setNewValue] = useState(currentValue);
  const [reason, setReason] = useState(""); const [err, setErr] = useState<string | null>(null); const [saving, setSaving] = useState(false);

  const fieldLabel = field === "minimumStock" ? "Stock mínimo" : "Costo unitario";

  async function handleSave() {
    if (!authorized) { setErr("Solo Dueño/Gerente pueden confirmar este cambio."); return; }
    if (!reason.trim()) { setErr("Escribe el motivo del cambio."); return; }
    if (newValue === currentValue) { setErr("El valor nuevo es igual al actual. Modifícalo antes de confirmar."); return; }
    setSaving(true);
    try {
      if (field === "minimumStock") {
        if (itemType === "rawMaterial") await inventoryAdjustmentService.adjustRawMaterialMinimumStock(itemId, itemName, newValue, reason);
        else if (itemType === "semiFinished") await inventoryAdjustmentService.adjustSemiFinishedMinimumStock(itemId, itemName, newValue, reason);
        else await inventoryAdjustmentService.adjustFinishedMinimumStock(itemId, itemName, newValue, reason);
      } else {
        await inventoryAdjustmentService.adjustRawMaterialUnitCost(itemId, itemName, newValue, reason);
      }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: colors.surface, borderRadius: "16px", padding: "24px", width: "360px", border: `1px solid ${colors.border}` }}>
        <h3 style={{ color: colors.text, marginTop: 0 }}>{fieldLabel}: {itemName}</h3>
        <p style={{ color: colors.textMuted, fontSize: "13px" }}>Valor actual: <strong>{field === "unitCost" ? `$${currentValue.toFixed(4)}` : currentValue} {unitLabel}</strong></p>
        {!authorized && (
          <p style={{ color: colors.warning, fontSize: "12px" }}>
            Tu rol actual no permite confirmar este cambio. Necesitas a un Dueño/Gerente.
          </p>
        )}
        <FormInput label={`${fieldLabel} nuevo`} type="number" min={0} step={field === "unitCost" ? 0.0001 : 1} value={newValue} onChange={(e) => setNewValue(Number(e.target.value))} disabled={!authorized} />
        <FormInput label="Motivo del cambio" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ej. Corrección de error de captura" disabled={!authorized} />
        {err && <p style={{ color: colors.danger, fontSize: "13px" }}>⚠️ {err}</p>}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <FormButton type="button" onClick={handleSave} disabled={!authorized || saving}>{saving ? "Guardando..." : "Confirmar cambio"}</FormButton>
          <FormButton type="button" variant="secondary" onClick={onClose}>Cancelar</FormButton>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  // --- ROLES Y AUTENTICACIÓN ---
  const { role } = useAuth();
  const canManageCatalog = role === "owner" || role === "manager" || role === "production";

  // --- ESTADOS DE INVENTARIO Y BÚSQUEDA ---
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [semiFinished, setSemiFinished] = useState<Recipe[]>([]);
  const [finishedRecipes, setFinishedRecipes] = useState<Recipe[]>([]);
  const [finishedStock, setFinishedStock] = useState<Record<string, number>>({});
  const [finishedMinStock, setFinishedMinStock] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [rawGroup, setRawGroup] = useState<string | null>(null);
  const [semiGroup, setSemiGroup] = useState<string | null>(null);
  const [productGroup, setProductGroup] = useState<string | null>(null);

  // --- ESTADOS Y LÓGICA DE ALTA DE MATERIA PRIMA ---
  const [newMaterialOpen, setNewMaterialOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ code: "", name: "", category: "", unit: "g", supplier: "", currentStock: 0, minimumStock: 0, unitCost: 0 });
  const [newMaterialError, setNewMaterialError] = useState<string | null>(null);
  const [newMaterialSaving, setNewMaterialSaving] = useState(false);

  // --- ESTADOS DE MODALES Y PÉRDIDAS ---
  const [adjustModal, setAdjustModal] = useState<{ itemType: "rawMaterial"|"semiFinished"|"finished"; itemId: string; itemName: string; currentStock: number } | null>(null);
  const [settingsModal, setSettingsModal] = useState<{ itemType: "rawMaterial"|"semiFinished"|"finished"; field: "minimumStock"|"unitCost"; itemId: string; itemName: string; currentValue: number; unitLabel: string } | null>(null);

  const [wasteOpen, setWasteOpen] = useState(false);
  const [wasteItemType, setWasteItemType] = useState<WasteItemType>("rawMaterial");
  const [wasteItemId, setWasteItemId] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState<number>(0);
  const [wasteReason, setWasteReason] = useState<WasteReason>("burned");
  const [wasteNote, setWasteNote] = useState("");
  const [wasteError, setWasteError] = useState<string | null>(null);
  const [wasteSuccess, setWasteSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [materials, recipes, stock, minStock] = await Promise.all([
      rawMaterialInventoryService.getEffectiveRawMaterials(),
      recipeStockService.getEffectiveRecipes(),
      finishedGoodsInventoryService.getAllStock(),
      finishedGoodsInventoryService.getAllMinimumStock(),
    ]);
    setRawMaterials(materials.filter((m) => m.active).sort((a,b) => a.name.localeCompare(b.name)));
    setSemiFinished(recipes.filter((r) => r.active && r.tracksInventory).sort((a,b) => (a.name??a.code).localeCompare(b.name??b.code)));
    setFinishedRecipes(recipes.filter((r) => r.active && !r.tracksInventory).sort((a,b) => (a.name??a.code).localeCompare(b.name??b.code)));
    setFinishedStock(stock);
    setFinishedMinStock(minStock);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreateRawMaterial() {
    setNewMaterialError(null);
    setNewMaterialSaving(true);
    try {
      await rawMaterialInventoryService.createRawMaterial(newMaterial);
      setNewMaterial({ code: "", name: "", category: "", unit: "g", supplier: "", currentStock: 0, minimumStock: 0, unitCost: 0 });
      setNewMaterialOpen(false);
      await load();
    } catch (e) {
      setNewMaterialError(e instanceof Error ? e.message : "Error");
    } finally {
      setNewMaterialSaving(false);
    }
  }

  async function handleWaste() {
    setWasteError(null); setWasteSuccess(null);
    if (!wasteItemId || wasteQuantity <= 0) { setWasteError("Selecciona artículo y cantidad."); return; }
    const name = wasteItemType === "rawMaterial" ? rawMaterials.find((m)=>m.id===wasteItemId)?.name ?? ""
      : wasteItemType === "componentRecipe" ? semiFinished.find((r)=>r.id===wasteItemId)?.name ?? ""
      : finishedRecipes.find((r)=>r.id===wasteItemId)?.name ?? "";
    const unit = wasteItemType === "rawMaterial" ? rawMaterials.find((m)=>m.id===wasteItemId)?.unit ?? "Gramos" : wasteItemType === "componentRecipe" ? semiFinished.find((r)=>r.id===wasteItemId)?.unit ?? "Gramos" : "unidades";
    try {
      await wasteLogService.logErrorWaste({ itemType: wasteItemType, itemId: wasteItemId, itemName: name, quantity: wasteQuantity, unit, reason: wasteReason, note: wasteNote || undefined });
      setWasteSuccess(`Registrado: ${wasteQuantity} ${unit} de ${name}.`);
      setWasteItemId(""); setWasteQuantity(0); setWasteNote("");
      await load();
    } catch(e) { setWasteError(e instanceof Error ? e.message : "Error"); }
  }

  const filteredRaw = rawGroup ? rawMaterials.filter((m) => groupFor(m.name[0]) === rawGroup) : rawMaterials;
  const filteredSemi = semiGroup ? semiFinished.filter((r) => groupFor((r.name??r.code)[0]) === semiGroup) : semiFinished;
  const filteredFinished = productGroup ? finishedRecipes.filter((r) => groupFor((r.name??r.code)[0]) === productGroup) : finishedRecipes;

  const card = { background: colors.card, borderRadius: "12px", padding: "14px 16px", marginBottom: "10px" };

  return (
    <>
      {adjustModal && (
        <AdjustModal {...adjustModal} onClose={() => setAdjustModal(null)} onSaved={() => { setAdjustModal(null); load(); }} />
      )}
      {settingsModal && (
        <SettingsAdjustModal {...settingsModal} onClose={() => setSettingsModal(null)} onSaved={() => { setSettingsModal(null); load(); }} />
      )}

      <h1 style={{ color: colors.primary, marginBottom: "8px" }}>Inventario</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        <Link to="/waste" style={{ color: colors.secondary, fontSize: "13px" }}>Ver historial de merma →</Link>
        {"  "}
        <Link to="/adjustments" style={{ color: colors.secondary, fontSize: "13px", marginLeft: "16px" }}>Ver historial de ajustes →</Link>
        <Link to="/settings/recipes" style={{ color: colors.secondary, fontSize: "13px", marginLeft: "16px" }}>+ Nuevo Producto (con receta) →</Link>
      </p>

      {loading && <p style={{ color: colors.textMuted }}>Cargando...</p>}

      {!loading && (
        <>
          {/* REGISTRAR PÉRDIDA */}
          <div style={{ background: colors.surface, border: `1px solid ${colors.warning}`, borderRadius: "16px", marginBottom: "20px", overflow: "hidden" }}>
            <button onClick={() => setWasteOpen(!wasteOpen)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: colors.warning, fontSize: "16px", fontWeight: 700 }}>⚠️ Registrar Pérdida</span>
              <span style={{ color: colors.textMuted, fontSize: "20px" }}>{wasteOpen ? "▲" : "▼"}</span>
            </button>
            {wasteOpen && (
              <div style={{ padding: "0 24px 24px" }}>
                <FormSelect label="Tipo" value={wasteItemType} onChange={(e) => { setWasteItemType(e.target.value as WasteItemType); setWasteItemId(""); }}>
                  <option value="rawMaterial">Materia prima</option>
                  <option value="componentRecipe">Semielaborado</option>
                  <option value="product">Producto terminado</option>
                </FormSelect>
                <FormSelect label="Artículo" value={wasteItemId} onChange={(e) => setWasteItemId(e.target.value)}>
                  <option value="">Selecciona</option>
                  {wasteItemType === "rawMaterial" && rawMaterials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.currentStock} {m.unit})</option>)}
                  {wasteItemType === "componentRecipe" && semiFinished.map((r) => <option key={r.id} value={r.id}>{r.name??r.code} ({r.currentStock??0} {r.unit})</option>)}
                  {wasteItemType === "product" && finishedRecipes.map((r) => <option key={r.id} value={r.id}>{r.name??r.code} ({finishedStock[r.id]??0} uds)</option>)}
                </FormSelect>
                <FormInput label="Cantidad perdida" type="number" min={0} value={wasteQuantity} onChange={(e) => setWasteQuantity(Number(e.target.value))} />
                <FormSelect label="Motivo" value={wasteReason} onChange={(e) => setWasteReason(e.target.value as WasteReason)}>
                  {Object.entries(WASTE_REASON_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </FormSelect>
                <FormInput label="Nota (opcional)" value={wasteNote} onChange={(e) => setWasteNote(e.target.value)} />
                <FormButton type="button" onClick={handleWaste}>Registrar pérdida</FormButton>
                {wasteError && <p style={{ color: colors.danger, fontSize: "13px", marginTop: "8px" }}>⚠️ {wasteError}</p>}
                {wasteSuccess && <p style={{ color: colors.primary, fontSize: "13px", marginTop: "8px" }}>✅ {wasteSuccess}</p>}
              </div>
            )}
          </div>

          {/* FORMULARIO ALTA DE MATERIA PRIMA (solo visible para roles autorizados) */}
          {canManageCatalog && (
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", marginBottom: "20px", overflow: "hidden" }}>
              <button onClick={() => setNewMaterialOpen(!newMaterialOpen)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: colors.primary, fontSize: "16px", fontWeight: 700 }}>➕ Alta de Materia Prima</span>
                <span style={{ color: colors.textMuted, fontSize: "20px" }}>{newMaterialOpen ? "▲" : "▼"}</span>
              </button>
              {newMaterialOpen && (
                <div style={{ padding: "0 24px 24px" }}>
                  <FormInput label="Código (opcional)" value={newMaterial.code} onChange={(e) => setNewMaterial({ ...newMaterial, code: e.target.value })} placeholder="ej. MP-001" />
                  <FormInput label="Nombre de la materia prima" value={newMaterial.name} onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })} placeholder="ej. Harina de Avena" />
                  <FormInput label="Categoría (opcional)" value={newMaterial.category} onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })} placeholder="ej. Granos / Harinas" />
                  <FormSelect label="Unidad de medida" value={newMaterial.unit} onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}>
                    <option value="g">Gramos (g)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="L">Litros (L)</option>
                    <option value="ud">Unidades (ud)</option>
                  </FormSelect>
                  <FormInput label="Proveedor (opcional)" value={newMaterial.supplier} onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })} />
                  <FormInput label="Stock inicial" type="number" min={0} value={newMaterial.currentStock} onChange={(e) => setNewMaterial({ ...newMaterial, currentStock: Number(e.target.value) })} />
                  <FormInput label="Stock mínimo" type="number" min={0} value={newMaterial.minimumStock} onChange={(e) => setNewMaterial({ ...newMaterial, minimumStock: Number(e.target.value) })} />
                  <FormInput label="Costo unitario ($)" type="number" step="0.0001" min={0} value={newMaterial.unitCost} onChange={(e) => setNewMaterial({ ...newMaterial, unitCost: Number(e.target.value) })} />

                  <div style={{ marginTop: "16px" }}>
                    <FormButton type="button" onClick={handleCreateRawMaterial} disabled={newMaterialSaving}>
                      {newMaterialSaving ? "Guardando..." : "Crear Materia Prima"}
                    </FormButton>
                  </div>

                  {newMaterialError && <p style={{ color: colors.danger, fontSize: "13px", marginTop: "8px" }}>⚠️ {newMaterialError}</p>}
                </div>
              )}
            </div>
          )}

          {/* MATERIA PRIMA */}
          <Section title="Materia Prima" names={rawMaterials.map((m)=>m.name)} activeGroup={rawGroup} onSelectGroup={setRawGroup}>
            {filteredRaw.length === 0 && <p style={{ color: colors.textMuted }}>No hay materia prima en este grupo.</p>}
            {filteredRaw.map((m) => (
              <div key={m.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ color: colors.text }}>{m.name}</strong>
                    <div style={{ color: m.currentStock <= (m.minimumStock??0) ? colors.danger : colors.textMuted, fontSize: "13px", marginTop: "4px" }}>
                      Stock: {m.currentStock} {m.unit}
                      {m.currentStock <= (m.minimumStock??0) && " ⚠️ Bajo mínimo"}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: "12px", marginTop: "2px" }}>
                      Mínimo: {m.minimumStock??0} {m.unit}{" "}
                      <button onClick={() => setSettingsModal({ itemType: "rawMaterial", field: "minimumStock", itemId: m.id, itemName: m.name, currentValue: m.minimumStock??0, unitLabel: m.unit })} style={{ background: "transparent", border: "none", color: colors.secondary, cursor: "pointer", fontSize: "12px", padding: 0 }}>Editar</button>
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: "12px", marginTop: "2px" }}>
                      Costo: ${m.unitCost.toFixed(4)} por {m.unit}{" "}
                      <button onClick={() => setSettingsModal({ itemType: "rawMaterial", field: "unitCost", itemId: m.id, itemName: m.name, currentValue: m.unitCost, unitLabel: m.unit })} style={{ background: "transparent", border: "none", color: colors.secondary, cursor: "pointer", fontSize: "12px", padding: 0 }}>Editar</button>
                    </div>
                  </div>
                  <button onClick={() => setAdjustModal({ itemType: "rawMaterial", itemId: m.id, itemName: m.name, currentStock: m.currentStock })} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>
                    Ajustar
                  </button>
                </div>
              </div>
            ))}
          </Section>

          {/* SEMIELABORADOS */}
          <Section title="Semielaborados" subtitle="Se producen en /production o se compran en /purchases." names={semiFinished.map((r)=>r.name??r.code)} activeGroup={semiGroup} onSelectGroup={setSemiGroup}>
            {filteredSemi.length === 0 && <p style={{ color: colors.textMuted }}>No hay semielaborados.</p>}
            {filteredSemi.map((r) => (
              <div key={r.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: colors.text }}>{r.name??r.code}</strong>
                    <div style={{ color: (r.currentStock??0) <= (r.minimumStock??0) ? colors.danger : colors.textMuted, fontSize: "13px", marginTop: "4px" }}>
                      Stock: {r.currentStock??0} {r.unit}
                      {(r.currentStock??0) <= (r.minimumStock??0) && " ⚠️ Bajo mínimo"}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: "12px" }}>
                      Mínimo: {r.minimumStock??0} {r.unit}{" "}
                      <button onClick={() => setSettingsModal({ itemType: "semiFinished", field: "minimumStock", itemId: r.id, itemName: r.name??r.code, currentValue: r.minimumStock??0, unitLabel: r.unit ?? "" })} style={{ background: "transparent", border: "none", color: colors.secondary, cursor: "pointer", fontSize: "12px", padding: 0 }}>Editar</button>
                    </div>
                  </div>
                  <button onClick={() => setAdjustModal({ itemType: "semiFinished", itemId: r.id, itemName: r.name??r.code, currentStock: r.currentStock??0 })} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                    Ajustar
                  </button>
                </div>
              </div>
            ))}
          </Section>

          {/* PRODUCTO TERMINADO */}
          <Section title="Producto Terminado" subtitle="Se actualiza al confirmar una producción en /production." names={finishedRecipes.map((r)=>r.name??r.code)} activeGroup={productGroup} onSelectGroup={setProductGroup}>
            {filteredFinished.length === 0 && <p style={{ color: colors.textMuted }}>No hay productos terminados. <Link to="/settings/recipes" style={{ color: colors.secondary }}>Crea una receta →</Link></p>}
            {filteredFinished.map((r) => (
              <div key={r.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: colors.text }}>{r.name??r.code}</strong>
                    <div style={{ color: (finishedStock[r.id]??0) <= (finishedMinStock[r.id]??0) ? colors.danger : colors.textMuted, fontSize: "13px", marginTop: "4px" }}>
                      Stock: {finishedStock[r.id]??0} unidades
                      {(finishedStock[r.id]??0) <= (finishedMinStock[r.id]??0) && " ⚠️ Bajo mínimo"}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: "12px" }}>
                      Mínimo: {finishedMinStock[r.id]??0} unidades{" "}
                      <button onClick={() => setSettingsModal({ itemType: "finished", field: "minimumStock", itemId: r.id, itemName: r.name??r.code, currentValue: finishedMinStock[r.id]??0, unitLabel: "unidades" })} style={{ background: "transparent", border: "none", color: colors.secondary, cursor: "pointer", fontSize: "12px", padding: 0 }}>Editar</button>
                    </div>
                  </div>
                  <button onClick={() => setAdjustModal({ itemType: "finished", itemId: r.id, itemName: r.name??r.code, currentStock: finishedStock[r.id]??0 })} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                    Ajustar
                  </button>
                </div>
              </div>
            ))}
          </Section>
        </>
      )}
    </>
  );
}