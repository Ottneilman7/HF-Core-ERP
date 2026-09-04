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

/**
 * BP-044: mejoras de Compras
 * A. Botón "Nuevo Proveedor" siempre visible arriba, fuera de fichas.
 * B. 4 tipos de ítem: Materia Prima / Semielaborado / Producto Terminado / Otro.
 * C. IVA por ítem: precio sin IVA + 16% solo en no exentos.
 * D. Fix refresco de lista de proveedores tras agregar uno nuevo.
 */

type ItemKind = "rawMaterial" | "semiFinished" | "finished" | "other";



export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState<Awaited<ReturnType<typeof purchaseService.getSuppliers>>>([]);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof purchaseService.getPurchaseOrders>>>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [semiFinished, setSemiFinished] = useState<Recipe[]>([]);
  const [finishedRecipes, setFinishedRecipes] = useState<Recipe[]>([]);
  const IVA_PCT = 16;

  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

  // Formulario nuevo proveedor
  const [ns, setNs] = useState({ name:"", trade:"", taxId:"", contact:"", phone:"", city:"", address:"" });

  // Formulario edición proveedor
  const [editingId, setEditingId] = useState<string|null>(null);
  const [viewingId, setViewingId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState<Partial<Supplier>>({});

  // Formulario nueva orden
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0,10));
  const [supplierInvoice, setSupplierInvoice] = useState("");
  const [paymentTerm, setPaymentTerm] = useState<"cash"|"credit">("cash");
  const [itemKind, setItemKind] = useState<ItemKind>("rawMaterial");
  const [captureUnit, setCaptureUnit] = useState<"g"|"kg">("kg");
  const [selRawId, setSelRawId] = useState("");
  const [selSemiId, setSelSemiId] = useState("");
  const [selFinishedId, setSelFinishedId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("Unidades");
  const [qty, setQty] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [isVatExempt, setIsVatExempt] = useState(false);
  const [draftItems, setDraftItems] = useState<PurchaseOrderItem[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0); // Precio TOTAL pagado (no por unidad)
  const [error, setError] = useState<string|null>(null);
  const [ordersNewestFirst, setOrdersNewestFirst] = useState(true);

  const refresh = useCallback(async () => {
    const [s, o] = await Promise.all([purchaseService.getSuppliers(), purchaseService.getPurchaseOrders()]);
    setSuppliers(s);
    setOrders(o);
  }, []);

  const loadCatalogs = useCallback(async () => {
    const [rm, recipes] = await Promise.all([
      rawMaterialInventoryService.getEffectiveRawMaterials(),
      recipeStockService.getEffectiveRecipes(),
    ]);
    setRawMaterials(rm.filter((m) => m.active));
    setSemiFinished(recipes.filter((r) => r.active && r.tracksInventory));
    setFinishedRecipes(recipes.filter((r) => r.active && !r.tracksInventory));
  }, []);

  useEffect(() => { refresh(); loadCatalogs(); }, [refresh, loadCatalogs]);

  async function handleAddSupplier() {
    if (!ns.name.trim()) return;
    await purchaseService.createSupplier({ name: ns.name, tradeName: ns.trade||undefined, taxId: ns.taxId||undefined, contactName: ns.contact||undefined, phone: ns.phone||undefined, city: ns.city||undefined, address: ns.address||undefined });
    setNs({ name:"", trade:"", taxId:"", contact:"", phone:"", city:"", address:"" });
    setShowNewSupplier(false);
    setSuppliersOpen(true);
    await refresh(); // fix refresco inmediato
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    await purchaseService.updateSupplier(editingId, editForm);
    setEditingId(null);
    await refresh();
  }

  function itemLabel(item: PurchaseOrderItem): string {
    if (item.rawMaterialId) return rawMaterials.find((m)=>m.id===item.rawMaterialId)?.name ?? item.rawMaterialId;
    if (item.componentRecipeId) return semiFinished.find((r)=>r.id===item.componentRecipeId)?.name ?? item.componentRecipeId;
    if (item.finishedProductId) return finishedRecipes.find((r)=>r.id===item.finishedProductId)?.name ?? item.finishedProductId;
    if (item.customItemName) return item.customItemName;
    return "Ítem";
  }

  function handleAddItem() {
    if (qty <= 0 || totalCost <= 0) return;
    // unitCost = precio por unidad (g); totalCost = lo que pagó el emprendedor en total
    const qtyBase = (itemKind === "rawMaterial" && captureUnit === "kg") ? qty * 1000 : qty;
    const costBase = totalCost / qtyBase; // precio real por gramo/unidad
    const base = { quantity: qtyBase, unitCost: costBase, isVatExempt };
    if (itemKind === "rawMaterial" && selRawId) setDraftItems([...draftItems, { rawMaterialId: selRawId, ...base }]);
    else if (itemKind === "semiFinished" && selSemiId) setDraftItems([...draftItems, { componentRecipeId: selSemiId, ...base }]);
    else if (itemKind === "finished" && selFinishedId) setDraftItems([...draftItems, { finishedProductId: selFinishedId, ...base }]);
    else if (itemKind === "other" && customName.trim()) setDraftItems([...draftItems, { customItemName: customName, customItemUnit: customUnit, quantity: qty, unitCost, isVatExempt }]);
    else return;
    setQty(0); setUnitCost(0); setTotalCost(0); setIsVatExempt(false);
  }

  async function handleCreateOrder() {
    setError(null);
    if (!selectedSupplierId) { setError("Selecciona un proveedor."); return; }
    if (draftItems.length === 0) { setError("Agrega al menos un ítem."); return; }
    await purchaseService.createPurchaseOrder(selectedSupplierId, draftItems, purchaseDate, paymentTerm, supplierInvoice||undefined);
    setDraftItems([]); setSupplierInvoice("");
    await refresh();
  }

  async function handleReceive(orderId: string) {
    setError(null);
    try { await purchaseService.receivePurchaseOrder(orderId); await refresh(); await loadCatalogs(); }
    catch(e) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function handleVoidOrder(orderId: string) {
    setError(null);
    try { await purchaseService.voidPurchaseOrder(orderId); await refresh(); await loadCatalogs(); }
    catch(e) { setError(e instanceof Error ? e.message : "Error"); }
  }

  function supplierName(id: string) {
    const s = suppliers.find((sup) => sup.id === id);
    return s ? s.tradeName || s.name : id;
  }

  // Totales del draft con IVA
  const draftTaxable = draftItems.filter((i)=>!i.isVatExempt).reduce((s,i)=>s+i.quantity*i.unitCost,0);
  const draftExempt = draftItems.filter((i)=>i.isVatExempt).reduce((s,i)=>s+i.quantity*i.unitCost,0);
  const draftTotal = draftExempt + draftTaxable * (1 + IVA_PCT/100);

  const section = { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", marginBottom: "24px", overflow: "hidden" };
  const header = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", cursor: "pointer" } as const;
  const body = { padding: "0 24px 24px" };
  const btn = (color: string) => ({ background: "transparent", border: `1px solid ${color}`, color, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" });

  return (
    <div style={{ maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h1 style={{ color: colors.text, margin: 0 }}>Compras</h1>
        <FormButton type="button" onClick={() => { setShowNewSupplier(!showNewSupplier); setSuppliersOpen(true); }}>
          {showNewSupplier ? "Cancelar" : "+ Nuevo proveedor"}
        </FormButton>
      </div>
      <p style={{ color: colors.textMuted, marginBottom: "20px" }}>
        Proveedores, órdenes de compra y recepción de mercancía.{" "}
        <Link to="/purchases/payments" style={{ color: colors.secondary }}>→ Cuentas por Pagar</Link>
      </p>

      {error && <p style={{ color: colors.danger, marginBottom: "16px" }}>⚠️ {error}</p>}

      {/* FORMULARIO NUEVO PROVEEDOR — fuera de fichas */}
      {showNewSupplier && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.primary}`, borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
          <h3 style={{ color: colors.text, marginTop: 0 }}>Nuevo proveedor</h3>
          <FormInput label="Razón social" value={ns.name} onChange={(e)=>setNs({...ns,name:e.target.value})} />
          <FormInput label="Denominación comercial (opcional)" value={ns.trade} onChange={(e)=>setNs({...ns,trade:e.target.value})} />
          <FormInput label="RIF/CI" value={ns.taxId} onChange={(e)=>setNs({...ns,taxId:e.target.value})} />
          <FormInput label="Contacto" value={ns.contact} onChange={(e)=>setNs({...ns,contact:e.target.value})} />
          <FormInput label="Teléfono" value={ns.phone} onChange={(e)=>setNs({...ns,phone:e.target.value})} />
          <FormInput label="Ciudad" value={ns.city} onChange={(e)=>setNs({...ns,city:e.target.value})} />
          <FormInput label="Dirección" value={ns.address} onChange={(e)=>setNs({...ns,address:e.target.value})} />
          <FormButton type="button" onClick={handleAddSupplier}>Guardar proveedor</FormButton>
        </div>
      )}

      {/* PROVEEDORES */}
      <div style={section}>
        <div style={header} onClick={()=>setSuppliersOpen(!suppliersOpen)}>
          <h2 style={{ color: colors.text, margin: 0 }}>Proveedores ({suppliers.length})</h2>
          <span style={{ color: colors.textMuted, fontSize: "20px" }}>{suppliersOpen?"▲":"▼"}</span>
        </div>
        {suppliersOpen && (
          <div style={body}>
            {suppliers.length === 0 && <p style={{ color: colors.textMuted }}>No hay proveedores todavía.</p>}
            {suppliers.map((s) => (
              <div key={s.id} style={{ background: colors.card, borderRadius: "10px", padding: "12px 16px", marginBottom: "8px" }}>
                {editingId === s.id ? (
                  <div>
                    <FormInput label="Razón social" value={editForm.name??""} onChange={(e)=>setEditForm({...editForm,name:e.target.value})} />
                    <FormInput label="Denominación comercial" value={editForm.tradeName??""} onChange={(e)=>setEditForm({...editForm,tradeName:e.target.value})} />
                    <FormInput label="RIF/CI" value={editForm.taxId??""} onChange={(e)=>setEditForm({...editForm,taxId:e.target.value})} />
                    <FormInput label="Teléfono" value={editForm.phone??""} onChange={(e)=>setEditForm({...editForm,phone:e.target.value})} />
                    <FormInput label="Ciudad" value={editForm.city??""} onChange={(e)=>setEditForm({...editForm,city:e.target.value})} />
                    <div style={{ display:"flex", gap:"8px" }}>
                      <FormButton type="button" onClick={handleSaveEdit}>Guardar</FormButton>
                      <FormButton type="button" variant="secondary" onClick={()=>setEditingId(null)}>Cancelar</FormButton>
                    </div>
                  </div>
                ) : viewingId === s.id ? (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                      <strong style={{ color: colors.primary, fontSize:"15px" }}>{s.tradeName||s.name}</strong>
                      <button onClick={()=>setViewingId(null)} style={btn(colors.border)}>✕ Cerrar</button>
                    </div>
                    {s.name && s.tradeName && s.name !== s.tradeName && <p style={{ color: colors.textMuted, fontSize:"13px", margin:"4px 0" }}><strong>Razón social:</strong> {s.name}</p>}
                    {s.taxId && <p style={{ color: colors.textMuted, fontSize:"13px", margin:"4px 0" }}><strong>RIF/CI:</strong> {s.taxId}</p>}
                    {s.contactName && <p style={{ color: colors.textMuted, fontSize:"13px", margin:"4px 0" }}><strong>Contacto:</strong> {s.contactName}</p>}
                    {s.phone && <p style={{ color: colors.textMuted, fontSize:"13px", margin:"4px 0" }}><strong>Teléfono:</strong> <a href={`tel:${s.phone}`} style={{ color: colors.secondary }}>{s.phone}</a></p>}
                    {s.city && <p style={{ color: colors.textMuted, fontSize:"13px", margin:"4px 0" }}><strong>Ciudad:</strong> {s.city}</p>}
                    {s.address && <p style={{ color: colors.textMuted, fontSize:"13px", margin:"4px 0" }}><strong>Dirección:</strong> {s.address}</p>}
                    <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
                      <button onClick={()=>{setEditingId(s.id);setEditForm(s);setViewingId(null);}} style={btn(colors.border)}>Editar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <strong style={{ color: colors.text }}>{s.tradeName||s.name}</strong>
                      {s.taxId && <div style={{ color: colors.textMuted, fontSize:"12px" }}>RIF: {s.taxId}</div>}
                      {s.city && <div style={{ color: colors.textMuted, fontSize:"12px" }}>{s.city}</div>}
                      {Number.isFinite(s.balance) && (s.balance as number) > 0.005 && (
                        <div style={{ color: colors.warning, fontSize:"12px", fontWeight: 600 }}>Debes: ${(s.balance as number).toFixed(2)}</div>
                      )}
                    </div>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={()=>setViewingId(s.id)} style={btn(colors.secondary)}>Ver</button>
                      <button onClick={()=>{setEditingId(s.id);setEditForm(s);}} style={btn(colors.border)}>Editar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NUEVA ORDEN */}
      <div style={section}>
        <div style={header} onClick={()=>setNewOrderOpen(!newOrderOpen)}>
          <h2 style={{ color: colors.text, margin: 0 }}>Nueva orden de compra</h2>
          <span style={{ color: colors.textMuted, fontSize: "20px" }}>{newOrderOpen?"▲":"▼"}</span>
        </div>
        {newOrderOpen && (
          <div style={body}>
            <div style={{ display:"flex", gap:"12px" }}>
              <div style={{ flex:1 }}><FormInput label="Fecha factura" type="date" value={purchaseDate} onChange={(e)=>setPurchaseDate(e.target.value)} /></div>
              <div style={{ flex:1 }}><FormInput label="N° factura proveedor" value={supplierInvoice} onChange={(e)=>setSupplierInvoice(e.target.value)} /></div>
            </div>
            <FormSelect label="Condición de pago" value={paymentTerm} onChange={(e)=>setPaymentTerm(e.target.value as "cash"|"credit")}>
              <option value="cash">Contado</option>
              <option value="credit">Crédito</option>
            </FormSelect>
            <FormSelect label="Proveedor" value={selectedSupplierId} onChange={(e)=>setSelectedSupplierId(e.target.value)}>
              <option value="">Selecciona un proveedor</option>
              {suppliers.map((s)=><option key={s.id} value={s.id}>{s.tradeName||s.name}</option>)}
            </FormSelect>

            {/* Tipo de ítem — 4 opciones */}
            <FormSelect label="¿Qué estás comprando?" value={itemKind} onChange={(e)=>{setItemKind(e.target.value as ItemKind);setIsVatExempt(false);}}>
              <option value="rawMaterial">Materia prima</option>
              <option value="semiFinished">Semielaborado ya hecho (emergencia)</option>
              <option value="finished">Producto terminado (para revender)</option>
              <option value="other">Otro (servicio, insumo sin catálogo)</option>
            </FormSelect>

            {itemKind === "rawMaterial" && (
              <>
                <FormSelect label="Materia prima" value={selRawId} onChange={(e)=>setSelRawId(e.target.value)}>
                  <option value="">Selecciona</option>
                  {rawMaterials.map((m)=><option key={m.id} value={m.id}>{m.name} (stock: {m.currentStock} {m.unit})</option>)}
                </FormSelect>
                <FormSelect label="Unidad de captura" value={captureUnit} onChange={(e)=>setCaptureUnit(e.target.value as "g"|"kg")}>
                  <option value="kg">Kilogramos (Kg)</option>
                  <option value="g">Gramos (g)</option>
                </FormSelect>
              </>
            )}
            {itemKind === "semiFinished" && (
              <FormSelect label="Semielaborado" value={selSemiId} onChange={(e)=>setSelSemiId(e.target.value)}>
                <option value="">Selecciona</option>
                {semiFinished.map((r)=><option key={r.id} value={r.id}>{r.name} (stock: {r.currentStock??0} {r.unit})</option>)}
              </FormSelect>
            )}
            {itemKind === "finished" && (
              <FormSelect label="Producto terminado" value={selFinishedId} onChange={(e)=>setSelFinishedId(e.target.value)}>
                <option value="">Selecciona</option>
                {finishedRecipes.map((r)=><option key={r.id} value={r.id}>{r.name??r.code}</option>)}
              </FormSelect>
            )}
            {itemKind === "other" && (
              <div style={{ display:"flex", gap:"12px" }}>
                <div style={{ flex:2 }}><FormInput label="Nombre del ítem" value={customName} onChange={(e)=>setCustomName(e.target.value)} placeholder="ej. Bolsas zip, Servicio de diseño" /></div>
                <div style={{ flex:1 }}><FormInput label="Unidad" value={customUnit} onChange={(e)=>setCustomUnit(e.target.value)} /></div>
              </div>
            )}

            <div style={{ display:"flex", gap:"12px" }}>
              <div style={{ flex:1 }}>
                <FormInput
                  label={itemKind === "rawMaterial" ? `Cantidad (${captureUnit === "kg" ? "Kg" : "g"})` : "Cantidad"}
                  type="number" value={qty} onChange={(e)=>setQty(Number(e.target.value))} min={0}
                />
              </div>
              <div style={{ flex:1 }}>
                <FormInput
                  label={itemKind === "rawMaterial"
                    ? `Precio total pagado por ${qty} ${captureUnit === "kg" ? "Kg" : "g"} ($)`
                    : "Precio total pagado ($)"}
                  type="number" step="0.01" value={totalCost}
                  onChange={(e) => setTotalCost(Number(e.target.value))}
                  min={0}
                  placeholder="ej. 7.50 — total de la línea"
                />
                {qty > 0 && totalCost > 0 && (
                  <p style={{ color: colors.textMuted, fontSize: "12px", marginTop: "-10px", marginBottom: "8px" }}>
                    Precio por {captureUnit === "kg" && itemKind === "rawMaterial" ? "kg" : "unidad"}: ${ (totalCost / qty).toFixed(4) }
                    {!isVatExempt && ` → Total con IVA: ${ (totalCost * (1 + IVA_PCT/100)).toFixed(2) }`}
                  </p>
                )}
              </div>
            </div>

            <label style={{ display:"flex", alignItems:"center", gap:"8px", color: colors.text, fontSize:"13px", marginBottom:"16px", cursor:"pointer" }}>
              <input type="checkbox" checked={isVatExempt} onChange={(e)=>setIsVatExempt(e.target.checked)} />
              Este ítem está exento de IVA
            </label>

            <FormButton type="button" variant="secondary" onClick={handleAddItem}>Agregar ítem a la orden</FormButton>

            {draftItems.length > 0 && (
              <div style={{ marginTop:"16px" }}>
                <ul style={{ color: colors.text, fontSize:"13px", paddingLeft:"18px" }}>
                  {draftItems.map((item, idx)=>(
                    <li key={idx} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                      <span>{itemLabel(item)} — {item.quantity} {item.customItemUnit ?? (itemKind==="rawMaterial"?"g":"uds")} · Total: ${(item.quantity * item.unitCost).toFixed(2)}
                      {item.isVatExempt ? <span style={{ color: colors.textMuted }}> (exento)</span> : <span style={{ color: colors.warning }}> (+{IVA_PCT}% IVA)</span>}
                      </span>
                      <button type="button" onClick={()=>setDraftItems(draftItems.filter((_,i)=>i!==idx))} style={{ background:"transparent", border:`1px solid ${colors.danger}`, color:colors.danger, borderRadius:"6px", padding:"1px 8px", fontSize:"11px", cursor:"pointer", flexShrink:0 }}>✕</button>
                    </li>
                  ))}
                </ul>
                <div style={{ background: colors.card, borderRadius:"10px", padding:"12px", marginTop:"8px", fontSize:"13px" }}>
                  {draftExempt > 0 && <div style={{ color: colors.textMuted }}>Exento: ${draftExempt.toFixed(2)}</div>}
                  <div style={{ color: colors.text }}>Gravado (sin IVA): ${draftTaxable.toFixed(2)}</div>
                  <div style={{ color: colors.primary, fontWeight: 600, marginTop:"4px" }}>Total estimado (con IVA): ${draftTotal.toFixed(2)}</div>
                </div>
                <div style={{ marginTop:"12px" }}>
                  <FormButton type="button" onClick={handleCreateOrder}>Crear orden de compra</FormButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ÓRDENES */}
      <div style={section}>
        <div style={header} onClick={()=>setOrdersOpen(!ordersOpen)}>
          <h2 style={{ color: colors.text, margin: 0 }}>Órdenes ({orders.length})</h2>
          <span style={{ color: colors.textMuted, fontSize: "20px" }}>{ordersOpen?"▲":"▼"}</span>
        </div>
        {ordersOpen && (
          <div style={body}>
            {orders.length > 1 && (
              <div style={{ marginBottom:"12px" }}>
                <FormButton type="button" variant="secondary" onClick={()=>setOrdersNewestFirst(!ordersNewestFirst)}>
                  {ordersNewestFirst?"Ver más antiguas primero":"Ver más recientes primero"}
                </FormButton>
              </div>
            )}
            {orders.length === 0 && <p style={{ color: colors.textMuted }}>No hay órdenes todavía.</p>}
            {[...orders].sort((a,b)=>ordersNewestFirst?b.createdAt.localeCompare(a.createdAt):a.createdAt.localeCompare(b.createdAt)).map((order)=>{
              const exempt = order.items.filter((i)=>i.isVatExempt??false).reduce((s,i)=>s+i.quantity*i.unitCost,0);
              const taxable = order.items.filter((i)=>!(i.isVatExempt??false)).reduce((s,i)=>s+i.quantity*i.unitCost,0);
              const total = exempt + taxable * (1 + IVA_PCT/100);
              return (
                <div key={order.id} style={{ background: colors.card, borderRadius:"12px", padding:"16px", marginBottom:"12px", opacity: order.status==="voided"?0.5:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <strong style={{ color: colors.text, display:"block" }}>{supplierName(order.supplierId)}</strong>
                      <div style={{ fontSize:"12px", color: colors.textMuted, marginTop:"2px" }}>
                        {new Date(order.purchaseDate??order.createdAt).toLocaleDateString()} — {order.paymentTerm==="credit"?"Crédito":"Contado"}
                        <span style={{ marginLeft:"8px", color: order.status==="received"?colors.primary:order.status==="voided"?colors.danger:colors.warning }}>
                          {order.status==="received"?"✅ Recibida":order.status==="voided"?"⚠️ ANULADA":"⏳ Pendiente"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"8px" }}>
                      {order.status==="ordered" && <FormButton type="button" onClick={()=>handleReceive(order.id)}>Recibir</FormButton>}
                      {order.status!=="voided" && <button type="button" onClick={()=>handleVoidOrder(order.id)} style={btn(colors.danger)}>Anular</button>}
                      <Link to={`/orders#order-${order.id}`} style={{ ...btn(colors.secondary), textDecoration:"none", whiteSpace:"nowrap" }}>Ver</Link>
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:"12px" }}>
                    <ul style={{ color: colors.textMuted, fontSize:"13px", margin:0, paddingLeft:"18px" }}>
                      {order.items.map((item,idx)=>(
                        <li key={idx}>{itemLabel(item)} — {item.quantity} × ${item.unitCost.toFixed(4)}{item.isVatExempt?" (exento)":""}</li>
                      ))}
                    </ul>
                    <div style={{ textAlign:"right", flexShrink:0, marginLeft:"16px" }}>
                      {order.supplierInvoiceNumber && <div style={{ color: colors.text, fontSize:"13px" }}>Factura N° {order.supplierInvoiceNumber}</div>}
                      <div style={{ color: colors.primary, fontSize:"13px", marginTop:"2px" }}><strong>Total: ${total.toFixed(2)}</strong></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}