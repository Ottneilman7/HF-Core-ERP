import { useState, useEffect, type FormEvent, type CSSProperties } from "react";
import { useConfig } from "../contexts/ConfigContext";
import * as configService from "../services/configService";
import * as pricingService from "../services/pricingService";
import type { Company } from "../models/Company";
import type { TaxRate } from "../models/TaxConfig";
import type { CostingSettings, CustomFixedCost, FixedCostAllocationMethod, RoiPaybackMonths } from "../models/BusinessParameters";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";
import { Link } from "react-router-dom";

const PAYBACK_MONTHS_OPTIONS: RoiPaybackMonths[] = [6, 12, 18, 24, 30, 36, 48, 60];

const DEFAULT_COSTING_SETTINGS: CostingSettings = {
  roi: { equipmentAmount: 0, toolsAmount: 0, paybackMonths: 24 },
  cif: { laborCost: 0, servicesCost: 0, rentCost: 0, otherCosts: [] },
  marketing: { monthlyAmount: 0 },
  allocationMethod: "direct_cost_proration",
};

/**
 * Página: Configuración del negocio (Flujo 1)
 * Ruta: /settings
 *
 * BP-048: fichas desplegables (mismo patrón que /purchases).
 * Contenido sin cambios — solo la presentación visual se actualiza.
 */
export default function ConfigPage() {
  const { company, parameters, taxConfig, loading, refresh } = useConfig();

  const [companyOpen, setCompanyOpen] = useState(true);
  const [paramsOpen, setParamsOpen] = useState(false);
  const [taxesOpen, setTaxesOpen] = useState(false);
  const [costingOpen, setCostingOpen] = useState(false);

  const [companyForm, setCompanyForm] = useState<Partial<Company>>({
    legalName: "", tradeName: "", taxId: "", country: "",
  });
  const [baseCurrency, setBaseCurrency] = useState(parameters.baseCurrency);
  const [defaultMargin, setDefaultMargin] = useState(parameters.defaultMarginPercentage);
  const [taxes, setTaxes] = useState<TaxRate[]>(taxConfig.taxes);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxPercentage, setNewTaxPercentage] = useState<number>(0);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --- Costeo y Precios (BP-XXX) ---
  const [equipmentAmount, setEquipmentAmount] = useState(0);
  const [toolsAmount, setToolsAmount] = useState(0);
  const [paybackMonths, setPaybackMonths] = useState<RoiPaybackMonths>(24);
  const [laborCost, setLaborCost] = useState(0);
  const [servicesCost, setServicesCost] = useState(0);
  const [rentCost, setRentCost] = useState(0);
  const [otherCosts, setOtherCosts] = useState<CustomFixedCost[]>([]);
  const [newOtherCostLabel, setNewOtherCostLabel] = useState("");
  const [newOtherCostAmount, setNewOtherCostAmount] = useState(0);
  const [marketingAmount, setMarketingAmount] = useState(0);
  const [allocationMethod, setAllocationMethod] = useState<FixedCostAllocationMethod>("direct_cost_proration");
  const [totalOperativeHours, setTotalOperativeHours] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCompanyForm(company ?? { legalName: "", tradeName: "", taxId: "", country: "" });
      setBaseCurrency(parameters.baseCurrency);
      setDefaultMargin(parameters.defaultMarginPercentage);
      setTaxes(taxConfig.taxes);

      const costing = parameters.costingSettings ?? DEFAULT_COSTING_SETTINGS;
      setEquipmentAmount(costing.roi.equipmentAmount);
      setToolsAmount(costing.roi.toolsAmount);
      setPaybackMonths(costing.roi.paybackMonths);
      setLaborCost(costing.cif.laborCost ?? 0);
      setServicesCost(costing.cif.servicesCost ?? 0);
      setRentCost(costing.cif.rentCost ?? 0);
      setOtherCosts(costing.cif.otherCosts ?? []);
      setMarketingAmount(costing.marketing.monthlyAmount ?? 0);
      setAllocationMethod(costing.allocationMethod);
      setTotalOperativeHours(costing.totalOperativeHoursMonthly ?? 0);
    }
  }, [loading, company, parameters, taxConfig]);

  if (loading) {
    return <p style={{ color: colors.textMuted, padding: "24px" }}>Cargando configuración...</p>;
  }

  async function handleSaveCompany(e: FormEvent) {
    e.preventDefault();
    try {
      setSaveError(null);
      const toSave: Company = {
        id: company?.id ?? crypto.randomUUID(),
        legalName: companyForm.legalName ?? "",
        tradeName: companyForm.tradeName ?? "",
        taxId: companyForm.taxId ?? "",
        country: companyForm.country ?? "",
        address: companyForm.address,
        phone: companyForm.phone,
        email: companyForm.email,
        createdAt: company?.createdAt ?? new Date().toISOString(),
      };
      await configService.saveCompany(toSave);
      await refresh();
      setSavedMessage("Datos de la empresa guardados.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  }

  async function handleSaveParameters(e: FormEvent) {
    e.preventDefault();
    await configService.saveParameters({
      ...parameters,
      baseCurrency,
      defaultMarginPercentage: defaultMargin,
      updatedAt: new Date().toISOString(),
    });
    await refresh();
    setSavedMessage("Parámetros guardados.");
  }

  async function handleAddTax() {
    if (!newTaxName.trim()) return;
    const tax: TaxRate = {
      id: crypto.randomUUID(),
      name: newTaxName,
      percentage: newTaxPercentage,
      isDefault: taxes.length === 0,
    };
    const updated = [...taxes, tax];
    setTaxes(updated);
    await configService.saveTaxConfig({ ...taxConfig, taxes: updated, updatedAt: new Date().toISOString() });
    await refresh();
    setNewTaxName("");
    setNewTaxPercentage(0);
  }

  async function handleRemoveTax(id: string) {
    const updated = taxes.filter((t) => t.id !== id);
    setTaxes(updated);
    await configService.saveTaxConfig({ ...taxConfig, taxes: updated, updatedAt: new Date().toISOString() });
    await refresh();
  }

  function handleAddOtherCost() {
    if (!newOtherCostLabel.trim()) return;
    setOtherCosts([...otherCosts, { id: crypto.randomUUID(), label: newOtherCostLabel, monthlyAmount: newOtherCostAmount }]);
    setNewOtherCostLabel("");
    setNewOtherCostAmount(0);
  }

  function handleRemoveOtherCost(id: string) {
    setOtherCosts(otherCosts.filter((c) => c.id !== id));
  }

  async function handleSaveCosting(e: FormEvent) {
    e.preventDefault();
    try {
      setSaveError(null);
      const costingSettings: CostingSettings = {
        roi: { equipmentAmount, toolsAmount, paybackMonths },
        cif: { laborCost, servicesCost, rentCost, otherCosts },
        marketing: { monthlyAmount: marketingAmount },
        allocationMethod,
        totalOperativeHoursMonthly: allocationMethod === "abc_time_based" ? totalOperativeHours : undefined,
      };
      await configService.saveParameters({ ...parameters, costingSettings, updatedAt: new Date().toISOString() });
      await refresh();
      setSavedMessage("Configuración de Costeo y Precios guardada.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  }

  // Vista previa en vivo — se recalcula en cada render, es una función pura y barata
  const fixedCostsPreview = pricingService.calculateFixedCosts({
    roi: { equipmentAmount, toolsAmount, paybackMonths },
    cif: { laborCost, servicesCost, rentCost, otherCosts },
    marketing: { monthlyAmount: marketingAmount },
    allocationMethod,
    totalOperativeHoursMonthly: totalOperativeHours,
  });

  const cardStyle: CSSProperties = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    marginBottom: "16px",
    overflow: "hidden",
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    cursor: "pointer",
    userSelect: "none",
  };

  const bodyStyle: CSSProperties = {
    padding: "0 24px 24px",
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ color: colors.text }}>Configuración del negocio</h1>
      <p style={{ color: colors.textMuted, marginBottom: "8px" }}>
        La base de todo lo demás: precios, facturas y reportes usan estos datos.
      </p>
      <Link to="/settings/recipes" style={{ color: colors.secondary, fontSize: "14px", display: "block", marginBottom: "24px" }}>
        🧪 Gestionar Recetas de Productos →
      </Link>

      {savedMessage && (
        <div style={{ background: `${colors.primary}22`, border: `1px solid ${colors.primary}`, color: colors.primary, borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "14px" }}>
          {savedMessage}
        </div>
      )}
      {saveError && (
        <div style={{ background: `${colors.danger}22`, border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "14px" }}>
          ⚠️ {saveError}
        </div>
      )}

      {/* EMPRESA */}
      <div style={cardStyle}>
        <div style={headerStyle} onClick={() => setCompanyOpen(!companyOpen)}>
          <h2 style={{ color: colors.text, margin: 0 }}>🏢 Empresa</h2>
          <span style={{ color: colors.textMuted, fontSize: "20px" }}>{companyOpen ? "▲" : "▼"}</span>
        </div>
        {companyOpen && (
          <div style={bodyStyle}>
            <form onSubmit={handleSaveCompany}>
              <FormInput label="Razón social" value={companyForm.legalName ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, legalName: e.target.value })} required />
              <FormInput label="Nombre comercial" value={companyForm.tradeName ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, tradeName: e.target.value })} />
              <FormInput label="RIF / NIT / Identificación fiscal" value={companyForm.taxId ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })} required />
              <FormInput label="País" value={companyForm.country ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })} required />
              <FormInput label="Dirección (opcional)" value={companyForm.address ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} />
              <FormInput label="Teléfono (opcional)" value={companyForm.phone ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
              <FormInput label="Correo electrónico (opcional)" value={companyForm.email ?? ""} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
              <FormButton type="submit">Guardar empresa</FormButton>
            </form>
          </div>
        )}
      </div>

      {/* PARÁMETROS */}
      <div style={cardStyle}>
        <div style={headerStyle} onClick={() => setParamsOpen(!paramsOpen)}>
          <h2 style={{ color: colors.text, margin: 0 }}>⚙️ Parámetros</h2>
          <span style={{ color: colors.textMuted, fontSize: "20px" }}>{paramsOpen ? "▲" : "▼"}</span>
        </div>
        {paramsOpen && (
          <div style={bodyStyle}>
            <form onSubmit={handleSaveParameters}>
              <FormInput label="Moneda base (ej. USD, VES)" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())} maxLength={3} />
              <FormInput label="Margen sugerido por defecto (%)" type="number" value={defaultMargin} onChange={(e) => setDefaultMargin(Number(e.target.value))} min={0} />
              <FormButton type="submit">Guardar parámetros</FormButton>
            </form>
          </div>
        )}
      </div>

      {/* IMPUESTOS */}
      <div style={cardStyle}>
        <div style={headerStyle} onClick={() => setTaxesOpen(!taxesOpen)}>
          <h2 style={{ color: colors.text, margin: 0 }}>🧾 Impuestos</h2>
          <span style={{ color: colors.textMuted, fontSize: "20px" }}>{taxesOpen ? "▲" : "▼"}</span>
        </div>
        {taxesOpen && (
          <div style={bodyStyle}>
            {taxes.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "16px" }}>
                {taxes.map((t) => (
                  <li key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: colors.card, borderRadius: "10px", marginBottom: "8px", color: colors.text }}>
                    <span>{t.name} — {t.percentage}%{t.isDefault ? " (por defecto)" : ""}</span>
                    <button type="button" onClick={() => handleRemoveTax(t.id)} style={{ background: "transparent", border: "none", color: colors.danger, cursor: "pointer", fontSize: "13px" }}>
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <div style={{ flex: 2 }}>
                <FormInput label="Nombre" placeholder="ej. IVA" value={newTaxName} onChange={(e) => setNewTaxName(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <FormInput label="%" type="number" value={newTaxPercentage} onChange={(e) => setNewTaxPercentage(Number(e.target.value))} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <FormButton type="button" variant="secondary" onClick={handleAddTax}>Agregar</FormButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COSTEO Y PRECIOS */}
      <div style={cardStyle}>
        <div style={headerStyle} onClick={() => setCostingOpen(!costingOpen)}>
          <h2 style={{ color: colors.text, margin: 0 }}>💰 Costeo y Precios</h2>
          <span style={{ color: colors.textMuted, fontSize: "20px" }}>{costingOpen ? "▲" : "▼"}</span>
        </div>
        {costingOpen && (
          <div style={bodyStyle}>
            <p style={{ color: colors.textMuted, fontSize: "13px", marginTop: 0, marginBottom: "20px" }}>
              Estos datos son la base para calcular el costo real y el precio de venta de cada producto,
              en la ficha de cada receta. Todos los campos son mensuales.
            </p>

            <form onSubmit={handleSaveCosting}>
              <h3 style={{ color: colors.text, fontSize: "15px", marginBottom: "12px" }}>Retorno de inversión (ROI)</h3>
              <FormInput label="Monto invertido en equipos" type="number" min={0} value={equipmentAmount} onChange={(e) => setEquipmentAmount(Number(e.target.value))} />
              <FormInput label="Monto invertido en herramientas/accesorios" type="number" min={0} value={toolsAmount} onChange={(e) => setToolsAmount(Number(e.target.value))} />
              <FormSelect label="Plazo de retorno deseado" value={paybackMonths} onChange={(e) => setPaybackMonths(Number(e.target.value) as RoiPaybackMonths)}>
                {PAYBACK_MONTHS_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m} meses</option>
                ))}
              </FormSelect>

              <h3 style={{ color: colors.text, fontSize: "15px", marginTop: "24px", marginBottom: "12px" }}>
                Costos Indirectos de Fabricación (CIF) y Mano de Obra
              </h3>
              <p style={{ color: colors.textMuted, fontSize: "12px", marginTop: "-8px", marginBottom: "12px" }}>
                Llena solo lo que aplique a tu negocio — deja en 0 lo que no pagues.
              </p>
              <FormInput label="Mano de obra" type="number" min={0} value={laborCost} onChange={(e) => setLaborCost(Number(e.target.value))} />
              <FormInput label="Servicios (luz, agua, gas, etc.)" type="number" min={0} value={servicesCost} onChange={(e) => setServicesCost(Number(e.target.value))} />
              <FormInput label="Alquiler / pago local" type="number" min={0} value={rentCost} onChange={(e) => setRentCost(Number(e.target.value))} />

              {otherCosts.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, marginBottom: "12px" }}>
                  {otherCosts.map((c) => (
                    <li key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: colors.card, borderRadius: "10px", marginBottom: "8px", color: colors.text }}>
                      <span>{c.label} — ${c.monthlyAmount.toFixed(2)}/mes</span>
                      <button type="button" onClick={() => handleRemoveOtherCost(c.id)} style={{ background: "transparent", border: "none", color: colors.danger, cursor: "pointer", fontSize: "13px" }}>
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", marginBottom: "20px" }}>
                <div style={{ flex: 2 }}>
                  <FormInput label="Otro costo fijo (ej. Internet, Seguro)" placeholder="Nombre del costo" value={newOtherCostLabel} onChange={(e) => setNewOtherCostLabel(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <FormInput label="Monto/mes" type="number" min={0} value={newOtherCostAmount} onChange={(e) => setNewOtherCostAmount(Number(e.target.value))} />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <FormButton type="button" variant="secondary" onClick={handleAddOtherCost}>Agregar</FormButton>
                </div>
              </div>

              <h3 style={{ color: colors.text, fontSize: "15px", marginBottom: "12px" }}>Marketing y publicidad</h3>
              <FormInput label="Monto mensual (muestras, promociones, etc.)" type="number" min={0} value={marketingAmount} onChange={(e) => setMarketingAmount(Number(e.target.value))} />

              <h3 style={{ color: colors.text, fontSize: "15px", marginTop: "24px", marginBottom: "12px" }}>Método de reparto de costos fijos entre productos</h3>
              <FormSelect label="Método" value={allocationMethod} onChange={(e) => setAllocationMethod(e.target.value as FixedCostAllocationMethod)}>
                <option value="direct_cost_proration">Por costo de materia prima (recomendado)</option>
                <option value="abc_time_based">Por tiempo de manufactura (casos especiales)</option>
              </FormSelect>
              {allocationMethod === "abc_time_based" && (
                <FormInput
                  label="Horas operativas totales al mes (horas-hombre u horas-máquina)"
                  type="number" min={0} value={totalOperativeHours}
                  onChange={(e) => setTotalOperativeHours(Number(e.target.value))}
                />
              )}

              {/* Vista previa en vivo */}
              <div style={{ background: colors.card, borderRadius: "12px", padding: "16px", margin: "20px 0", border: `1px solid ${colors.border}` }}>
                <p style={{ color: colors.textMuted, fontSize: "12px", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Costos fijos mensuales totales
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", color: colors.textMuted, fontSize: "13px", marginBottom: "4px" }}>
                  <span>Cuota ROI</span><span>${fixedCostsPreview.roiMonthly.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: colors.textMuted, fontSize: "13px", marginBottom: "4px" }}>
                  <span>CIF + Mano de obra</span><span>${fixedCostsPreview.cifMonthly.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: colors.textMuted, fontSize: "13px", marginBottom: "8px" }}>
                  <span>Marketing</span><span>${fixedCostsPreview.marketingMonthly.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: colors.text, fontSize: "16px", fontWeight: 700, paddingTop: "8px", borderTop: `1px solid ${colors.border}` }}>
                  <span>Total</span><span>${fixedCostsPreview.totalFixedCosts.toFixed(2)}</span>
                </div>
              </div>

              <FormButton type="submit">Guardar Costeo y Precios</FormButton>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}