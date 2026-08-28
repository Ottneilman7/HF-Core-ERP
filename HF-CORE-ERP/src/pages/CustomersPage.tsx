import { useState, useEffect, useCallback } from "react";
import StatCard from "../components/dashboard/StatCard";
import * as customerBalanceService from "../services/customerBalanceService";
import type { Customer } from "../models/Customer";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

/**
 * BP-049: fix espacio entre razón social y denominación comercial.
 * Los nombres aparecían pegados — se agrega margin y se separan visualmente.
 */

const LETTER_GROUPS = ["A-D","E-H","I-L","M-P","Q-T","U-Z"];
function groupFor(letter: string): string {
  const u = (letter||"A").toUpperCase();
  if (u<="D") return "A-D"; if (u<="H") return "E-H";
  if (u<="L") return "I-L"; if (u<="P") return "M-P";
  if (u<="T") return "Q-T"; return "U-Z";
}

const card = {
  background: colors.surface, border: `1px solid ${colors.border}`,
  borderRadius: "16px", padding: "20px", marginBottom: "16px",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [activeGroup, setActiveGroup] = useState<string|null>(null);

  const loadCustomers = useCallback(async () => {
    const list = await customerBalanceService.getEffectiveCustomers();
    setCustomers([...list].sort((a,b)=>a.businessName.localeCompare(b.businessName)));
    setLoading(false);
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const activeCustomers = customers.filter((c)=>c.active).length;
  const priorityCustomers = customers.filter((c)=>c.priority==="HIGH").length;
  const totalBalance = customers.reduce((sum,c)=>sum+(Number.isFinite(c.balance)?c.balance:0),0);
  const groupsPresent = new Set(customers.map((c)=>groupFor(c.businessName[0]))) as Set<string>;
  const filteredCustomers = activeGroup ? customers.filter((c)=>groupFor(c.businessName[0])===activeGroup) : customers;

  async function saveEdit() {
    if (!editingId) return;
    await customerBalanceService.updateCustomer(editingId, editForm);
    setEditingId(null);
    await loadCustomers();
  }

  return (
    <>
      <h1 style={{ color: colors.primary, fontSize: typography.title, marginBottom: "24px" }}>
        Clientes
      </h1>

      {loading && <p style={{ color: colors.textMuted }}>Cargando clientes...</p>}

      {!loading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <StatCard title="Clientes" value={customers.length} />
            <StatCard title="Activos" value={activeCustomers} />
            <StatCard title="Prioritarios" value={priorityCustomers} />
            <StatCard title="Saldo total por cobrar" value={`$${totalBalance.toFixed(2)}`} />
          </div>

          {customers.length > 8 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"20px" }}>
              <button onClick={()=>setActiveGroup(null)} style={{ padding:"4px 12px", borderRadius:"999px", border:`1px solid ${colors.border}`, background: activeGroup===null?colors.primary:"transparent", color: activeGroup===null?"#fff":colors.text, fontSize:"12px", cursor:"pointer" }}>Todos</button>
              {LETTER_GROUPS.filter((g:string)=>groupsPresent.has(g)).map((g)=>(
                <button key={g} onClick={()=>setActiveGroup(g)} style={{ padding:"4px 12px", borderRadius:"999px", border:`1px solid ${colors.border}`, background: activeGroup===g?colors.primary:"transparent", color: activeGroup===g?"#fff":colors.text, fontSize:"12px", cursor:"pointer" }}>{g}</button>
              ))}
            </div>
          )}

          <div>
            {filteredCustomers.map((customer) => (
              <div key={customer.id} style={card}>
                {editingId === customer.id ? (
                  <div>
                    <FormInput label="Razón social" value={editForm.businessName??""} onChange={(e)=>setEditForm({...editForm,businessName:e.target.value})} />
                    <FormInput label="Denominación comercial" value={editForm.tradeName??""} onChange={(e)=>setEditForm({...editForm,tradeName:e.target.value})} />
                    <FormInput label="RIF/CI" value={editForm.taxId??""} onChange={(e)=>setEditForm({...editForm,taxId:e.target.value})} />
                    <FormSelect label="Agente de retención" value={editForm.retentionAgentType??"none"} onChange={(e)=>setEditForm({...editForm,retentionAgentType:e.target.value as Customer["retentionAgentType"]})}>
                      <option value="none">No agente de retención</option>
                      <option value="agent_75">Agente de retención 75%</option>
                      <option value="agent_100">Agente de retención 100%</option>
                    </FormSelect>
                    <FormInput label="Contacto" value={editForm.contactName??""} onChange={(e)=>setEditForm({...editForm,contactName:e.target.value})} />
                    <FormInput label="Teléfono" value={editForm.phone??""} onChange={(e)=>setEditForm({...editForm,phone:e.target.value})} />
                    <FormInput label="Ciudad" value={editForm.city??""} onChange={(e)=>setEditForm({...editForm,city:e.target.value})} />
                    <FormInput label="Dirección" value={editForm.address??""} onChange={(e)=>setEditForm({...editForm,address:e.target.value})} />
                    <FormInput label="Saldo (ajuste manual — solo para corregir errores)" type="number" step="0.01" value={Number.isFinite(editForm.balance)?editForm.balance:0} onChange={(e)=>setEditForm({...editForm,balance:Number(e.target.value)})} />
                    <div style={{ display:"flex", gap:"8px" }}>
                      <FormButton type="button" onClick={saveEdit}>Guardar</FormButton>
                      <FormButton type="button" variant="secondary" onClick={()=>setEditingId(null)}>Cancelar</FormButton>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      {/* BP-049: nombres separados con margen claro */}
                      <div style={{ fontWeight: 700, color: colors.text, fontSize: "16px", marginBottom: "2px" }}>
                        {customer.businessName}
                      </div>
                      {customer.tradeName && customer.tradeName !== customer.businessName && (
                        <div style={{ color: colors.textMuted, fontSize: "13px", marginBottom: "8px" }}>
                          {customer.tradeName}
                        </div>
                      )}
                      <div style={{ color: colors.textMuted, fontSize: "13px", lineHeight: "1.8" }}>
                        {customer.taxId && <div><strong>RIF/CI:</strong> {customer.taxId}</div>}
                        {customer.contactName && <div><strong>Contacto:</strong> {customer.contactName}</div>}
                        {customer.phone && <div><strong>Tel:</strong> <a href={`tel:${customer.phone}`} style={{ color: colors.secondary }}>{customer.phone}</a></div>}
                        {customer.city && <div><strong>Ciudad:</strong> {customer.city}</div>}
                        {customer.customerType && <div><strong>Tipo:</strong> {customer.customerType}</div>}
                        {customer.retentionAgentType && customer.retentionAgentType !== "none" && (
                          <div><strong>Ret. IVA:</strong> {customer.retentionAgentType === "agent_75" ? "75%" : "100%"}</div>
                        )}
                        <div style={{ marginTop: "4px" }}>
                          <strong>Saldo:</strong>{" "}
                          <span style={{ color: (Number.isFinite(customer.balance)?customer.balance:0)>0?colors.warning:colors.text }}>
                            ${(Number.isFinite(customer.balance)?customer.balance:0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={()=>{setEditingId(customer.id);setEditForm(customer);}} style={{ background:"transparent", border:`1px solid ${colors.border}`, color:colors.text, borderRadius:"8px", padding:"4px 10px", fontSize:"12px", cursor:"pointer", flexShrink:0, marginLeft:"12px" }}>
                      Editar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}