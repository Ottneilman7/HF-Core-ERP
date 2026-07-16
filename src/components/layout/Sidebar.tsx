import { colors } from "../../theme/colors";

const menuItems = [
  "🏠 Dashboard",
  "📦 Inventario",
  "🏭 Producción",
  "🛒 Ventas",
  "👥 Clientes",
  "💰 Finanzas",
  "📊 Reportes",
  "⚙ Configuración",
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: "240px",
        background: colors.surface,
        color: colors.text,
        padding: "24px",
        minHeight: "100vh",
        borderRight: `1px solid ${colors.border}`,
      }}
    >
      <h2
        style={{
          color: colors.primary,
          marginBottom: "32px",
        }}
      >
        HF CORE ERP
      </h2>

      {menuItems.map((item) => (
        <div
          key={item}
          style={{
            marginBottom: "18px",
            cursor: "pointer",
          }}
        >
          {item}
        </div>
      ))}
    </aside>
  );
}