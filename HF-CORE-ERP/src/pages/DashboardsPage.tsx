import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import * as dashboardService from "../services/dashboardService";
import type { Period, BarDatum } from "../services/dashboardService";
import { FormSelect } from "../components/FormSelect";
import { colors } from "../theme/colors";

/**
 * Página: Dashboards — Ruta: /dashboards
 * BP-050: se agregan reportes de Compras (por proveedor y material),
 * Merma por producto, y se mejora la visualización general.
 */

type ReportGroup = "ventas" | "compras" | "merma";
type ReportType = "customer" | "product" | "zone" | "supplier" | "material" | "waste";

const GROUPS: { value: ReportGroup; label: string }[] = [
  { value: "ventas", label: "📊 Ventas" },
  { value: "compras", label: "🛒 Compras" },
  { value: "merma", label: "⚠️ Merma" },
];

const REPORTS: Record<ReportGroup, { value: ReportType; label: string }[]> = {
  ventas: [
    { value: "customer", label: "Por cliente (monto total)" },
    { value: "product", label: "Por producto (rotación)" },
    { value: "zone", label: "Clientes por zona/ciudad" },
  ],
  compras: [
    { value: "supplier", label: "Por proveedor (concentración de compras)" },
    { value: "material", label: "Materiales más comprados (cantidad)" },
  ],
  merma: [
    { value: "waste", label: "Merma por producto (proceso + error)" },
  ],
};

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "weekly", label: "Última semana" },
  { value: "monthly", label: "Último mes" },
  { value: "quarterly", label: "Último trimestre" },
  { value: "semiannual", label: "Último semestre" },
  { value: "annual", label: "Último año" },
];

const PIE_COLORS = [colors.primary, "#66BB6A", "#FFA726", "#EF5350", "#AB47BC", "#29B6F6", "#26C6DA", "#D4E157"];

function BarChartPanel({ data, label, showSecondary }: { data: BarDatum[]; label: string; showSecondary?: boolean }) {
  const height = Math.max(300, data.length * 52);
  return (
    <div style={{ marginTop: "24px", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis type="number" stroke={colors.textMuted} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" stroke={colors.textMuted} width={160} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.text }} />
          {showSecondary ? (
            <>
              <Bar dataKey={(d: BarDatum) => Math.round(((d.total) - (d.secondary ?? 0)) * 100) / 100}
                name="Merma de proceso" stackId="a" fill={colors.warning} />
              <Bar dataKey="secondary" name="Merma por error" stackId="a" fill={colors.danger} radius={[0, 6, 6, 0]} />
            </>
          ) : (
            <Bar dataKey="total" name={label} fill={colors.primary} radius={[0, 6, 6, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieChartPanel({ data }: { data: BarDatum[] }) {
  const grandTotal = data.reduce((s, d) => s + d.total, 0);
  return (
    <div style={{ marginTop: "24px" }}>
      {/* Alerta de concentración */}
      {data.length > 0 && data[0].total / grandTotal > 0.6 && (
        <div style={{ background: `${colors.danger}22`, border: `1px solid ${colors.danger}`, borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: colors.danger }}>
          ⚠️ <strong>{data[0].name}</strong> representa el {Math.round(data[0].total / grandTotal * 100)}% del total de compras en este período — dependencia alta. Considera diversificar proveedores.
        </div>
      )}
      <div style={{ height: "340px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={130}>
              {data.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.text }} formatter={(val) => [`$${Number(val ?? 0).toFixed(2)}`]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardsPage() {
  const [group, setGroup] = useState<ReportGroup>("ventas");
  const [reportType, setReportType] = useState<ReportType>("customer");
  const [period, setPeriod] = useState<Period>("monthly");
  const [data, setData] = useState<BarDatum[]>([]);
  const [loading, setLoading] = useState(true);

  // Cuando cambia el grupo, seleccionar el primer reporte del grupo
  function handleGroupChange(g: ReportGroup) {
    setGroup(g);
    setReportType(REPORTS[g][0].value);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    let result: BarDatum[];
    switch (reportType) {
      case "customer":  result = await dashboardService.salesByCustomer(period); break;
      case "product":   result = await dashboardService.salesByProduct(period); break;
      case "zone":      result = await dashboardService.customersByZone(); break;
      case "supplier":  result = await dashboardService.purchasesBySupplier(period); break;
      case "material":  result = await dashboardService.purchasesByMaterial(period); break;
      case "waste":     result = await dashboardService.wasteByProduct(period); break;
      default:          result = [];
    }
    setData(result);
    setLoading(false);
  }, [reportType, period]);

  useEffect(() => { loadData(); }, [loadData]);

  const usePie = reportType === "supplier";
  const barLabel = reportType === "customer" ? "Total ($)" : reportType === "supplier" ? "Total ($)" : reportType === "material" ? "Cantidad (g)" : reportType === "waste" ? "Pérdida total" : "Unidades";

  return (
    <div style={{ maxWidth: "820px" }}>
      <h1 style={{ color: colors.text }}>Dashboards</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        Ventas, compras, producción y merma — todo en un solo lugar.
      </p>

      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", padding: "24px" }}>
        {/* Selector de grupo */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {GROUPS.map((g) => (
            <button key={g.value} onClick={() => handleGroupChange(g.value)} style={{ padding: "8px 16px", borderRadius: "999px", border: `1px solid ${colors.border}`, background: group === g.value ? colors.primary : "transparent", color: group === g.value ? "#fff" : colors.text, fontSize: "14px", cursor: "pointer", fontWeight: group === g.value ? 600 : 400 }}>
              {g.label}
            </button>
          ))}
        </div>

        {/* Selectores de reporte y período */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <FormSelect label="Reporte" value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
              {REPORTS[group].map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </FormSelect>
          </div>
          {reportType !== "zone" && (
            <div style={{ flex: 1, minWidth: "180px" }}>
              <FormSelect label="Período" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                {PERIOD_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </FormSelect>
            </div>
          )}
        </div>

        {loading && <p style={{ color: colors.textMuted, marginTop: "24px" }}>Cargando...</p>}
        {!loading && data.length === 0 && <p style={{ color: colors.textMuted, marginTop: "24px" }}>No hay datos suficientes para este reporte en el período seleccionado.</p>}

        {!loading && data.length > 0 && (
          usePie
            ? <PieChartPanel data={data} />
            : <BarChartPanel data={data} label={barLabel} showSecondary={reportType === 'waste'} />
        )}
      </div>
    </div>
  );
}