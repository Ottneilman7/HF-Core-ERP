import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import * as supplierPaymentService from "../services/supplierPaymentService";
import * as purchaseService from "../services/purchaseService";
import type { Supplier } from "../models/Supplier";
import type { SupplierPayment, PaymentMethod } from "../models/SupplierPayment";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";

/**
 * Página: Cuentas por Pagar a Proveedores (BP-XXX) — Ruta: /purchases/payments
 * Espejo de FinancePage.tsx (Cobranza) + PaymentsPage.tsx (detalle/edición),
 * combinados en una sola pantalla para el lado de compras.
 */

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo", transfer: "Transferencia", mobile_payment: "Pago móvil",
  check: "Cheque", card: "Tarjeta", crypto: "Criptomoneda",
};

function CollapsibleSection({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", marginBottom: "20px", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: colors.secondary, fontSize: "18px", fontWeight: 700 }}>{title}</span>
        <span style={{ color: colors.textMuted, fontSize: "20px" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ padding: "0 24px 24px" }}>{children}</div>}
    </div>
  );
}

export default function SupplierPaymentsPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [referenceNumber, setReferenceNumber] = useState("");
  const [originInstitution, setOriginInstitution] = useState("");
  const [destinationInstitution, setDestinationInstitution] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SupplierPayment>>({});
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, p] = await Promise.all([purchaseService.getSuppliers(), supplierPaymentService.getPayments()]);
    setSuppliers(s);
    setPayments([...p].sort((a, b) => new Date(b.paymentDate ?? b.createdAt).getTime() - new Date(a.paymentDate ?? a.createdAt).getTime()));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const creditors = suppliers.filter((s) => Number.isFinite(s.balance) && (s.balance as number) > 0.005);

  function supplierName(id: string): string {
    return suppliers.find((s) => s.id === id)?.name ?? id;
  }

  async function handleRegisterPayment() {
    setError(null);
    if (!selectedSupplierId) { setError("Selecciona un proveedor antes de registrar el pago."); return; }
    setSubmitting(true);
    try {
      await supplierPaymentService.registerPayment({
        supplierId: selectedSupplierId, amount, method,
        paymentDate: new Date(paymentDate).toISOString(),
        referenceNumber: referenceNumber || undefined,
        originInstitution: originInstitution || undefined,
        destinationInstitution: destinationInstitution || undefined,
        note: note || undefined,
      });
      setAmount(0); setPaymentDate(new Date().toISOString().slice(0, 16));
      setReferenceNumber(""); setOriginInstitution(""); setDestinationInstitution(""); setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(p: SupplierPayment) {
    setEditingId(p.id);
    setEditForm({ ...p, paymentDate: (p.paymentDate ?? p.createdAt).slice(0, 16) });
  }

  async function saveEdit() {
    if (!editingId) return;
    setEditError(null);
    try {
      await supplierPaymentService.updatePayment(editingId, {
        method: editForm.method,
        paymentDate: editForm.paymentDate ? new Date(editForm.paymentDate).toISOString() : undefined,
        referenceNumber: editForm.referenceNumber,
        originInstitution: editForm.originInstitution,
        destinationInstitution: editForm.destinationInstitution,
        note: editForm.note,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "No se pudo guardar el cambio.");
    }
  }

  if (loading) return <p style={{ color: colors.textMuted, padding: "24px" }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: "680px" }}>
      <h1 style={{ color: colors.text }}>Cuentas por Pagar</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        Deuda con proveedores por compras a crédito, registro de pagos y saldos actualizados.{" "}
        <Link to="/purchases" style={{ color: colors.secondary }}>← Volver a Compras</Link>
      </p>

      <CollapsibleSection title={`Deuda pendiente (${creditors.length})`} defaultOpen>
        {creditors.length === 0 && <p style={{ color: colors.textMuted }}>No le debes a ningún proveedor ahora mismo. 🎉</p>}
        {creditors.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {creditors.map((s) => (
              <li key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: colors.card, borderRadius: "10px", marginBottom: "8px", color: colors.text }}>
                <span>{s.name}</span>
                <span style={{ color: colors.warning, fontWeight: 600 }}>${(s.balance as number).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Registrar pago a proveedor" defaultOpen>
        <FormSelect label="Proveedor" value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)}>
          <option value="">Selecciona un proveedor</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name} (debes ${(Number.isFinite(s.balance) ? (s.balance as number) : 0).toFixed(2)})</option>
          ))}
        </FormSelect>
        <FormInput label="Monto pagado ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={0} />
        <FormInput label="Fecha y hora del pago" type="datetime-local" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        <FormSelect label="Medio de pago" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </FormSelect>
        <FormInput label="N° de referencia/transacción" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
        <FormInput label="Institución de origen (tu banco)" value={originInstitution} onChange={(e) => setOriginInstitution(e.target.value)} />
        <FormInput label="Institución de destino (banco del proveedor)" value={destinationInstitution} onChange={(e) => setDestinationInstitution(e.target.value)} />
        <FormInput label="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p style={{ color: colors.danger, fontSize: "13px" }}>⚠️ {error}</p>}
        <FormButton type="button" onClick={handleRegisterPayment} disabled={submitting}>{submitting ? "Registrando..." : "Registrar pago"}</FormButton>
      </CollapsibleSection>

      <CollapsibleSection title={`Historial de pagos (${payments.length})`}>
        {payments.length === 0 && <p style={{ color: colors.textMuted }}>Todavía no hay pagos a proveedores.</p>}
        {payments.map((p) => (
          <div key={p.id} style={{ background: colors.card, borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
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
                <p style={{ color: colors.textMuted, fontSize: "12px" }}>El monto (${(Number.isFinite(p.amount) ? p.amount : 0).toFixed(2)}) no se puede editar aquí — si está mal, avisa para revertirlo manualmente.</p>
                {editError && <p style={{ color: colors.danger, fontSize: "13px" }}>⚠️ {editError}</p>}
                <div style={{ display: "flex", gap: "8px" }}>
                  <FormButton type="button" onClick={saveEdit}>Guardar</FormButton>
                  <FormButton type="button" variant="secondary" onClick={() => setEditingId(null)}>Cancelar</FormButton>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <strong style={{ color: colors.primary }}>{supplierName(p.supplierId)}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: colors.text, fontWeight: 700 }}>${(Number.isFinite(p.amount) ? p.amount : 0).toFixed(2)}</span>
                    <button onClick={() => startEdit(p)} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>Editar</button>
                  </div>
                </div>
                <p style={{ color: colors.textMuted, fontSize: "12px", margin: "2px 0" }}>{new Date(p.paymentDate ?? p.createdAt).toLocaleString()} — {PAYMENT_METHOD_LABELS[p.method] ?? "Medio no especificado"}</p>
                {p.referenceNumber && <p style={{ color: colors.textMuted, fontSize: "12px", margin: "2px 0" }}>Ref: {p.referenceNumber}</p>}
                {p.note && <p style={{ color: colors.textMuted, fontSize: "12px", margin: "2px 0" }}>Nota: {p.note}</p>}
              </>
            )}
          </div>
        ))}
      </CollapsibleSection>
    </div>
  );
}