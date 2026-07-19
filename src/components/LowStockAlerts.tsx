// LowStockAlerts.tsx — alerta GENERAL del Centro de Decisiones, sin depender
// de ninguna simulación: lee directo el catálogo de materia prima y de
// semielaborados con inventario propio.

import type { RawMaterial } from "../models/RawMaterial";
import type { Recipe } from "../models/Recipe";
import { getMaterialIcon } from "../utils/materialIcons";

interface LowStockAlertsProps {
  lowRawMaterials: RawMaterial[];
  lowTrackedRecipes: Recipe[];
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  borderLeft: "4px solid #c62828",
  borderRadius: "6px",
  background: "rgba(255,255,255,0.03)",
  marginBottom: "8px",
};

export function LowStockAlerts({ lowRawMaterials, lowTrackedRecipes }: LowStockAlertsProps) {
  if (lowRawMaterials.length === 0 && lowTrackedRecipes.length === 0) return null;

  return (
    <div>
      {lowRawMaterials.map((rm) => (
        <div key={rm.id} style={rowStyle}>
          <span style={{ fontSize: "20px" }}>{getMaterialIcon(rm.category)}</span>
          <span>⚠️ No tienes suficiente {rm.name} — faltan {(rm.minimumStock - rm.currentStock).toFixed(2)} {rm.unit}.</span>
        </div>
      ))}
      {lowTrackedRecipes.map((r) => (
        <div key={r.id} style={rowStyle}>
          <span style={{ fontSize: "20px" }}>{getMaterialIcon("Semielaborado")}</span>
          <span>
            ⚠️ No tienes suficiente {r.name ?? r.code} — faltan{" "}
            {((r.minimumStock ?? 0) - (r.currentStock ?? 0)).toFixed(2)} {r.unit ?? ""}.
          </span>
        </div>
      ))}
    </div>
  );
}
