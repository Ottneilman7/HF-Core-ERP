import { useState, useEffect, useCallback } from "react";
import { colors } from "../theme/colors";
import * as wasteLogService from "../services/wasteLogService";
import type { WasteLogEntry } from "../models/WasteLog";

function today() { return new Date().toISOString().slice(0, 10); }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function exportCSV(entries: WasteLogEntry[], from: string, to: string) {
  const rows = [
    ["Fecha","Tipo","Producto","Cantidad","Unidad","Motivo","Nota"].join(","),
    ...entries.map((e) => [
      fmt(e.createdAt),
      e.type === "process" ? "Proceso" : "Error",
      `"${e.recipeName ?? e.itemName ?? ""}"`,
      e.wasteQuantity.toFixed(2), e.unit,
      e.reason ?? "proceso", `"${e.note ?? ""}"`,
    ].join(",")),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `merma-${from}-a-${to}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function WasteLogPage() {
  const [entries, setEntries] = useState<WasteLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());

  const load = useCallback(async () => {
    setLoading(true);
    const data = await wasteLogService.getWasteLog();
    data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) => {
    const d = e.createdAt.slice(0, 10);
    return d >= dateFrom && d <= dateTo;
  });

  // Totales generales
  const totalProcess = filtered.filter((e) => e.type === "process").reduce((s, e) => s + e.wasteQuantity, 0);
  const totalError = filtered.filter((e) => e.type === "error").reduce((s, e) => s + e.wasteQuantity, 0);

  // Desglose por producto
  const byProduct: Record<string, { name: string; process: number; error: number; unit: string }> = {};
  for (const e of filtered) {
    const key = e.recipeId ?? e.rawMaterialId ?? e.productId ?? e.itemName ?? "desconocido";
    const name = e.recipeName ?? e.itemName ?? key;
    if (!byProduct[key]) byProduct[key] = { name, process: 0, error: 0, unit: e.unit };
    if (e.type === "process") byProduct[key].process += e.wasteQuantity;
    else byProduct[key].error += e.wasteQuantity;
  }

  const sectionStyle = { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", padding: "24px", marginBottom: "20px" };
  const card = { background: colors.card, borderRadius: "12px", padding: "14px 16px", marginBottom: "10px" };
  const input = { background: colors.card, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "6px 10px", fontSize: "13px" };

  if (loading) return <p style={{ color: colors.textMuted, padding: "24px" }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: "760px" }}>
      <h1 style={{ color: colors.text }}>Historial de Merma</h1>

      {/* Selector de rango de fechas */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ color: colors.textMuted, fontSize: "13px" }}>Desde:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={input} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ color: colors.textMuted, fontSize: "13px" }}>Hasta:</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={input} />
        </div>
        {/* Atajos rápidos */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { label: "Hoy", from: today(), to: today() },
            { label: "Esta semana", from: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0,10); })(), to: today() },
            { label: "Este mes", from: monthStart(), to: today() },
          ].map((s) => (
            <button key={s.label} onClick={() => { setDateFrom(s.from); setDateTo(s.to); }} style={{ padding: "4px 10px", borderRadius: "999px", border: `1px solid ${colors.border}`, background: "transparent", color: colors.secondary, fontSize: "12px", cursor: "pointer" }}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={() => exportCSV(filtered, dateFrom, dateTo)} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: "999px", border: `1px solid ${colors.secondary}`, background: "transparent", color: colors.secondary, fontSize: "13px", cursor: "pointer" }}>
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Totales generales */}
      <section style={{ ...sectionStyle, display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <div style={{ color: colors.textMuted, fontSize: "12px" }}>Registros</div>
          <div style={{ color: colors.text, fontSize: "24px", fontWeight: 700 }}>{filtered.length}</div>
        </div>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <div style={{ color: colors.textMuted, fontSize: "12px" }}>Merma proceso</div>
          <div style={{ color: colors.warning, fontSize: "20px", fontWeight: 700 }}>{totalProcess.toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <div style={{ color: colors.textMuted, fontSize: "12px" }}>Merma error</div>
          <div style={{ color: colors.danger, fontSize: "20px", fontWeight: 700 }}>{totalError.toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <div style={{ color: colors.textMuted, fontSize: "12px" }}>Total pérdida</div>
          <div style={{ color: colors.danger, fontSize: "20px", fontWeight: 700 }}>{(totalProcess + totalError).toFixed(2)}</div>
        </div>
      </section>

      {/* Desglose por producto */}
      {Object.keys(byProduct).length > 0 && (
        <section style={sectionStyle}>
          <h3 style={{ color: colors.text, marginTop: 0 }}>Pérdida por producto</h3>
          {Object.values(byProduct)
            .sort((a, b) => (b.process + b.error) - (a.process + a.error))
            .map((p) => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...card }}>
                <div>
                  <strong style={{ color: colors.text }}>{p.name}</strong>
                  <div style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>
                    {p.process > 0 && `Proceso: ${p.process.toFixed(2)} ${p.unit}`}
                    {p.process > 0 && p.error > 0 && " · "}
                    {p.error > 0 && `Error: ${p.error.toFixed(2)} ${p.unit}`}
                  </div>
                </div>
                <div style={{ color: colors.danger, fontWeight: 700, fontSize: "16px" }}>
                  {(p.process + p.error).toFixed(2)} <span style={{ fontSize: "12px", fontWeight: 400 }}>{p.unit}</span>
                </div>
              </div>
            ))}
        </section>
      )}

      {/* Lista completa */}
      {filtered.length === 0 ? (
        <p style={{ color: colors.textMuted }}>No hay registros en el rango seleccionado.</p>
      ) : (
        <section style={sectionStyle}>
          <h3 style={{ color: colors.text, marginTop: 0 }}>Detalle ({filtered.length} registros)</h3>
          {filtered.map((e) => (
            <div key={e.id} style={{ ...card, borderLeft: `4px solid ${e.type === "process" ? colors.warning : colors.danger}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: colors.text, fontWeight: 600 }}>
                    {e.type === "process" ? `🔄 Proceso — ${e.recipeName ?? e.recipeId}` : `⚠️ Error — ${e.itemName ?? "ítem"}`}
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: "12px", marginTop: "2px" }}>
                    {fmt(e.createdAt)}
                    {e.reason && ` — ${e.reason}`}
                    {e.note && ` — "${e.note}"`}
                  </div>
                  {e.type === "process" && e.plannedQuantity != null && (
                    <div style={{ color: colors.textMuted, fontSize: "11px" }}>Planeado: {e.plannedQuantity} → Real: {e.actualQuantity}</div>
                  )}
                </div>
                <div style={{ color: colors.danger, fontWeight: 700, flexShrink: 0, marginLeft: "16px" }}>
                  -{e.wasteQuantity.toFixed(2)} {e.unit}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}