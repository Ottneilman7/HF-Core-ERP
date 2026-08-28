// materialIcons.ts — mapeo de categoría a ícono para el Centro de Decisiones.
// Es presentación pura (no regla de negocio), por eso vive en utils, no en services.

const ICONS: Record<string, string> = {
  Cereal: "🌾",
  Endulzante: "🍯",
  "Fruto Seco": "🥜",
  Semilla: "🌱",
  "Fruta Deshidratada": "🍓",
  Condimento: "🧂",
  Grasa: "🥥",
  Cobertura: "🍫",
  Semielaborado: "⚙️",
};

export function getMaterialIcon(category?: string): string {
  if (!category) return "📦";
  return ICONS[category] ?? "📦";
}