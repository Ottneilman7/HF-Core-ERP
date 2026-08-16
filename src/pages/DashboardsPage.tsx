import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import * as dashboardService from "../services/dashboardService";
import type { Period, BarDatum } from "../services/dashboardService";
import { FormSelect } from "../components/FormSelect";
import { colors } from "../theme/colors";

type ReportType = "customer" | "product" | "zone";

const PERIOD_LABELS: Record<Period, string> = {
  weekly: "Última semana",
  monthly: "Último mes",
  quarterly: "Último trimestre",
  semiannual: "Último semestre",
  annual: "Último año",
};

const REPORT_LABELS: Record<ReportType, string> = {
  customer: "Ventas totales por Cliente",
  product: "Ventas por Producto (rotación)",
  zone: "Clientes por Zona",
};

/**
 * Página: Dashboards — Ruta: /dashboards
 * BP-039: una sola ficha con selector de reporte + período. Ganancias
 * reales quedan fuera de esta entrega (falta costo por venta, ver
 * conversación / Backlog) — se agregará como reporte adicional aparte.
 */
export default function DashboardsPage() {
  const [reportType, setReportType] = useState<ReportType>("customer");
  const [period, setPeriod] = useState<Period>("monthly");
  const [data, setData] = useState<BarDatum[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    let result: BarDatum[];
    if (reportType === "customer") result = await dashboardService.salesByCustomer(period);
    else if (reportType === "product") result = await dashboardService.salesByProduct(period);
    else result = await dashboardService.customersByZone();
    setData(result);
    setLoading(false);
  }, [reportType, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 style={{ color: colors.text }}>Dashboards</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        Evolución del negocio: ventas y crecimiento de clientes.
      </p>

      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <FormSelect label="Reporte" value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
              {Object.entries(REPORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </FormSelect>
          </div>
          {reportType !== "zone" && (
            <div style={{ flex: 1, minWidth: "220px" }}>
              <FormSelect label="Período" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </FormSelect>
            </div>
          )}
        </div>

        {loading && <p style={{ color: colors.textMuted, marginTop: "24px" }}>Cargando...</p>}

        {!loading && data.length === 0 && (
          <p style={{ color: colors.textMuted, marginTop: "24px" }}>Todavía no hay datos suficientes para este reporte.</p>
        )}

        {!loading && data.length > 0 && (
          <div style={{ marginTop: "24px", height: "360px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis type="number" stroke={colors.textMuted} />
                <YAxis type="category" dataKey="name" stroke={colors.textMuted} width={140} />
                <Tooltip contentStyle={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.text }} />
                <Bar dataKey="total" fill={colors.primary} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}