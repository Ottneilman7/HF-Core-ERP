import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import * as paymentService from "../services/paymentService";
import * as customerBalanceService from "../services/customerBalanceService";
import type { Customer } from "../models/Customer";
import type { PaymentMethod } from "../models/Payment";
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

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", marginBottom: "20px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span style={{ color: colors.secondary, fontSize: "18px", fontWeight: 700 }}>{title}</span>
        <span style={{ color: colors.textMuted, fontSize: "20px" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ padding: "0 24px 24px" }}>{children}</div>}
    </div>
  );
}

export default function FinancePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Awaited<ReturnType<typeof paymentService.getPayments>>>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsNewestFirst, setPaymentsNewestFirst] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [referenceNumber, setReferenceNumber] = useState("");
  const [originInstitution, setOriginInstitution] = useState("");
  const [destinationInstitution, setDestinationInstitution] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const all = await customerBalanceService.getEffectiveCustomers();
    setCustomers(all.filter((c) => c.active));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCustomers();
    paymentService.getPayments().then(setPayments);
  }, [loadCustomers]);

  const debtors = customers.filter((c) => Number.isFinite(c.balance) && c.balance > 0.005);

  function customerName(id: string): string {
    return customers.find((c) => c.id === id)?.businessName ?? id;
  }

  async function handleRegisterPayment() {
    setError(null);
    if (!selectedCustomerId) {
      setError("Selecciona un cliente antes de registrar el pago.");
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.registerPayment({
        customerId: selectedCustomerId,
        amount,
        method,
        paymentDate: new Date(paymentDate).toISOString(),
        referenceNumber: referenceNumber || undefined,
        originInstitution: originInstitution || undefined,
        destinationInstitution: destinationInstitution || undefined,
        note: note || undefined,
      });
      setAmount(0);
      setPaymentDate(new Date().toISOString().slice(0, 16));
      setReferenceNumber("");
      setOriginInstitution("");
      setDestinationInstitution("");
      setNote("");
      setPayments(await paymentService.getPayments());
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: "680px" }}>
      <h1 style={{ color: colors.text }}>Cobranza</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>Cuentas por cobrar, registro de pagos y saldos actualizados.</p>

      {loading && <p style={{ color: colors.textMuted }}>Cargando...</p>}

      {!loading && (
        <>
          <CollapsibleSection title={`Cuentas pendientes (${debtors.length})`}>
            {debtors.length === 0 && <p style={{ color: colors.textMuted }}>Ningún cliente tiene saldo pendiente ahora mismo. 🎉</p>}
            {debtors.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {debtors.map((c) => (
                  <li key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: colors.card, borderRadius: "10px", marginBottom: "8px", color: colors.text }}>
                    <span>{c.businessName}</span>
                    <span style={{ color: colors.warning, fontWeight: 600 }}>${c.balance.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Registrar pago">
            <FormSelect label="Cliente" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
              <option value="">Selecciona un cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.businessName} (debe ${c.balance.toFixed(2)})</option>
              ))}
            </FormSelect>
            <FormInput label="Monto recibido ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={0} />
            <FormInput label="Fecha y hora del pago" type="datetime-local" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            <FormSelect label="Medio de pago" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </FormSelect>
            <FormInput label="N° de referencia/transacción" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
            <FormInput label="Institución de origen (banco del cliente)" value={originInstitution} onChange={(e) => setOriginInstitution(e.target.value)} />
            <FormInput label="Institución de destino (donde recibiste)" value={destinationInstitution} onChange={(e) => setDestinationInstitution(e.target.value)} />
            <FormInput label="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />

            <label style={{ display: "block", marginBottom: "16px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: colors.textMuted }}>
                Comprobante (foto, captura o PDF) — 🔒 próximamente
              </span>
              <input type="file" accept="image/*,.pdf" disabled style={{ color: colors.textMuted, fontSize: "13px" }} />
              <p style={{ color: colors.textMuted, fontSize: "11px", marginTop: "4px" }}>
                Guardar comprobantes requiere activar almacenamiento en Firebase (tiene costo) — se conectará más adelante.
              </p>
            </label>

            <FormButton type="button" onClick={handleRegisterPayment}>
              {submitting ? "Guardando..." : "Registrar pago"}
            </FormButton>
            {error && <p style={{ color: colors.danger, marginTop: "10px" }}>{error}</p>}
          </CollapsibleSection>

          <CollapsibleSection title={`Historial de pagos (${payments.length})`}>
            {payments.length > 1 && (
              <div style={{ marginBottom: "12px" }}>
                <FormButton type="button" variant="secondary" onClick={() => setPaymentsNewestFirst(!paymentsNewestFirst)}>
                  {paymentsNewestFirst ? "Ver más antiguos primero" : "Ver más recientes primero"}
                </FormButton>
              </div>
            )}
            {payments.length === 0 && <p style={{ color: colors.textMuted }}>Todavía no hay pagos registrados.</p>}
            {[...payments]
              .sort((a, b) => {
                const dateA = new Date(a.paymentDate ?? a.createdAt).getTime();
                const dateB = new Date(b.paymentDate ?? b.createdAt).getTime();
                return paymentsNewestFirst ? dateB - dateA : dateA - dateB;
              })
              .map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderLeft: `4px solid ${colors.primary}`, background: colors.card, borderRadius: "8px", marginBottom: "8px", color: colors.text }}>
                <div>
                  <div>{customerName(p.customerId)} — {PAYMENT_METHOD_LABELS[p.method] ?? "Medio no especificado"}</div>
                  <div style={{ color: colors.textMuted, fontSize: "11px" }}>{new Date(p.paymentDate ?? p.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: colors.primary, fontWeight: 600 }}>${(Number.isFinite(p.amount) ? p.amount : 0).toFixed(2)}</span>
                  <Link to={`/payments#payment-${p.id}`} style={{ color: colors.secondary, fontSize: "12px", border: `1px solid ${colors.secondary}`, borderRadius: "8px", padding: "4px 10px", textDecoration: "none" }}>
                    Ver
                  </Link>
                </div>
              </div>
            ))}
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}