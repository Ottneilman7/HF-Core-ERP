import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { products } from "../data/products";
import * as salesService from "../services/salesService";
import * as finishedGoodsInventoryService from "../services/finishedGoodsInventoryService";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
import * as recipeStockService from "../services/recipeStockService";
import * as customerBalanceService from "../services/customerBalanceService";
import * as invoiceService from "../services/invoiceService";
import * as configService from "../services/configService";
import type { Sale, SaleItem, PaymentType } from "../models/Sale";
import type { Invoice } from "../models/Invoice";
import type { RawMaterial } from "../models/RawMaterial";
import type { Recipe } from "../models/Recipe";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";

type ItemKind = "product" | "semiFinished" | "rawMaterial";

/**
 * Página: Ventas (Flujo 5)
 * Ruta: /sales
 * BP-028: además de producto terminado, se puede vender semielaborado
 * (Granola a granel) o materia prima suelta (ej. avena cruda).
 */
export default function SalesPage() {
  const [, forceRefresh] = useState(0);
  const [customers, setCustomers] = useState<Awaited<ReturnType<typeof customerBalanceService.getEffectiveCustomers>>>([]);

  const loadCustomers = useCallback(async () => {
    const all = await customerBalanceService.getEffectiveCustomers();
    const active = all.filter((c) => c.active);
    setCustomers(active);
    setSelectedCustomerId((prev) => prev || active[0]?.id || "");
  }, []);
  const finishedStock = finishedGoodsInventoryService.getAllStock();
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const loadSalesAndInvoices = useCallback(async () => {
    setSales(await salesService.getSales());
    setInvoices(await invoiceService.getInvoices());
  }, []);

  function invoiceForSale(saleId: string) {
    return invoices.find((inv) => inv.saleId === saleId);
  }

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [semiFinished, setSemiFinished] = useState<Recipe[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  useEffect(() => {
    loadCustomers();
    loadSalesAndInvoices();
    Promise.all([
      rawMaterialInventoryService.getEffectiveRawMaterials(),
      recipeStockService.getEffectiveRecipes(),
    ]).then(([materials, recipes]) => {
      setRawMaterials(materials.filter((m) => m.active));
      setSemiFinished(recipes.filter((r) => r.active && r.tracksInventory));
      setLoadingCatalogs(false);
    });
  }, [loadCustomers, loadSalesAndInvoices]);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [itemKind, setItemKind] = useState<ItemKind>("product");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [draftItems, setDraftItems] = useState<SaleItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [salesNewestFirst, setSalesNewestFirst] = useState(true);

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerTradeName, setNewCustomerTradeName] = useState("");
  const [newCustomerTaxId, setNewCustomerTaxId] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerType, setNewCustomerType] = useState("Persona Natural");
  const [newRetentionType, setNewRetentionType] = useState<"none" | "agent_75" | "agent_100">("none");

  function refresh() {
    forceRefresh((n) => n + 1);
  }

  function itemLabel(item: SaleItem): string {
    if (item.productId) return products.find((p) => p.id === item.productId)?.name ?? item.productId;
    if (item.componentRecipeId) return semiFinished.find((r) => r.id === item.componentRecipeId)?.name ?? item.componentRecipeId;
    if (item.rawMaterialId) return rawMaterials.find((m) => m.id === item.rawMaterialId)?.name ?? item.rawMaterialId;
    return "Ítem";
  }

  function customerName(id: string): string {
    return customers.find((c) => c.id === id)?.businessName ?? id;
  }

  async function handleCreateCustomer() {
    if (!newCustomerName.trim()) return;
    const created = await customerBalanceService.createCustomer({
      code: `CLI-${Date.now().toString().slice(-6)}`,
      businessName: newCustomerName,
      tradeName: newCustomerTradeName || undefined,
      taxId: newCustomerTaxId || undefined,
      contactName: newCustomerContact,
      phone: newCustomerPhone,
      email: "",
      city: newCustomerCity,
      address: newCustomerAddress || undefined,
      customerType: newCustomerType,
      retentionAgentType: newRetentionType,
      creditDays: 0,
      creditLimit: 0,
      priority: "LOW",
    });
    setSelectedCustomerId(created.id);
    setNewCustomerName("");
    setNewCustomerTradeName("");
    setNewCustomerTaxId("");
    setNewCustomerContact("");
    setNewCustomerPhone("");
    setNewCustomerCity("");
    setNewCustomerAddress("");
    setNewCustomerType("Persona Natural");
    setNewRetentionType("none");
    setShowNewCustomer(false);
    await loadCustomers();
  }

  function handleAddItemToDraft() {
    if (quantity <= 0) return;
    if (itemKind === "product" && selectedProductId) {
      setDraftItems([...draftItems, { productId: selectedProductId, quantity, unitPrice }]);
    } else if (itemKind === "semiFinished" && selectedRecipeId) {
      setDraftItems([...draftItems, { componentRecipeId: selectedRecipeId, quantity, unitPrice }]);
    } else if (itemKind === "rawMaterial" && selectedRawMaterialId) {
      setDraftItems([...draftItems, { rawMaterialId: selectedRawMaterialId, quantity, unitPrice }]);
    } else {
      return;
    }
    setQuantity(0);
    setUnitPrice(0);
  }

  async function handleConfirmSale() {
    setError(null);
    if (!selectedCustomerId || draftItems.length === 0) return;
    try {
      const sale = await salesService.createSale(selectedCustomerId, draftItems, paymentType);
      const customer = customers.find((c) => c.id === selectedCustomerId);
      if (customer) {
        const taxConfig = await configService.getTaxConfig();
        const labels = draftItems.map(itemLabel);
        await invoiceService.createInvoiceFromSale(sale, customer, labels, taxConfig);
      }
      setDraftItems([]);
      refresh();
      await loadCustomers();
      await loadSalesAndInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    }
  }

  async function handleVoidSale(saleId: string) {
    setError(null);
    try {
      await salesService.voidSale(saleId);
      refresh();
      await loadCustomers();
      await loadSalesAndInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo anular.");
    }
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
        Registra una venta: descuenta el inventario correspondiente y, si es a crédito, aumenta el saldo del
        cliente.
      </p>

      <section style={sectionStyle}>
        <h2 style={{ color: colors.text, marginTop: 0 }}>Nueva venta</h2>

        <FormSelect label="Cliente" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.businessName}</option>
          ))}
        </FormSelect>

        <FormButton type="button" variant="secondary" onClick={() => setShowNewCustomer(!showNewCustomer)} style={{ marginBottom: "16px" }}>
          {showNewCustomer ? "Cancelar" : "+ Nuevo cliente"}
        </FormButton>

        {showNewCustomer && (
          <div style={{ background: colors.card, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
            <FormInput label="Razón social" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
            <FormInput label="Denominación comercial (opcional)" value={newCustomerTradeName} onChange={(e) => setNewCustomerTradeName(e.target.value)} />
            <FormSelect label="Tipo de cliente" value={newCustomerType} onChange={(e) => setNewCustomerType(e.target.value)}>
              <option value="Persona Natural">Persona Natural</option>
              <option value="Persona Jurídica">Persona Jurídica</option>
            </FormSelect>
            <FormInput label={newCustomerType === "Persona Jurídica" ? "RIF" : "Cédula"} value={newCustomerTaxId} onChange={(e) => setNewCustomerTaxId(e.target.value)} />
            <FormSelect label="Agente de retención" value={newRetentionType} onChange={(e) => setNewRetentionType(e.target.value as "none" | "agent_75" | "agent_100")}>
              <option value="none">No agente de retención</option>
              <option value="agent_75">Agente de retención 75%</option>
              <option value="agent_100">Agente de retención 100%</option>
            </FormSelect>
            <FormInput label="Contacto" value={newCustomerContact} onChange={(e) => setNewCustomerContact(e.target.value)} />
            <FormInput label="Teléfono" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} />
            <FormInput label="Ciudad" value={newCustomerCity} onChange={(e) => setNewCustomerCity(e.target.value)} />
            <FormInput label="Dirección" value={newCustomerAddress} onChange={(e) => setNewCustomerAddress(e.target.value)} />
            <FormButton type="button" onClick={handleCreateCustomer}>Guardar cliente</FormButton>
          </div>
        )}

        <FormSelect label="¿Qué vas a vender?" value={itemKind} onChange={(e) => setItemKind(e.target.value as ItemKind)}>
          <option value="product">Producto terminado</option>
          <option value="semiFinished">Semielaborado (ej. Granola a granel)</option>
          <option value="rawMaterial">Materia prima suelta (ej. avena cruda)</option>
        </FormSelect>

        {itemKind === "product" && (
          <FormSelect label="Producto" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (disponible: {finishedStock[p.id] ?? 0})</option>
            ))}
          </FormSelect>
        )}

        {itemKind === "semiFinished" && (
          loadingCatalogs ? (
            <p style={{ color: colors.textMuted, fontSize: "13px" }}>Cargando...</p>
          ) : (
            <FormSelect label="Semielaborado" value={selectedRecipeId} onChange={(e) => setSelectedRecipeId(e.target.value)}>
              <option value="">Selecciona uno</option>
              {semiFinished.map((r) => (
                <option key={r.id} value={r.id}>{r.name} (disponible: {r.currentStock ?? 0} {r.unit})</option>
              ))}
            </FormSelect>
          )
        )}

        {itemKind === "rawMaterial" && (
          loadingCatalogs ? (
            <p style={{ color: colors.textMuted, fontSize: "13px" }}>Cargando...</p>
          ) : (
            <FormSelect label="Materia prima" value={selectedRawMaterialId} onChange={(e) => setSelectedRawMaterialId(e.target.value)}>
              <option value="">Selecciona una</option>
              {rawMaterials.map((m) => (
                <option key={m.id} value={m.id}>{m.name} (disponible: {m.currentStock} {m.unit})</option>
              ))}
            </FormSelect>
          )
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <FormInput label="Cantidad" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={0} />
          </div>
          <div style={{ flex: 1 }}>
            <FormInput label="Precio unitario ($)" type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} min={0} />
          </div>
        </div>

        <FormButton type="button" variant="secondary" onClick={handleAddItemToDraft}>
          Agregar ítem a la venta
        </FormButton>

        {draftItems.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <ul style={{ color: colors.text, paddingLeft: "18px" }}>
              {draftItems.map((item, idx) => (
                <li key={idx}>{itemLabel(item)} — {item.quantity} × ${item.unitPrice}</li>
              ))}
            </ul>

            <FormSelect label="Forma de pago" value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)}>
              <option value="cash">Contado</option>
              <option value="credit">Crédito</option>
            </FormSelect>

            <FormButton type="button" onClick={handleConfirmSale}>Confirmar venta</FormButton>
          </div>
        )}

        {error && <p style={{ color: colors.danger, marginTop: "10px" }}>{error}</p>}
      </section>

      <section style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: colors.text, marginTop: 0 }}>Ventas registradas</h2>
          {sales.length > 1 && (
            <FormButton type="button" variant="secondary" onClick={() => setSalesNewestFirst(!salesNewestFirst)}>
              {salesNewestFirst ? "Ver más antiguas primero" : "Ver más recientes primero"}
            </FormButton>
          )}
        </div>
        {sales.length === 0 && <p style={{ color: colors.textMuted }}>Todavía no hay ventas registradas.</p>}
        {[...sales]
          .sort((a, b) =>
            salesNewestFirst ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)
          )
          .map((sale) => {
            const invoice = invoiceForSale(sale.id);
            return (
            <div key={sale.id} style={{ background: colors.card, borderRadius: "12px", padding: "16px", marginBottom: "12px", opacity: sale.status === "voided" ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong style={{ color: colors.text, display: "block" }}>{customerName(sale.customerId)}</strong>
                  <div style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>
                    {new Date(sale.createdAt).toLocaleDateString()} — {sale.paymentType === "credit" ? "Crédito" : "Contado"}
                    {sale.status === "voided" && " — ⚠️ ANULADA"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {sale.status !== "voided" && (
                    <button
                      type="button"
                      onClick={() => handleVoidSale(sale.id)}
                      style={{ background: "transparent", border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}
                    >
                      Anular
                    </button>
                  )}
                  {invoice && (
                    <Link
                      to={`/invoices#invoice-${sale.id}`}
                      style={{
                        background: "transparent",
                        border: `1px solid ${colors.secondary}`,
                        color: colors.secondary,
                        borderRadius: "8px",
                        padding: "4px 10px",
                        fontSize: "12px",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      📄 Ver factura N° {invoice.number}
                    </Link>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "12px" }}>
                <ul style={{ color: colors.textMuted, fontSize: "13px", margin: 0, paddingLeft: "18px" }}>
                  {sale.items.map((item, idx) => (
                    <li key={idx}>{itemLabel(item)} — {item.quantity} × ${item.unitPrice}</li>
                  ))}
                </ul>

                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "16px" }}>
                  <div style={{ color: colors.text, fontSize: "13px" }}>
                    Total Factura: <strong>${(invoice?.total ?? sale.total).toFixed(2)}</strong>
                  </div>
                  {invoice && invoice.netAmountDue !== undefined && (
                    <div style={{ color: colors.primary, fontSize: "13px", marginTop: "2px" }}>
                      Total a Pagar: <strong>${invoice.netAmountDue.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
      </section>
    </div>
  );
}