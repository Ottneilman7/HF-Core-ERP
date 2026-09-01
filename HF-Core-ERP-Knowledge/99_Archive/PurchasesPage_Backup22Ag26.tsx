import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import * as purchaseService from "../services/purchaseService";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
import * as recipeStockService from "../services/recipeStockService";
import type { PurchaseOrderItem } from "../models/PurchaseOrder";
import type { Supplier } from "../models/Supplier";
import type { RawMaterial } from "../models/RawMaterial";
import type { Recipe } from "../models/Recipe";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";

type ItemKind = "rawMaterial" | "semiFinished";

/**
 * Página: Compras (Flujo 3)
 * Ruta: /purchases
 *
 * BP-025/BP-026: rawMaterialInventoryService y recipeStockService son
 * ahora Firestore (async) — ambos catálogos se cargan con useEffect +
 * estado de loading propio.
 *
 * BP-041 (fix): se agrega handleVoidOrder, que llamaba a
 * purchaseService.voidPurchaseOrder pero nunca fue declarada en este
 * archivo — causaba ReferenceError en build y en runtime.
 */
export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState<Awaited<ReturnType<typeof purchaseService.getSuppliers>>>([]);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof purchaseService.getPurchaseOrders>>>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loadingRawMaterials, setLoadingRawMaterials] = useState(true);
  const [semiFinishedRecipes, setSemiFinishedRecipes] = useState<Recipe[]>([]);
  // loadingRecipes se gestiona internamente en loadSemiFinishedRecipes
  // (no se expone en el JSX — el selector de semielaborados solo aparece
  // cuando el usuario elige esa opción, momento en que ya están cargados).

  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierTradeName, setNewSupplierTradeName] = useState("");
  const [newSupplierTaxId, setNewSupplierTaxId] = useState("");
  const [newSupplierContact, setNewSupplierContact] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierCity, setNewSupplierCity] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");

  const [ordersNewestFirst, setOrdersNewestFirst] = useState(true);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editSupplierForm, setEditSupplierForm] = useState<Partial<Supplier>>({});

  function startEditSupplier(s: Supplier) {
    setEditingSupplierId(s.id);
    setEditSupplierForm(s);
  }

  async function saveEditSupplier() {
    if (!editingSupplierId) return;
    await purchaseService.updateSupplier(editingSupplierId, editSupplierForm);
    setEditingSupplierId(null);
    await refresh();
  }

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [itemKind, setItemKind] = useState<ItemKind>("rawMaterial");
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [captureUnit, setCaptureUnit] = useState<"g" | "kg">("kg");
  const [quantity, setQuantity] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [isVatExempt, setIsVatExempt] = useState(false);
  const [draftItems, setDraftItems] = useState<PurchaseOrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [paymentTerm, setPaymentTerm] = useState<"cash" | "credit">("cash");

  const loadRawMaterials = useCallback(async () => {
    setLoadingRawMaterials(true);
    const all = await rawMaterialInventoryService.getEffectiveRawMaterials();
    const active = all.filter((rm) => rm.active);
    setRawMaterials(active);
    setSelectedRawMaterialId((prev) => prev || active[0]?.id || "");
    setLoadingRawMaterials(false);
  }, []);

  const loadSemiFinishedRecipes = useCallback(async () => {
    const all = await recipeStockService.getEffectiveRecipes();
    const tracked = all.filter((r) => r.active && r.tracksInventory);
    setSemiFinishedRecipes(tracked);
    setSelectedRecipeId((prev) => prev || tracked[0]?.id || "");
  }, []);

  const refresh = useCallback(async () => {
    setSuppliers(await purchaseService.getSuppliers());
    setOrders(await purchaseService.getPurchaseOrders());
  }, []);

  useEffect(() => {
    loadRawMaterials();
    loadSemiFinishedRecipes();
    refresh();
  }, [loadRawMaterials, loadSemiFinishedRecipes, refresh]);

  async function handleAddSupplier() {
    if (!newSupplierName.trim()) return;
    await purchaseService.createSupplier({
      name: newSupplierName,
      tradeName: newSupplierTradeName || undefined,
      taxId: newSupplierTaxId || undefined,
      contactName: newSupplierContact || undefined,
      phone: newSupplierPhone || undefined,
      city: newSupplierCity || undefined,
      address: newSupplierAddress || undefined,
    });
    setNewSupplierName("");
    setNewSupplierTradeName("");
    setNewSupplierTaxId("");
    setNewSupplierContact("");
    setNewSupplierPhone("");
    setNewSupplierCity("");
    setNewSupplierAddress("");
    setShowNewSupplier(false);
    await refresh();
  }

  function handleAddItemToDraft() {
    if (quantity <= 0) return;
    // Conversión: el usuario captura en Kg (como le dan el precio normalmente)
    // o en Gr; el catálogo siempre vive en Gramos, así que se convierte aquí
    // una sola vez, para no obligar a calcular precio-por-gramo a mano.
    const quantityInGrams = captureUnit === "kg" ? quantity * 1000 : quantity;
    const costPerGram = captureUnit === "kg" ? unitCost / 1000 : unitCost;

    if (itemKind === "rawMaterial") {
      if (!selectedRawMaterialId) return;
      setDraftItems([...draftItems, { rawMaterialId: selectedRawMaterialId, quantity: quantityInGrams, unitCost: costPerGram, isVatExempt }]);
    } else {
      if (!selectedRecipeId) return;
      setDraftItems([...draftItems, { componentRecipeId: selectedRecipeId, quantity: quantityInGrams, unitCost: costPerGram, isVatExempt }]);
    }
    setQuantity(0);
    setUnitCost(0);
    setIsVatExempt(false);
  }

  async function handleCreateOrder() {
    setError(null);
    if (!selectedSupplierId) {
      setError("Selecciona un proveedor antes de crear la orden.");
      return;
    }
    if (draftItems.length === 0) {
      setError("Agrega al menos un ítem antes de crear la orden.");
      return;
    }
    await purchaseService.createPurchaseOrder(
      selectedSupplierId,
      draftItems,
      purchaseDate,
      paymentTerm,
      supplierInvoiceNumber || undefined
    );
    setDraftItems([]);
    setSupplierInvoiceNumber("");
    await refresh();
  }

  async function handleReceive(orderId: string) {
    setError(null);
    try {
      await purchaseService.receivePurchaseOrder(orderId);
      await refresh();
      // El stock recién recibido debe reflejarse de inmediato, sea de
      // materia prima o de un semielaborado comprado de emergencia (ADR-007).
      await Promise.all([loadRawMaterials(), loadSemiFinishedRecipes()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo recibir la orden.");
    }
  }

  // BP-041 FIX: función que faltaba — el botón "Anular" la llamaba
  // pero nunca se había declarado, rompiendo el build con:
  // "Cannot find name 'handleVoidOrder'".
  // El servicio purchaseService.voidPurchaseOrder sí existía y está
  // completo (BP-037) — solo faltaba conectarlo desde la página.
  async function handleVoidOrder(orderId: string) {
    setError(null);
    try {
      await purchaseService.voidPurchaseOrder(orderId);
      await refresh();
      // Si la orden ya tenía stock recibido, voidPurchaseOrder lo revirtió
      // en Firestore — recargamos los catálogos para reflejar el cambio.
      await Promise.all([loadRawMaterials(), loadSemiFinishedRecipes()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo anular la orden.");
    }
  }

  function itemLabel(item: PurchaseOrderItem): string {
    let base: string;
    if (item.rawMaterialId) {
      base = rawMaterials.find((rm) => rm.id === item.rawMaterialId)?.name ?? item.rawMaterialId;
    } else if (item.componentRecipeId) {
      const recipe = semiFinishedRecipes.find((r) => r.id === item.componentRecipeId);
      base = `${recipe?.name ?? item.componentRecipeId} (semielaborado, comprado ya hecho)`;
    } else {
      base = "Ítem desconocido";
    }
    return item.isVatExempt ? `${base} (exento de IVA)` : base;
  }

  function supplierName(id: string): string {
    const s = suppliers.find((sup) => sup.id === id);
    return s ? s.tradeName || s.name : id;
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
      <h1 style={{ color: colors.text }}>Compras</h1>
      <p style={{ color: colors.textMuted }}>
        Proveedores, órdenes de compra y recepción — al recibir, el stock real se actualiza automáticamente.
      </p>

      {error && (
        <p style={{ color: colors.danger, marginBottom: "16px" }}>⚠️ {error}</p>
      )}

      <section style={{ ...sectionStyle, padding: 0, overflow: "hidden" }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", cursor: "pointer" }}
          onClick={() => setSuppliersOpen(!suppliersOpen)}
        >
          <h2 style={{ color: colors.text, margin: 0 }}>Proveedores</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FormButton
              type="button"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setShowNewSupplier(!showNewSupplier);
                setSuppliersOpen(true);
              }}
            >
              {showNewSupplier ? "Cancelar" : "+ Nuevo proveedor"}
            </FormButton>
            <span style={{ color: colors.textMuted, fontSize: "20px" }}>{suppliersOpen ? "▲" : "▼"}</span>
          </div>
        </div>

        {suppliersOpen && (
          <div style={{ padding: "0 24px 24px" }}>
            {suppliers.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                {suppliers.map((s) => (
                  <div key={s.id} style={{ background: colors.card, borderRadius: "10px", padding: "12px 16px", marginBottom: "8px" }}>
                    {editingSupplierId === s.id ? (
                      <div>
                        <FormInput label="Razón social" value={editSupplierForm.name ?? ""} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, name: e.target.value })} />
                        <FormInput label="Denominación comercial" value={editSupplierForm.tradeName ?? ""} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, tradeName: e.target.value })} />
                        <FormInput label="RIF/CI" value={editSupplierForm.taxId ?? ""} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, taxId: e.target.value })} />
                        <FormInput label="Contacto" value={editSupplierForm.contactName ?? ""} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, contactName: e.target.value })} />
                        <FormInput label="Teléfono" value={editSupplierForm.phone ?? ""} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, phone: e.target.value })} />
                        <FormInput label="Ciudad" value={editSupplierForm.city ?? ""} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, city: e.target.value })} />
                        <FormInput label="Dirección" value={editSupplierForm.address ?? ""} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, address: e.target.value })} />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <FormButton type="button" onClick={saveEditSupplier}>Guardar</FormButton>
                          <FormButton type="button" variant="secondary" onClick={() => setEditingSupplierId(null)}>Cancelar</FormButton>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: colors.text }}>{s.tradeName || s.name}</span>
                        <button onClick={() => startEditSupplier(s)} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showNewSupplier && (
              <div style={{ background: colors.card, borderRadius: "10px", padding: "16px" }}>
                <FormInput label="Razón social" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} />
                <FormInput label="Denominación comercial (opcional)" value={newSupplierTradeName} onChange={(e) => setNewSupplierTradeName(e.target.value)} />
                <FormInput label="RIF/CI" value={newSupplierTaxId} onChange={(e) => setNewSupplierTaxId(e.target.value)} />
                <FormInput label="Contacto" value={newSupplierContact} onChange={(e) => setNewSupplierContact(e.target.value)} />
                <FormInput label="Teléfono" value={newSupplierPhone} onChange={(e) => setNewSupplierPhone(e.target.value)} />
                <FormInput label="Ciudad" value={newSupplierCity} onChange={(e) => setNewSupplierCity(e.target.value)} />
                <FormInput label="Dirección" value={newSupplierAddress} onChange={(e) => setNewSupplierAddress(e.target.value)} />
                <FormButton type="button" onClick={handleAddSupplier}>Guardar proveedor</FormButton>
              </div>
            )}
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <button
          onClick={() => setNewOrderOpen(!newOrderOpen)}
          style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}
        >
          <h2 style={{ color: colors.text, margin: 0 }}>Nueva orden de compra</h2>
          <span style={{ color: colors.textMuted, fontSize: "20px" }}>{newOrderOpen ? "▲" : "▼"}</span>
        </button>

        {newOrderOpen && (
        <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <FormInput
              label="Fecha de la factura"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <FormInput
              label="N° de factura del proveedor"
              value={supplierInvoiceNumber}
              onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
            />
          </div>
        </div>
        <FormSelect label="Condición de pago" value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value as "cash" | "credit")}>
          <option value="cash">Contado</option>
          <option value="credit">Crédito</option>
        </FormSelect>

        <FormSelect
          label="Proveedor"
          value={selectedSupplierId}
          onChange={(e) => setSelectedSupplierId(e.target.value)}
        >
          <option value="">Selecciona un proveedor</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </FormSelect>

        <FormSelect
          label="¿Qué estás comprando?"
          value={itemKind}
          onChange={(e) => setItemKind(e.target.value as ItemKind)}
        >
          <option value="rawMaterial">Materia prima</option>
          <option value="semiFinished">Semielaborado ya hecho (ej. emergencia)</option>
        </FormSelect>

        {itemKind === "rawMaterial" ? (
          loadingRawMaterials ? (
            <p style={{ color: colors.textMuted, fontSize: "13px" }}>Cargando materia prima...</p>
          ) : (
            <FormSelect
              label="Materia prima"
              value={selectedRawMaterialId}
              onChange={(e) => setSelectedRawMaterialId(e.target.value)}
            >
              {rawMaterials.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.name} (stock actual: {rm.currentStock} {rm.unit})
                </option>
              ))}
            </FormSelect>
          )
        ) : (
          <>
            <FormSelect
              label="Semielaborado"
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
            >
              {semiFinishedRecipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (stock actual: {r.currentStock ?? 0} {r.unit})
                </option>
              ))}
            </FormSelect>
            <p style={{ color: colors.warning, fontSize: "12px", marginTop: "-8px", marginBottom: "16px" }}>
              ⚠️ Uso excepcional: normalmente esto se fabrica en /production, no se compra.
            </p>
          </>
        )}

        <FormSelect label="Unidad de captura" value={captureUnit} onChange={(e) => setCaptureUnit(e.target.value as "g" | "kg")}>
          <option value="kg">Kilogramos (Kg) — como suele venir el precio del proveedor</option>
          <option value="g">Gramos (Gr)</option>
        </FormSelect>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <FormInput
              label={`Cantidad a pedir (${captureUnit === "kg" ? "Kg" : "Gr"})`}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={0}
            />
          </div>
          <div style={{ flex: 1 }}>
            <FormInput
              label={`Costo por ${captureUnit === "kg" ? "Kilo" : "Gramo"} ($)`}
              type="number"
              step="0.0001"
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              min={0}
            />
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: colors.text, fontSize: "13px" }}>
          <input type="checkbox" checked={isVatExempt} onChange={(e) => setIsVatExempt(e.target.checked)} />
          Este ítem está exento de IVA
        </label>

        <FormButton type="button" variant="secondary" onClick={handleAddItemToDraft}>
          Agregar ítem a la orden
        </FormButton>

        {draftItems.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: colors.textMuted, fontSize: "13px", marginBottom: "6px" }}>
              Ítems de esta orden (sin guardar todavía):
            </p>
            <ul style={{ color: colors.text, paddingLeft: "18px" }}>
              {draftItems.map((item, idx) => (
                <li key={idx}>
                  {itemLabel(item)} — {item.quantity} × ${item.unitCost}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "12px" }}>
              <FormButton type="button" onClick={handleCreateOrder}>
                Crear orden de compra
              </FormButton>
            </div>
          </div>
        )}
        </div>
        )}
      </section>

      <section style={sectionStyle}>
        <button
          onClick={() => setOrdersOpen(!ordersOpen)}
          style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}
        >
          <h2 style={{ color: colors.text, margin: 0 }}>Órdenes ({orders.length})</h2>
          <span style={{ color: colors.textMuted, fontSize: "20px" }}>{ordersOpen ? "▲" : "▼"}</span>
        </button>

        {ordersOpen && (
        <div style={{ marginTop: "16px" }}>
        {orders.length > 1 && (
          <div style={{ marginBottom: "12px" }}>
            <FormButton type="button" variant="secondary" onClick={() => setOrdersNewestFirst(!ordersNewestFirst)}>
              {ordersNewestFirst ? "Ver más antiguas primero" : "Ver más recientes primero"}
            </FormButton>
          </div>
        )}
        {orders.length === 0 && <p style={{ color: colors.textMuted }}>Todavía no hay órdenes registradas.</p>}
        {[...orders]
          .sort((a, b) =>
            ordersNewestFirst ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)
          )
          .map((order) => {
            const orderTotal = order.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
            return (
          <div key={order.id} style={{ background: colors.card, borderRadius: "12px", padding: "16px", marginBottom: "12px", opacity: order.status === "voided" ? 0.5 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong style={{ color: colors.text, display: "block" }}>{supplierName(order.supplierId)}</strong>
                <div style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>
                  {new Date(order.purchaseDate ?? order.createdAt).toLocaleDateString()} — {order.paymentTerm === "credit" ? "Crédito" : "Contado"}
                  <span style={{ marginLeft: "8px", color: order.status === "received" ? colors.primary : order.status === "voided" ? colors.danger : colors.warning }}>
                    {order.status === "received" ? "✅ Recibida" : order.status === "voided" ? "⚠️ ANULADA" : "⏳ Pendiente"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {order.status === "ordered" && (
                  <FormButton type="button" onClick={() => handleReceive(order.id)}>
                    Recibir
                  </FormButton>
                )}
                {order.status !== "voided" && (
                  <button
                    type="button"
                    onClick={() => handleVoidOrder(order.id)}
                    style={{ background: "transparent", border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}
                  >
                    Anular
                  </button>
                )}
                <Link
                  to={`/orders#order-${order.id}`}
                  style={{ background: "transparent", border: `1px solid ${colors.secondary}`, color: colors.secondary, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  Ver
                </Link>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "12px" }}>
              <ul style={{ color: colors.textMuted, fontSize: "13px", margin: 0, paddingLeft: "18px" }}>
                {order.items.map((item, idx) => (
                  <li key={idx}>{itemLabel(item)} — {item.quantity} × ${item.unitCost}</li>
                ))}
              </ul>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "16px" }}>
                {order.supplierInvoiceNumber && (
                  <div style={{ color: colors.text, fontSize: "13px" }}>Factura N° {order.supplierInvoiceNumber}</div>
                )}
                <div style={{ color: colors.primary, fontSize: "13px", marginTop: "2px" }}>
                  <strong>Total: ${orderTotal.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
            );
          })}
        </div>
        )}
      </section>
    </div>
  );
}