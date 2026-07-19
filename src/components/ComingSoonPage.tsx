// ComingSoonPage.tsx — honestidad con el usuario: si el módulo no existe
// todavía, se dice claramente en vez de dejar una pantalla en blanco.

import Card from "./ui/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

interface ComingSoonPageProps {
  title: string;
  description: string;
}

export default function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px 24px" }}>
      <Card>
        <h1 style={{ color: colors.primary, fontSize: typography.title }}>{title}</h1>
        <p style={{ color: colors.textMuted, fontSize: typography.body, marginTop: "12px" }}>
          {description}
        </p>
        <p style={{ color: colors.textMuted, fontSize: typography.body, marginTop: "12px" }}>
          Esta sección está en el roadmap de HF Core ERP. Todavía no está construida.
        </p>
      </Card>
    </div>
  );
}
