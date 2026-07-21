import { useState } from "react";
import { products } from "../data/products";
import * as salesService from "../services/salesService";
import * as finishedGoodsInventoryService from "../services/finishedGoodsInventoryService";
import * as customerBalanceService from "../services/customerBalanceService";
import type { SaleItem, PaymentType } from "../models/Sale";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";

/**
 * Página: Ventas (Flujo 5)
 * Ruta: /sales
 */
export default function SalesPage() {
  const [, forceRefresh] = useState(0);
  const customers = customerBalanceService.getEffectiveCustomers().filter((c) => c.active);
  const stock = finishedGoodsInventoryService.getAllStock();
  const sales = salesService.getSales();

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? "");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [draftItems, setDraftItems] = useState<SaleItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [restockProductId, setRestockProductId] = useState(products[0]?.id ?? "");
  const [restockQuantity, setRestockQuantity] = useState<number>(0);

  function refresh() {
    forceRefresh((n) => n + 1);
  }

  function productName(id: string): string {
    return products.find((p) => p.id === id)?.name ?? id;
  }

  function customerName(id: string): string {
    return customers.find((c) => c.id === id)?.businessName ?? id;
  }

  function handleAddItemToDraft() {
    if (quantity <= 0) return;
    setDraftItems([...draftItems, { productId: selectedProductId, quantity, unitPrice }]);
    setQuantity(0);
    setUnitPrice(0);
  }

  function handleConfirmSale() {
    setError(null);
    if (!selectedCustomerId || draftItems.length === 0) return;
    try {
      salesService.createSale(selectedCustomerId, draftItems, paymentType);
      setDraftItems([]);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    }
  }

  function handleRestock() {
    if (restockQuantity <= 0) return;
    finishedGoodsInventoryService.increaseStock(restockProductId, restockQuantity);
    setRestockQuantity(0);
    refresh();
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
      <h1 style={{ color: colors.text }}>Ventas</h1>
      <p style={{ color: colors.textMuted }}>
        Registra una venta: descuenta el inventario y, si es a crédito, aumenta el saldo del cliente.
      </p>

      <section style={{ ...sectionStyle, borderColor: colors.warning }}>
        <h2 style={{ color: colors.text, marginTop: 0 }}>Inventario de producto terminado</h2>
        <p style={{ color: colors.textMuted, fontSize: "13px" }}>
          ⚠️ Puente temporal: Producción todavía no suma aquí automáticamente al confirmar un lote (BP-014
          Fase 2, pendiente). Usa esto para registrar manualmente lo que ya fabricaste, mientras tanto.
        </p>
        <ul style={{ color: colors.text, paddingLeft: "18px" }}>
          {products.map((p) => (
            <li key={p.id}>
              {p.name}: {stock[p.id] ?? 0} unidades
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 2 }}>
            <FormSelect
              label="Producto"
              value={restockProductId}
              onChange={(e) => setRestockProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <div style={{ flex: 1 }}>
            <FormInput
              label="Cantidad producida"
              type="number"
              value={restockQuantity}
              onChange={(e) => setRestockQuantity(Number(e.target.value))}
              min={0}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <FormButton type="button" variant="secondary" onClick={handleRestock}>
              Registrar
            </FormButton>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ color: colors.text, marginTop: 0 }}>Nueva venta</h2>

        <FormSelect
          label="Cliente"
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.businessName}
            </option>
          ))}
        </FormSelect>

        <FormSelect
          label="Producto"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (disponible: {stock[p.id] ?? 0})
            </option>
          ))}
        </FormSelect>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <FormInput
              label="Cantidad"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={0}
            />
          </div>
          <div style={{ flex: 1 }}>
            <FormInput
              label="Precio unitario ($)"
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              min={0}
            />
          </div>
        </div>

        <FormButton type="button" variant="secondary" onClick={handleAddItemToDraft}>
          Agregar ítem a la venta
        </FormButton>

        {draftItems.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <ul style={{ color: colors.text, paddingLeft: "18px" }}>
              {draftItems.map((item, idx) => (
                <li key={idx}>
                  {productName(item.productId)} — {item.quantity} × ${item.unitPrice}
                </li>
              ))}
            </ul>

            <FormSelect
              label="Forma de pago"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
            >
              <option value="cash">Contado</option>
              <option value="credit">Crédito</option>
            </FormSelect>

            <FormButton type="button" onClick={handleConfirmSale}>
              Confirmar venta
            </FormButton>
          </div>
        )}

        {error && <p style={{ color: colors.danger, marginTop: "10px" }}>{error}</p>}
      </section>

      <section style={sectionStyle}>
        <h2 style={{ color: colors.text, marginTop: 0 }}>Ventas registradas</h2>
        {sales.length === 0 && <p style={{ color: colors.textMuted }}>Todavía no hay ventas registradas.</p>}
        {sales.map((sale) => (
          <div
            key={sale.id}
            style={{ background: colors.card, borderRadius: "12px", padding: "16px", marginBottom: "12px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong style={{ color: colors.text }}>{customerName(sale.customerId)}</strong>
              <span style={{ color: colors.text }}>${sale.total.toFixed(2)}</span>
            </div>
            <span style={{ fontSize: "12px", color: colors.textMuted }}>
              {sale.paymentType === "credit" ? "Crédito" : "Contado"}
            </span>
            <ul style={{ color: colors.textMuted, fontSize: "13px", marginTop: "8px", paddingLeft: "18px" }}>
              {sale.items.map((item, idx) => (
                <li key={idx}>
                  {productName(item.productId)} — {item.quantity} × ${item.unitPrice}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
