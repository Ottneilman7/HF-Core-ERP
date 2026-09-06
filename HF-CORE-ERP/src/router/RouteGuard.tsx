import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { findMenuItem, canAccess } from "./menuConfig";
import { colors } from "../theme/colors";

export default function RouteGuard({ path, children }: { path: string; children: ReactNode }) {
  const { role, modules, canCreateProducts } = useAuth();
  const item = findMenuItem(path);
  const allowed = !item || canAccess(item, role, modules, canCreateProducts);
  if (!allowed) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <h2 style={{ color: colors.warning }}>Sin acceso a esta sección</h2>
        <p style={{ color: colors.textMuted }}>
          Pide al Dueño o Gerente que te habilite este módulo desde "Equipo".
        </p>
      </div>
    );
  }
  return <>{children}</>;
}