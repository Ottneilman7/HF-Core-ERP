// DecisionCenterPage.tsx
//
// Corrección (feedback CEO, 19/07/2026): se retira la alerta automática de
// "stock mínimo" de materia prima/semielaborados. Esos mínimos son
// placeholders que YO cargué (ver BP-011/012), no valores que el emprendedor
// haya definido — mostrarlos como alerta era ruido, no una decisión real.
// El Centro de Decisiones ahora solo refleja lo que el dueño del negocio
// activamente consulta o registra (Producción, y en el futuro Marketing,
// tareas del local, etc.), no umbrales que nadie configuró todavía.
//
// Backlog: reactivar esta alerta automática cuando exista una pantalla de
// Configuración donde el emprendedor defina sus propios mínimos reales.

import Card from "../components/ui/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useProductionAlerts } from "../contexts/ProductionAlertsContext";
import { MaterialShortageAlert } from "../components/MaterialShortageAlert";
import { ResetButton } from "../components/ResetButton";

export default function DecisionCenterPage() {
  const { alerts, resetAlerts } = useProductionAlerts();
  const alertList = Object.entries(alerts);

  return (
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <Card>
        <h1 style={{ color: colors.primary, fontSize: typography.title }}>Centro de Decisiones</h1>
        <h2 style={{ color: colors.text, fontSize: typography.subtitle }}>Honestly Foods CA</h2>

        {alertList.length === 0 && (
          <p style={{ color: colors.textMuted, fontSize: typography.body }}>
            No hay nada que decidir todavía. Ve a "Producción" y dinos qué quieres fabricar hoy — aquí verás qué te falta.
          </p>
        )}
      </Card>

      {alertList.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h3 style={{ margin: 0 }}>Consultas de Producción</h3>
            <ResetButton onClick={resetAlerts} label="Reiniciar consulta" />
          </div>

          {alertList.map(([productId, alert]) => (
            <Card key={productId}>
              <MaterialShortageAlert
                productName={alert.productName}
                shortages={alert.shortages}
                warnings={alert.warnings}
                maxProducible={alert.maxProducible}
                yieldUnit={alert.yieldUnit}
              />
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
