import { useState, useEffect, useCallback } from "react";
import * as purchaseService from "../services/purchaseService";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
import * as recipeStockService from "../services/recipeStockService";
import * as configService from "../services/configService";
import type { PurchaseOrder, PurchaseOrderItem } from "../models/PurchaseOrder";
import type { Supplier } from "../models/Supplier";
import type { RawMaterial } from "../models/RawMaterial";
import type { Recipe } from "../models/Recipe";
import type { Company } from "../models/Company";
import { colors } from "../theme/colors";
import { FormButton } from "../components/FormButton";

/**
 * Página: Órdenes de Compra — Ruta: /orders
 * BP-044: formato factura igual a /invoices, selector de rango de fechas,
 * exportar CSV del período filtrado.
 */
const IVA_PCT = 16;
const PT_LABELS: Record<string, string> = { cash: "Contado", credit: "Crédito" };

function today() { return new Date().toISOString().slice(0, 10); }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }

function calcTotals(items: PurchaseOrderItem[]) {
  const exempt = items.filter((i) => i.isVatExempt ?? false).reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const taxable = items.filter((i) => !(i.isVatExempt ?? false)).reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const iva = taxable * IVA_PCT / 100;
  return { exempt, taxable, iva, total: exempt + taxable + iva };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());

  const loadAll = useCallback(async () => {
    const [o, s, rm, rc, co] = await Promise.all([
      purchaseService.getPurchaseOrders(),
      purchaseService.getSuppliers(),
      rawMaterialInventoryService.getEffectiveRawMaterials(),
      recipeStockService.getEffectiveRecipes(),
      configService.getCompany(),
    ]);
    setOrders([...o].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setSuppliers(s); setRawMaterials(rm); setRecipes(rc); setCompany(co);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!loading && window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [loading]);

  const filtered = orders.filter((o) => {
    const d = (o.purchaseDate ?? o.createdAt).slice(0, 10);
    return d >= dateFrom && d <= dateTo;
  });

  function getSupplier(id: string) { return suppliers.find((s) => s.id === id); }

  function itemLabel(item: PurchaseOrderItem): string {
    if (item.rawMaterialId) return rawMaterials.find((m) => m.id === item.rawMaterialId)?.name ?? item.rawMaterialId;
    if (item.componentRecipeId) return recipes.find((r) => r.id === item.componentRecipeId)?.name ?? item.componentRecipeId;
    if (item.finishedProductId) return recipes.find((r) => r.id === item.finishedProductId)?.name ?? item.finishedProductId;
    if (item.customItemName) return item.customItemName;
    return "Ítem";
  }

  async function handleVoid(orderId: string) {
    setError(null);
    try { await purchaseService.voidPurchaseOrder(orderId); await loadAll(); }
    catch (e) { setError(e instanceof Error ? e.message : "Error"); }
  }

  function exportCSV() {
    const rows = [
      ["N° Factura Prov.", "Fecha", "Proveedor", "RIF Prov.", "Condición", "Exento ($)", "Base Imponible ($)", `IVA ${IVA_PCT}% ($)`, "Total ($)", "Estado"].join(","),
      ...filtered.map((o) => {
        const sup = getSupplier(o.supplierId);
        const t = calcTotals(o.items);
        return [
          o.supplierInvoiceNumber ?? "",
          fmtDate(o.purchaseDate ?? o.createdAt),
          `"${sup?.tradeName ?? sup?.name ?? o.supplierId}"`,
          sup?.taxId ?? "",
          PT_LABELS[o.paymentTerm] ?? o.paymentTerm,
          t.exempt.toFixed(2), t.taxable.toFixed(2), t.iva.toFixed(2), t.total.toFixed(2),
          o.status === "received" ? "Recibida" : o.status === "voided" ? "Anulada" : "Pendiente",
        ].join(",");
      }),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `compras-${dateFrom}-a-${dateTo}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const inputStyle = { background: colors.card, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "6px 10px", fontSize: "13px" };
  const thStyle = { color: colors.textMuted, padding: "6px 0", fontWeight: 600, fontSize: "13px" };
  const tdStyle = { color: colors.text, padding: "6px 0", fontSize: "13px" };

  // Totales del período filtrado
  const periodTotals = filtered.filter((o) => o.status !== "voided").reduce(
    (acc, o) => { const t = calcTotals(o.items); return { exempt: acc.exempt + t.exempt, taxable: acc.taxable + t.taxable, iva: acc.iva + t.iva, total: acc.total + t.total }; },
    { exempt: 0, taxable: 0, iva: 0, total: 0 }
  );

  return (
    <div style={{ maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: colors.text, margin: 0 }}>Órdenes de Compra</h1>
        <FormButton type="button" variant="secondary" onClick={exportCSV}>⬇ Exportar CSV</FormButton>
      </div>

      {/* Selector de rango */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ color: colors.textMuted, fontSize: "13px" }}>Desde:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ color: colors.textMuted, fontSize: "13px" }}>Hasta:</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { label: "Hoy", from: today(), to: today() },
            { label: "Esta semana", from: (() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10); })(), to: today() },
            { label: "Este mes", from: monthStart(), to: today() },
          ].map((s) => (
            <button key={s.label} onClick={() => { setDateFrom(s.from); setDateTo(s.to); }} style={{ padding: "4px 10px", borderRadius: "999px", border: `1px solid ${colors.border}`, background: "transparent", color: colors.secondary, fontSize: "12px", cursor: "pointer" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen del período */}
      {filtered.length > 0 && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px", marginBottom: "20px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "100px" }}>
            <div style={{ color: colors.textMuted, fontSize: "12px" }}>Órdenes</div>
            <div style={{ color: colors.text, fontSize: "22px", fontWeight: 700 }}>{filtered.length}</div>
          </div>
          <div style={{ flex: 1, minWidth: "100px" }}>
            <div style={{ color: colors.textMuted, fontSize: "12px" }}>Exento</div>
            <div style={{ color: colors.text, fontSize: "18px", fontWeight: 700 }}>${periodTotals.exempt.toFixed(2)}</div>
          </div>
          <div style={{ flex: 1, minWidth: "100px" }}>
            <div style={{ color: colors.textMuted, fontSize: "12px" }}>Base Imponible</div>
            <div style={{ color: colors.text, fontSize: "18px", fontWeight: 700 }}>${periodTotals.taxable.toFixed(2)}</div>
          </div>
          <div style={{ flex: 1, minWidth: "100px" }}>
            <div style={{ color: colors.textMuted, fontSize: "12px" }}>IVA {IVA_PCT}%</div>
            <div style={{ color: colors.warning, fontSize: "18px", fontWeight: 700 }}>${periodTotals.iva.toFixed(2)}</div>
          </div>
          <div style={{ flex: 1, minWidth: "100px" }}>
            <div style={{ color: colors.textMuted, fontSize: "12px" }}>Total comprado</div>
            <div style={{ color: colors.primary, fontSize: "22px", fontWeight: 700 }}>${periodTotals.total.toFixed(2)}</div>
          </div>
        </div>
      )}

      {error && <p style={{ color: colors.danger, marginBottom: "16px" }}>⚠️ {error}</p>}
      {loading && <p style={{ color: colors.textMuted }}>Cargando...</p>}
      {!loading && filtered.length === 0 && <p style={{ color: colors.textMuted }}>No hay órdenes en el rango seleccionado.</p>}

      {filtered.map((order) => {
        const sup = getSupplier(order.supplierId);
        const t = calcTotals(order.items);
        const isVoided = order.status === "voided";
        return (
          <div key={order.id} id={`order-${order.id}`}
            style={{ background: colors.surface, border: `1px solid ${isVoided ? colors.danger : colors.border}`, borderRadius: "16px", padding: "24px", marginBottom: "20px", opacity: isVoided ? 0.6 : 1 }}>

            {/* MEMBRETE — igual que /invoices */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${colors.border}`, paddingBottom: "16px", marginBottom: "16px" }}>
              <div>
                <p style={{ color: colors.primary, fontWeight: 700, fontSize: "17px", margin: "0 0 2px" }}>
                  {sup?.tradeName ?? sup?.name ?? "Proveedor desconocido"}
                </p>
                {sup?.taxId && <p style={{ color: colors.textMuted, fontSize: "13px", margin: "2px 0" }}>RIF: {sup.taxId}</p>}
                {sup?.address && <p style={{ color: colors.textMuted, fontSize: "13px", margin: "2px 0" }}>{sup.address}</p>}
                {sup?.phone && <p style={{ color: colors.textMuted, fontSize: "13px", margin: "2px 0" }}>Tel: {sup.phone}</p>}
              </div>
              <div style={{ textAlign: "right" }}>
                {order.supplierInvoiceNumber
                  ? <strong style={{ color: colors.primary, fontSize: "18px", display: "block" }}>Factura N° {order.supplierInvoiceNumber}</strong>
                  : <span style={{ color: colors.textMuted, fontSize: "13px", display: "block" }}>Sin N° de factura</span>}
                <span style={{ color: colors.textMuted, fontSize: "13px" }}>{fmtDate(order.purchaseDate ?? order.createdAt)}</span>
                <div style={{ marginTop: "4px" }}>
                  <span style={{ fontSize: "13px", color: order.status === "received" ? colors.primary : order.status === "voided" ? colors.danger : colors.warning }}>
                    {order.status === "received" ? "✅ Recibida" : order.status === "voided" ? "⚠️ ANULADA" : "⏳ Pendiente"}
                  </span>
                </div>
              </div>
            </div>

            {/* Comprador */}
            {company && (
              <div style={{ marginBottom: "16px", padding: "8px 12px", background: colors.card, borderRadius: "8px", fontSize: "13px" }}>
                <strong style={{ color: colors.text }}>Comprador: </strong>
                <span style={{ color: colors.textMuted }}>{company.legalName} — RIF: {company.taxId}</span>
                {company.address && <span style={{ color: colors.textMuted }}> — {company.address}</span>}
              </div>
            )}

            {/* Tabla de ítems */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ ...thStyle, textAlign: "left" }}>Descripción</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Cant.</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>P. Unit. (sin IVA)</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Subtotal</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>IVA</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}22` }}>
                    <td style={{ ...tdStyle, textAlign: "left" }}>{itemLabel(item)}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{item.quantity} {item.customItemUnit ?? "g"}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>${item.unitCost.toFixed(4)}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>${(item.quantity * item.unitCost).toFixed(2)}</td>
                    <td style={{ textAlign: "center", fontSize: "11px", padding: "6px 0" }}>
                      {(item.isVatExempt ?? false)
                        ? <span style={{ color: colors.textMuted }}>Exento</span>
                        : <span style={{ color: colors.warning }}>+{IVA_PCT}%</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales — igual que /invoices */}
            <div style={{ textAlign: "right", borderTop: `1px solid ${colors.border}`, paddingTop: "12px" }}>
              {t.exempt > 0 && (
                <p style={{ color: colors.textMuted, margin: "2px 0", fontSize: "13px" }}>
                  Monto exento de IVA: <strong>${t.exempt.toFixed(2)}</strong>
                </p>
              )}
              <p style={{ color: colors.textMuted, margin: "2px 0", fontSize: "13px" }}>
                Base imponible: <strong>${t.taxable.toFixed(2)}</strong>
              </p>
              <p style={{ color: colors.textMuted, margin: "2px 0", fontSize: "13px" }}>
                IVA ({IVA_PCT}%): <strong>${t.iva.toFixed(2)}</strong>
              </p>
              <p style={{ color: colors.primary, fontWeight: 700, fontSize: "18px", margin: "8px 0 4px" }}>
                Total: ${t.total.toFixed(2)}
              </p>
              <p style={{ color: colors.textMuted, fontSize: "12px", margin: 0 }}>
                {PT_LABELS[order.paymentTerm] ?? order.paymentTerm}
              </p>
            </div>

            {/* Botón anular */}
            {!isVoided && (
              <div style={{ textAlign: "right", marginTop: "16px" }}>
                <button type="button" onClick={() => handleVoid(order.id)} style={{ background: "transparent", border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: "8px", padding: "6px 16px", fontSize: "13px", cursor: "pointer" }}>
                  Anular orden
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}