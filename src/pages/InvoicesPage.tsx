import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import * as invoiceService from "../services/invoiceService";
import * as configService from "../services/configService";
import type { Company } from "../models/Company";
import type { Invoice } from "../models/Invoice";
import { colors } from "../theme/colors";

/**
 * Página: Facturación — Ruta: /invoices — BP-033: invoiceService ahora
 * es Firestore (async).
 */
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([invoiceService.getInvoices(), configService.getCompany()]).then(([invs, comp]) => {
      setInvoices([...invs].sort((a, b) => b.number.localeCompare(a.number)));
      setCompany(comp);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
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
      try {
        await nav.share({ files: [file], title: `Factura ${invoiceNumber}` });
      } catch {
        // el usuario cerró el panel de compartir
      }
    } else {
      alert("Tu dispositivo no soporta compartir directo — usa el botón Descargar y adjúntala manualmente.");
    }
  }

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ color: colors.text }}>Facturación</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        Cada venta confirmada genera aquí su factura, numerada en secuencia.
      </p>

      {loading && <p style={{ color: colors.textMuted }}>Cargando facturas...</p>}
      {!loading && invoices.length === 0 && <p style={{ color: colors.textMuted }}>Todavía no hay facturas.</p>}

      {invoices.map((inv) => (
        <div key={inv.id} id={`invoice-${inv.saleId}`} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${colors.border}`, paddingBottom: "16px", marginBottom: "16px" }}>
            <div>
              {company ? (
                <>
                  <p style={{ color: colors.text, fontWeight: 700, fontSize: "17px", margin: "0 0 4px" }}>
                    {company.legalName}
                  </p>
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
                  ⚠️ Completa los datos de tu empresa en /settings para que aparezcan aquí.
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

          <p style={{ color: colors.text, margin: "4px 0" }}>
            <strong>Nombre o Razón Social:</strong> {inv.customerName}
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

          <table style={{ width: "100%", marginTop: "16px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ textAlign: "left", color: colors.textMuted, padding: "6px 0" }}>Descripción</th>
                <th style={{ textAlign: "right", color: colors.textMuted, padding: "6px 0" }}>Cant.</th>
                <th style={{ textAlign: "right", color: colors.textMuted, padding: "6px 0" }}>P. Unit.</th>
                <th style={{ textAlign: "right", color: colors.textMuted, padding: "6px 0" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((line, idx) => (
                <tr key={idx}>
                  <td style={{ color: colors.text, padding: "4px 0" }}>{line.description}</td>
                  <td style={{ color: colors.text, textAlign: "right" }}>{line.quantity}</td>
                  <td style={{ color: colors.text, textAlign: "right" }}>${line.unitPrice.toFixed(2)}</td>
                  <td style={{ color: colors.text, textAlign: "right" }}>${line.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "16px", textAlign: "right" }}>
            <p style={{ color: colors.textMuted, margin: "2px 0" }}>Base Imponible: ${inv.baseImponible.toFixed(2)}</p>
            <p style={{ color: colors.textMuted, margin: "2px 0" }}>IVA ({inv.ivaPercentage}%): ${inv.ivaAmount.toFixed(2)}</p>
            <p style={{ color: colors.textMuted, margin: "2px 0" }}>Total factura: ${inv.total.toFixed(2)}</p>
            {(inv.retentionFraction ?? 0) > 0 && (
              <p style={{ color: colors.warning, margin: "2px 0" }}>
                Retenido por el cliente ({((inv.retentionFraction ?? 0) * 100).toFixed(0)}% del IVA): -${(inv.retainedAmount ?? 0).toFixed(2)}
              </p>
            )}
            <p style={{ color: colors.primary, fontWeight: 700, fontSize: "16px", margin: "6px 0" }}>
              A cobrar: ${(inv.netAmountDue ?? inv.total).toFixed(2)}
            </p>
          </div>

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