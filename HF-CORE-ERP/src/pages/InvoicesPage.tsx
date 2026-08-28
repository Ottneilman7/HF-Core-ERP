import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import * as invoiceService from "../services/invoiceService";
import * as configService from "../services/configService";
import type { Company } from "../models/Company";
import type { Invoice } from "../models/Invoice";
import { colors } from "../theme/colors";
import { FormButton } from "../components/FormButton";

/**
 * Página: Facturación — Ruta: /invoices
 *
 * BP-047: la factura ahora muestra desglose completo:
 *   - Monto exento (ítems sin IVA)
 *   - Base imponible (ítems gravados)
 *   - IVA calculado solo sobre gravados
 *   - Retención si aplica
 *   - Total a cobrar
 * Botón exportar listado en CSV para contador/administrador.
 *
 * Regla ADR-009: campos nuevos (exemptAmount, isVatExempt) tienen
 * respaldo ?? 0 / ?? false para facturas anteriores a BP-047.
 */
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([invoiceService.getInvoices(), configService.getCompany()]).then(
      ([invs, comp]) => {
        setInvoices([...invs].sort((a, b) => b.number.localeCompare(a.number)));
        setCompany(comp);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [loading]);

  async function getInvoiceImageBlob(saleId: string): Promise<Blob | null> {
    const el = document.getElementById(`invoice-${saleId}`);
    if (!el) return null;
    const canvas = await html2canvas(el, { backgroundColor: colors.surface, scale: 2 });
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95));
  }

  async function handleDownloadInvoice(saleId: string, invoiceNumber: string) {
    const blob = await getInvoiceImageBlob(saleId);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factura-${invoiceNumber}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShareInvoice(saleId: string, invoiceNumber: string) {
    const blob = await getInvoiceImageBlob(saleId);
    if (!blob) return;
    const file = new File([blob], `factura-${invoiceNumber}.jpg`, { type: "image/jpeg" });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: `Factura ${invoiceNumber}` }); } catch { /* cerró */ }
    } else {
      alert("Tu dispositivo no soporta compartir directo — usa Descargar y adjunta manualmente.");
    }
  }

  function handleExportCSV() {
    const rows = [
      ["N° Factura", "Fecha", "Cliente", "RIF/CI", "Exento", "Base Imponible", "IVA %", "IVA", "Total Factura", "Retención", "Total a Cobrar"].join(","),
      ...invoices.map((inv) =>
        [
          inv.number,
          new Date(inv.createdAt).toLocaleDateString("es-VE"),
          `"${inv.customerName}"`,
          inv.customerTaxId ?? "",
          (inv.exemptAmount ?? 0).toFixed(2),
          inv.baseImponible.toFixed(2),
          inv.ivaPercentage,
          inv.ivaAmount.toFixed(2),
          inv.total.toFixed(2),
          (inv.retainedAmount ?? 0).toFixed(2),
          (inv.netAmountDue ?? inv.total).toFixed(2),
        ].join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facturas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h1 style={{ color: colors.text, margin: 0 }}>Facturación</h1>
        <FormButton type="button" variant="secondary" onClick={handleExportCSV}>
          ⬇ Exportar CSV
        </FormButton>
      </div>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        Cada venta confirmada genera su factura numerada. Exporta el listado para tu contador.
      </p>

      {loading && <p style={{ color: colors.textMuted }}>Cargando facturas...</p>}
      {!loading && invoices.length === 0 && <p style={{ color: colors.textMuted }}>Todavía no hay facturas.</p>}

      {invoices.map((inv) => (
        <div
          key={inv.id}
          id={`invoice-${inv.saleId}`}
          style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "20px" }}
        >
          {/* Membrete */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${colors.border}`, paddingBottom: "16px", marginBottom: "16px" }}>
            <div>
              {company ? (
                <>
                  <p style={{ color: colors.text, fontWeight: 700, fontSize: "17px", margin: "0 0 4px" }}>{company.legalName}</p>
                  {company.tradeName && company.legalName !== company.tradeName && (
                    <p style={{ color: colors.textMuted, fontSize: "13px", margin: "2px 0" }}>{company.tradeName}</p>
                  )}
                  <p style={{ color: colors.textMuted, fontSize: "13px", margin: "2px 0" }}>RIF: {company.taxId}</p>
                  {company.address && <p style={{ color: colors.textMuted, fontSize: "13px", margin: "2px 0" }}>{company.address}</p>}
                  {company.phone && <p style={{ color: colors.textMuted, fontSize: "13px", margin: "2px 0" }}>Tel: {company.phone}</p>}
                  {company.email && <p style={{ color: colors.textMuted, fontSize: "13px", margin: "2px 0" }}>{company.email}</p>}
                </>
              ) : (
                <p style={{ color: colors.warning, fontSize: "13px" }}>
                  ⚠️ Completa los datos de tu empresa en /settings.
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <strong style={{ color: colors.primary, fontSize: "18px", display: "block" }}>
                Factura N° {inv.number}
              </strong>
              <span style={{ color: colors.textMuted, fontSize: "13px" }}>
                {new Date(inv.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Datos del cliente */}
          <p style={{ color: colors.text, margin: "4px 0" }}>
            <strong>Cliente:</strong> {inv.customerName}
          </p>
          {inv.customerTaxId && (
            <p style={{ color: colors.text, margin: "4px 0" }}>
              <strong>RIF/C.I.:</strong> {inv.customerTaxId}
            </p>
          )}
          {inv.customerAddress && (
            <p style={{ color: colors.text, margin: "4px 0" }}>
              <strong>Dirección:</strong> {inv.customerAddress}
            </p>
          )}

          {/* Tabla de ítems */}
          <table style={{ width: "100%", marginTop: "16px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ textAlign: "left", color: colors.textMuted, padding: "6px 0" }}>Descripción</th>
                <th style={{ textAlign: "right", color: colors.textMuted, padding: "6px 0" }}>Cant.</th>
                <th style={{ textAlign: "right", color: colors.textMuted, padding: "6px 0" }}>P. Unit.</th>
                <th style={{ textAlign: "right", color: colors.textMuted, padding: "6px 0" }}>Total</th>
                <th style={{ textAlign: "center", color: colors.textMuted, padding: "6px 0" }}>IVA</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((line, idx) => (
                <tr key={idx}>
                  <td style={{ color: colors.text, padding: "4px 0" }}>{line.description}</td>
                  <td style={{ color: colors.text, textAlign: "right" }}>{line.quantity}</td>
                  <td style={{ color: colors.text, textAlign: "right" }}>${line.unitPrice.toFixed(2)}</td>
                  <td style={{ color: colors.text, textAlign: "right" }}>${line.lineTotal.toFixed(2)}</td>
                  <td style={{ textAlign: "center", fontSize: "11px" }}>
                    {(line.isVatExempt ?? false)
                      ? <span style={{ color: colors.textMuted }}>Exento</span>
                      : <span style={{ color: colors.warning }}>Gravado</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div style={{ marginTop: "16px", textAlign: "right" }}>
            {(inv.exemptAmount ?? 0) > 0 && (
              <p style={{ color: colors.textMuted, margin: "2px 0" }}>
                Monto exento de IVA: ${(inv.exemptAmount ?? 0).toFixed(2)}
              </p>
            )}
            <p style={{ color: colors.textMuted, margin: "2px 0" }}>
              Base imponible: ${inv.baseImponible.toFixed(2)}
            </p>
            <p style={{ color: colors.textMuted, margin: "2px 0" }}>
              IVA ({inv.ivaPercentage}%): ${inv.ivaAmount.toFixed(2)}
            </p>
            <p style={{ color: colors.text, fontWeight: 600, margin: "4px 0" }}>
              Total factura: ${inv.total.toFixed(2)}
            </p>
            {(inv.retentionFraction ?? 0) > 0 && (
              <p style={{ color: colors.warning, margin: "2px 0" }}>
                Retención cliente ({((inv.retentionFraction ?? 0) * 100).toFixed(0)}% IVA): -${(inv.retainedAmount ?? 0).toFixed(2)}
              </p>
            )}
            <p style={{ color: colors.primary, fontWeight: 700, fontSize: "16px", margin: "6px 0" }}>
              A cobrar: ${(inv.netAmountDue ?? inv.total).toFixed(2)}
            </p>
          </div>

          {/* Botones */}
          <div style={{ textAlign: "right", marginTop: "12px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => handleDownloadInvoice(inv.saleId, inv.number)} style={{ background: colors.card, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" }}>
              ⬇️ Descargar
            </button>
            <button type="button" onClick={() => handleShareInvoice(inv.saleId, inv.number)} style={{ background: colors.secondary, color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" }}>
              📤 Compartir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}