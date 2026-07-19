// MaterialShortageAlert.tsx — Centro de Decisiones. Ahora también muestra
// "cuánto puedes producir con lo que tienes" cuando hay faltantes.

import type { ProductionNeed } from "../models/ProductionNeed";
import { toDecisionMessage, toLowStockWarning } from "../services/productionCalculatorService";
import { getMaterialIcon } from "../utils/materialIcons";

interface MaterialShortageAlertProps {
  productName: string;
  shortages: ProductionNeed[];
  warnings: ProductionNeed[];
  maxProducible?: number;
  yieldUnit?: string;
}

const rowStyle = (borderColor: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  borderLeft: `4px solid ${borderColor}`,
  borderRadius: "6px",
  background: "rgba(255,255,255,0.03)",
  marginBottom: "8px",
});

export function MaterialShortageAlert({
  productName,
  shortages,
  warnings,
  maxProducible,
  yieldUnit,
}: MaterialShortageAlertProps) {
  if (shortages.length === 0 && warnings.length === 0) return null;

  return (
    <div style={{ marginBottom: "16px" }}>
      <strong>{productName}</strong>

      <div style={{ marginTop: "8px" }}>
        {shortages.length > 0 && maxProducible !== undefined && (
          <div style={rowStyle("#2E7D32")}>
            <span style={{ fontSize: "20px" }}>📊</span>
            <span>
              Con tu stock actual, puedes producir hasta {maxProducible.toFixed(2)} {yieldUnit} de {productName}.
            </span>
          </div>
        )}

        {shortages.map((need) => (
          <div key={need.sourceId} style={rowStyle("#c62828")}>
            <span style={{ fontSize: "20px" }}>{getMaterialIcon(need.category)}</span>
            <span>⚠️ {toDecisionMessage(need)}</span>
          </div>
        ))}
        {warnings.map((need) => (
          <div key={need.sourceId} style={rowStyle("#f9a825")}>
            <span style={{ fontSize: "20px" }}>{getMaterialIcon(need.category)}</span>
            <span>🔔 {toLowStockWarning(need)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
