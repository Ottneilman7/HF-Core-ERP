import { useState, useEffect } from "react";
import * as purchaseService from "../services/purchaseService";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
import * as recipeStockService from "../services/recipeStockService";
import type { PurchaseOrder, PurchaseOrderItem } from "../models/PurchaseOrder";
import type { Supplier } from "../models/Supplier";
import type { RawMaterial } from "../models/RawMaterial";
import type { Recipe } from "../models/Recipe";
import { colors } from "../theme/colors";

const PAYMENT_TERM_LABELS: Record<string, string> = { cash: "Contado", credit: "Crédito" };

/**
 * Página: Detalle de Órdenes de Compra — Ruta: /orders
 * Sin ítem en Sidebar — se accede desde "Ver" en /purchases, mismo
 * patrón que /invoices desde /sales y /payments desde /finance.
 */
export default function OrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [o, s, rm, rc] = await Promise.all([
      purchaseService.getPurchaseOrders(),
      purchaseService.getSuppliers(),
      rawMaterialInventoryService.getEffectiveRawMaterials(),
      recipeStockService.getEffectiveRecipes(),
    ]);
    setOrders([...o].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setSuppliers(s);
    setRawMaterials(rm);
    setRecipes(rc);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [loading]);

  function supplierName(id: string): string {
    const s = suppliers.find((sup) => sup.id === id);
    return s ? s.tradeName || s.name : id;
  }

  function itemLabel(item: PurchaseOrderItem): string {
    if (item.rawMaterialId) return rawMaterials.find((m) => m.id === item.rawMaterialId)?.name ?? item.rawMaterialId;
    if (item.componentRecipeId) return recipes.find((r) => r.id === item.componentRecipeId)?.name ?? item.componentRecipeId;
    return "Ítem";
  }

  function orderTotal(order: PurchaseOrder): number {
    return order.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
  }

  async function handleVoid(orderId: string) {
    setError(null);
    try {
      await purchaseService.voidPurchaseOrder(orderId);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo anular la orden.");
    }
  }

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ color: colors.text }}>Órdenes de Compra</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        Detalle completo de cada orden — anular una orden recibida devuelve el inventario (para devoluciones al proveedor).
      </p>

      {error && <p style={{ color: colors.danger, marginBottom: "16px" }}>⚠️ {error}</p>}
      {loading && <p style={{ color: colors.textMuted }}>Cargando...</p>}
      {!loading && orders.length === 0 && <p style={{ color: colors.textMuted }}>Todavía no hay órdenes.</p>}

      {orders.map((order) => (
        <div key={order.id} id={`order-${order.id}`} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <strong style={{ color: colors.primary, fontSize: "17px", display: "block" }}>{supplierName(order.supplierId)}</strong>
              <span style={{ fontSize: "12px", color: colors.textMuted }}>
                {new Date(order.purchaseDate ?? order.createdAt).toLocaleDateString()} — {PAYMENT_TERM_LABELS[order.paymentTerm] ?? order.paymentTerm}
              </span>
              <div style={{ marginTop: "4px" }}>
                <span style={{
                  fontSize: "12px",
                  color: order.status === "received" ? colors.primary : order.status === "voided" ? colors.danger : colors.warning,
                }}>
                  {order.status === "received" ? "✅ Recibida" : order.status === "voided" ? "⚠️ ANULADA" : "⏳ Pendiente"}
                </span>
              </div>
            </div>

            {order.status !== "voided" && (
              <button
                type="button"
                onClick={() => handleVoid(order.id)}
                style={{ background: "transparent", border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}
              >
                Anular
              </button>
            )}
          </div>

          <ul style={{ color: colors.textMuted, fontSize: "13px", marginTop: "16px", paddingLeft: "18px" }}>
            {order.items.map((item, idx) => (
              <li key={idx}>
                {itemLabel(item)} — {item.quantity}g × ${item.unitCost.toFixed(4)}{item.isVatExempt ? " (exento de IVA)" : ""}
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "16px" }}>
            <div>
              {order.supplierInvoiceNumber && (
                <div style={{ color: colors.text, fontSize: "13px" }}>Factura N° {order.supplierInvoiceNumber}</div>
              )}
            </div>
            <div style={{ color: colors.primary, fontWeight: 700, fontSize: "16px" }}>
              Total: ${orderTotal(order).toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}