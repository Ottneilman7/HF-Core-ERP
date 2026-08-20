/**
 * Página: Historial de Merma
 * Ruta: /waste
 *
 * BP-046: muestra todos los registros de merma guardados en Firestore
 * por wasteLogService. Dos tipos:
 *   - "process": diferencia entre lo planeado y lo realmente obtenido
 *     al confirmar una producción (BP-040).
 *   - "error": pérdida directa de inventario por quema, derrame, etc.
 *
 * Vista: tabla con filtro por mes, totales de pérdida y botón de detalle.
 */
import { useState, useEffect, useCallback } from "react";
import * as wasteLogService from "../services/wasteLogService";
import type { WasteLogEntry } from "../models/WasteLog";
import { colors } from "../theme/colors";

const REASON_LABELS: Record<string, string> = {
  burned: "Quemado",
  spill: "Derrame",
  expired: "Vencido",
  mishandling: "Mala manipulación",
  other: "Otro",
  process: "Merma de proceso",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getMonthKey(iso: string): string {
  return iso.slice(0, 7); // "2026-08"
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("es-VE", { month: "long", year: "numeric" });
}

export default function WasteLogPage() {
  const [entries, setEntries] = useState<WasteLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await wasteLogService.getWasteLog();
    // Más reciente primero
    data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const months = Array.from(
    new Set(entries.map((e) => getMonthKey(e.createdAt)))
  ).sort((a, b) => b.localeCompare(a));

  const filtered =
    selectedMonth === "all"
      ? entries
      : entries.filter((e) => getMonthKey(e.createdAt) === selectedMonth);

  const totalWaste = filtered.reduce((sum, e) => sum + e.wasteQuantity, 0);

  const sectionStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
  };

  if (loading) {
    return <p style={{ color: colors.textMuted, padding: "32px" }}>Cargando historial de merma...</p>;
  }

  return (
    <div style={{ maxWidth: "760px" }}>
      <h1 style={{ color: colors.text }}>Historial de Merma</h1>
      <p style={{ color: colors.textMuted }}>
        Registro de toda la merma de proceso (producción real vs. planeada) y
        por error (quemas, derrames, vencidos). Úsalo para calcular la pérdida
        mensual y tomar decisiones de mejora.
      </p>

      {/* Filtro por mes */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <label style={{ color: colors.textMuted, fontSize: "13px" }}>Filtrar por mes:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            background: colors.card,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "13px",
          }}
        >
          <option value="all">Todos los meses</option>
          {months.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>

        {/* Totales del período */}
        {filtered.length > 0 && (
          <div style={{
            background: colors.card,
            borderRadius: "10px",
            padding: "8px 16px",
            fontSize: "13px",
            color: colors.text,
          }}>
            <strong>{filtered.length}</strong> registros —{" "}
            Pérdida total: <strong style={{ color: colors.danger }}>
              {totalWaste.toFixed(2)} unidades/gramos
            </strong>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <section style={sectionStyle}>
          <p style={{ color: colors.textMuted, textAlign: "center" }}>
            {entries.length === 0
              ? "No hay registros de merma todavía. Aparecerán aquí cuando confirmes producciones con merma o registres pérdidas de inventario."
              : "No hay registros en el mes seleccionado."}
          </p>
        </section>
      ) : (
        <section style={sectionStyle}>
          {filtered.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: colors.card,
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
                borderLeft: `4px solid ${entry.type === "process" ? colors.warning : colors.danger}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: colors.text, fontWeight: 600, marginBottom: "4px" }}>
                    {entry.type === "process"
                      ? `🔄 Merma de proceso — ${entry.recipeName ?? entry.recipeId}`
                      : `⚠️ Merma por error — ${entry.itemName ?? "ítem"}`}
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: "12px" }}>
                    {formatDate(entry.createdAt)}
                    {entry.reason && ` — ${REASON_LABELS[entry.reason] ?? entry.reason}`}
                    {entry.note && ` — "${entry.note}"`}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "16px" }}>
                  <div style={{ color: colors.danger, fontWeight: 600 }}>
                    -{entry.wasteQuantity.toFixed(2)} {entry.unit}
                  </div>
                  {entry.type === "process" && entry.plannedQuantity != null && entry.actualQuantity != null && (
                    <div style={{ color: colors.textMuted, fontSize: "11px", marginTop: "2px" }}>
                      Planeado: {entry.plannedQuantity} → Real: {entry.actualQuantity}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}