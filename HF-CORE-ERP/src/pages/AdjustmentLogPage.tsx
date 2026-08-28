import { useState, useEffect, useCallback } from "react";
import { colors } from "../theme/colors";
import * as inventoryAdjustmentService from "../services/inventoryAdjustmentService";
import type { InventoryAdjustment } from "../services/inventoryAdjustmentService";

function today() { return new Date().toISOString().slice(0, 10); }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TYPE_LABELS: Record<InventoryAdjustment["itemType"], string> = {
  rawMaterial: "Materia prima", semiFinished: "Semielaborado", finished: "Producto terminado",
};

function exportCSV(entries: InventoryAdjustment[], from: string, to: string) {
  const rows = [
    ["Fecha","Tipo","Artículo","Stock anterior","Stock nuevo","Diferencia","Motivo","Nota"].join(","),
    ...entries.map((e) => [
      fmt(e.createdAt), TYPE_LABELS[e.itemType], `"${e.itemName}"`,
      e.previousStock, e.newStock, (e.newStock - e.previousStock).toFixed(2),
      `"${e.reason}"`, `"${e.supervisorNote}"`,
    ].join(",")),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `ajustes-${from}-a-${to}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function AdjustmentLogPage() {
  const [entries, setEntries] = useState<InventoryAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());

  const load = useCallback(async () => {
    setLoading(true);
    const data = await inventoryAdjustmentService.getAdjustments();
    data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) => {
    const d = e.createdAt.slice(0, 10);
    return d >= dateFrom && d <= dateTo;
  });

  const sectionStyle = { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", padding: "24px", marginBottom: "20px" };
  const card = { background: colors.card, borderRadius: "12px", padding: "14px 16px", marginBottom: "10px" };
  const inputStyle = { background: colors.card, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "6px 10px", fontSize: "13px" };

  if (loading) return <p style={{ color: colors.textMuted, padding: "24px" }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: "760px" }}>
      <h1 style={{ color: colors.text }}>Historial de Ajustes de Inventario</h1>
      <p style={{ color: colors.textMuted, marginBottom: "20px" }}>Modificaciones manuales de stock — con motivo y supervisor.</p>

      {/* Selector de rango */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ color: colors.textMuted, fontSize: "13px" }}>Desde:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ color: colors.textMuted, fontSize: "13px" }}>Hasta:</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} />
        </div>
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

      {/* Resumen */}
      <section style={{ ...sectionStyle, display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <div style={{ color: colors.textMuted, fontSize: "12px" }}>Ajustes</div>
          <div style={{ color: colors.text, fontSize: "24px", fontWeight: 700 }}>{filtered.length}</div>
        </div>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <div style={{ color: colors.textMuted, fontSize: "12px" }}>Aumentos</div>
          <div style={{ color: colors.primary, fontSize: "20px", fontWeight: 700 }}>{filtered.filter((e) => e.newStock > e.previousStock).length}</div>
        </div>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <div style={{ color: colors.textMuted, fontSize: "12px" }}>Reducciones</div>
          <div style={{ color: colors.danger, fontSize: "20px", fontWeight: 700 }}>{filtered.filter((e) => e.newStock < e.previousStock).length}</div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <p style={{ color: colors.textMuted }}>No hay ajustes en el rango seleccionado.</p>
      ) : (
        <section style={sectionStyle}>
          {filtered.map((e) => {
            const diff = e.newStock - e.previousStock;
            return (
              <div key={e.id} style={{ ...card, borderLeft: `4px solid ${diff >= 0 ? colors.primary : colors.danger}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: colors.text, fontWeight: 600 }}>{e.itemName}</div>
                    <div style={{ color: colors.textMuted, fontSize: "12px", marginTop: "2px" }}>
                      {TYPE_LABELS[e.itemType]} — {fmt(e.createdAt)}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: "12px" }}>
                      Motivo: {e.reason}{e.supervisorNote && ` | Nota: ${e.supervisorNote}`}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: "12px" }}>{e.previousStock} → {e.newStock}</div>
                  </div>
                  <div style={{ color: diff >= 0 ? colors.primary : colors.danger, fontWeight: 700, flexShrink: 0, marginLeft: "16px", fontSize: "16px" }}>
                    {diff >= 0 ? "+" : ""}{diff.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}