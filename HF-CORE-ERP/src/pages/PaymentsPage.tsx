import { useState, useEffect } from "react";
import * as paymentService from "../services/paymentService";
import * as customerBalanceService from "../services/customerBalanceService";
import type { Payment, PaymentMethod } from "../models/Payment";
import type { Customer } from "../models/Customer";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  mobile_payment: "Pago móvil",
  check: "Cheque",
  card: "Tarjeta",
  crypto: "Criptomoneda",
};

/**
 * Página: Detalle de Pagos — Ruta: /payments
 * Sin ítem en Sidebar a propósito — se accede desde "Ver" en /finance,
 * mismo patrón que /invoices desde /sales.
 */
export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Payment>>({});
  const [editError, setEditError] = useState<string | null>(null);

  async function refresh() {
    const p = await paymentService.getPayments();
    setPayments([...p].sort((a, b) => (b.paymentDate ?? b.createdAt).localeCompare(a.paymentDate ?? a.createdAt)));
  }

  function startEdit(p: Payment) {
    setEditingId(p.id);
    setEditForm({ ...p, paymentDate: (p.paymentDate ?? p.createdAt).slice(0, 16) });
  }

  async function saveEdit() {
    if (!editingId) return;
    setEditError(null);
    try {
      await paymentService.updatePayment(editingId, {
        method: editForm.method,
        paymentDate: editForm.paymentDate ? new Date(editForm.paymentDate).toISOString() : undefined,
        referenceNumber: editForm.referenceNumber,
        originInstitution: editForm.originInstitution,
        destinationInstitution: editForm.destinationInstitution,
        note: editForm.note,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "No se pudo guardar el cambio.");
    }
  }

  useEffect(() => {
    Promise.all([paymentService.getPayments(), customerBalanceService.getEffectiveCustomers()]).then(([p, c]) => {
      setPayments(
        [...p].sort(
          (a, b) => new Date(b.paymentDate ?? b.createdAt).getTime() - new Date(a.paymentDate ?? a.createdAt).getTime()
        )
      );
      setCustomers(c);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [loading]);

  function customerName(id: string): string {
    return customers.find((c) => c.id === id)?.businessName ?? id;
  }

  const isPdf = (url: string, fileName?: string) => fileName?.toLowerCase().endsWith(".pdf") || url.includes(".pdf");

  return (
    <div style={{ maxWidth: "680px" }}>
      <h1 style={{ color: colors.text }}>Pagos</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>Detalle completo de cada pago registrado.</p>

      {loading && <p style={{ color: colors.textMuted }}>Cargando...</p>}
      {!loading && payments.length === 0 && <p style={{ color: colors.textMuted }}>Todavía no hay pagos.</p>}

      {payments.map((p) => (
        <div key={p.id} id={`payment-${p.id}`} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
          {editingId === p.id ? (
            <div>
              <FormInput label="Fecha y hora del pago" type="datetime-local" value={editForm.paymentDate ?? ""} onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })} />
              <FormSelect label="Medio de pago" value={editForm.method ?? "cash"} onChange={(e) => setEditForm({ ...editForm, method: e.target.value as PaymentMethod })}>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </FormSelect>
              <FormInput label="N° de referencia" value={editForm.referenceNumber ?? ""} onChange={(e) => setEditForm({ ...editForm, referenceNumber: e.target.value })} />
              <FormInput label="Institución de origen" value={editForm.originInstitution ?? ""} onChange={(e) => setEditForm({ ...editForm, originInstitution: e.target.value })} />
              <FormInput label="Institución de destino" value={editForm.destinationInstitution ?? ""} onChange={(e) => setEditForm({ ...editForm, destinationInstitution: e.target.value })} />
              <FormInput label="Nota" value={editForm.note ?? ""} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
              <p style={{ color: colors.textMuted, fontSize: "12px" }}>El monto (${(Number.isFinite(p.amount) ? p.amount : 0).toFixed(2)}) no se puede editar aquí — anula y registra de nuevo si el monto está mal.</p>
              {editError && <p style={{ color: colors.danger, fontSize: "13px" }}>⚠️ {editError}</p>}
              <div style={{ display: "flex", gap: "8px" }}>
                <FormButton type="button" onClick={saveEdit}>Guardar</FormButton>
                <FormButton type="button" variant="secondary" onClick={() => setEditingId(null)}>Cancelar</FormButton>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <strong style={{ color: colors.primary, fontSize: "17px" }}>{customerName(p.customerId)}</strong>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: colors.text, fontWeight: 700 }}>${(Number.isFinite(p.amount) ? p.amount : 0).toFixed(2)}</span>
                  <button onClick={() => startEdit(p)} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                    Editar
                  </button>
                </div>
              </div>

              <p style={{ color: colors.text, margin: "4px 0" }}><strong>Fecha y hora del pago:</strong> {new Date(p.paymentDate ?? p.createdAt).toLocaleString()}</p>
              <p style={{ color: colors.textMuted, fontSize: "12px", margin: "4px 0" }}>Registrado en el sistema: {new Date(p.createdAt).toLocaleString()}</p>
              <p style={{ color: colors.text, margin: "4px 0" }}><strong>Medio de pago:</strong> {PAYMENT_METHOD_LABELS[p.method] ?? "Medio no especificado"}</p>
              {p.referenceNumber && <p style={{ color: colors.text, margin: "4px 0" }}><strong>N° de referencia:</strong> {p.referenceNumber}</p>}
              {p.originInstitution && <p style={{ color: colors.text, margin: "4px 0" }}><strong>Institución de origen:</strong> {p.originInstitution}</p>}
              {p.destinationInstitution && <p style={{ color: colors.text, margin: "4px 0" }}><strong>Institución de destino:</strong> {p.destinationInstitution}</p>}
              {p.note && <p style={{ color: colors.text, margin: "4px 0" }}><strong>Nota:</strong> {p.note}</p>}

              {p.proofUrl && (
                <div style={{ marginTop: "16px" }}>
                  <p style={{ color: colors.textMuted, fontSize: "13px", marginBottom: "8px" }}>Comprobante:</p>
                  {isPdf(p.proofUrl, p.proofFileName) ? (
                    <a href={p.proofUrl} target="_blank" rel="noreferrer" style={{ color: colors.secondary }}>
                      📄 Ver PDF ({p.proofFileName})
                    </a>
                  ) : (
                    <a href={p.proofUrl} target="_blank" rel="noreferrer">
                      <img src={p.proofUrl} alt="Comprobante de pago" style={{ maxWidth: "100%", borderRadius: "10px", border: `1px solid ${colors.border}` }} />
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}