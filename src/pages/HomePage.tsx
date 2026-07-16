import Card from "../components/ui/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export default function HomePage() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Card>
        <h1
          style={{
            color: colors.primary,
            fontSize: typography.title,
          }}
        >
          HF CORE ERP
        </h1>

        <h2
          style={{
            color: colors.text,
            fontSize: typography.subtitle,
          }}
        >
          Honestly Foods CA
        </h2>

        <p
          style={{
            color: colors.textMuted,
            fontSize: typography.body,
          }}
        >
          Release 0.1.0
        </p>

        <p
          style={{
            color: colors.textMuted,
            fontSize: typography.body,
          }}
        >
          ERP Lite para Startups y PyMEs
        </p>
      </Card>
    </div>
  );
}