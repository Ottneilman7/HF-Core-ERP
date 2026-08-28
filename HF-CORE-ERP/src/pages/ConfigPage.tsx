import { useState, useEffect, type FormEvent, type CSSProperties } from "react";
import { useConfig } from "../contexts/ConfigContext";
import * as configService from "../services/configService";
import type { Company } from "../models/Company";
import type { TaxRate } from "../models/TaxConfig";
import { FormInput } from "../components/FormInput";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";
import { Link } from "react-router-dom";

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

  useEffect(() => {
    if (!loading) {
      setCompanyForm(company ?? { legalName: "", tradeName: "", taxId: "", country: "" });
      setBaseCurrency(parameters.baseCurrency);
      setDefaultMargin(parameters.defaultMarginPercentage);
      setTaxes(taxConfig.taxes);
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
    </div>
  );
}