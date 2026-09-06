import type { MembershipRole, ModuleKey } from "../models/Membership";
import { isElevatedRole } from "../models/Membership";

export interface MenuItem {
  label: string;
  path: string;
  moduleKey?: ModuleKey;
  elevatedOnly?: boolean;
  allowIfCanCreateProducts?: boolean; // excepción puntual, ver /settings/recipes
  hideFromSidebar?: boolean;
}

export const menuItems: MenuItem[] = [
  { label: "🏠 Honestly Foods", path: "/" },
  { label: "🛒 Compras", path: "/purchases", moduleKey: "compras" },
  { label: "📦 Inventario", path: "/inventory", moduleKey: "inventario" },
  { label: "🏭 Producción", path: "/production", moduleKey: "produccion" },
  { label: "💰 Ventas", path: "/sales", moduleKey: "ventas" },
  { label: "👥 Clientes", path: "/customers", moduleKey: "clientes" },
  { label: "📈 Finanzas", path: "/finance", moduleKey: "finanzas" },
  { label: "📣 Marketing", path: "/marketing", moduleKey: "marketing" },
  { label: "🎯 Centro de Decisiones", path: "/decisions" },
  { label: "📊 Dashboards", path: "/dashboards" },
  { label: "🧑‍🤝‍🧑 Equipo", path: "/team", elevatedOnly: true },
  { label: "💾 Respaldo de Datos", path: "/backup", elevatedOnly: true },
  { label: "⚙ Configuración", path: "/settings", elevatedOnly: true },

  // Accesibles por link interno, no aparecen en el Sidebar:
  { label: "Facturas", path: "/invoices", moduleKey: "ventas", hideFromSidebar: true },
  { label: "Cobranza", path: "/payments", moduleKey: "ventas", hideFromSidebar: true },
  { label: "Órdenes de Compra", path: "/orders", moduleKey: "compras", hideFromSidebar: true },
  { label: "Pagos a Proveedores", path: "/purchases/payments", moduleKey: "compras", hideFromSidebar: true },
  // BP-055: crear/editar productos (recetas/BOM) — elevado, o producción
  // con autorización puntual del dueño (canCreateProducts).
  { label: "Recetas y Productos", path: "/settings/recipes", elevatedOnly: true, allowIfCanCreateProducts: true, hideFromSidebar: true },
  { label: "Precios", path: "/settings/pricing", elevatedOnly: true, hideFromSidebar: true },
  { label: "Merma", path: "/waste", moduleKey: "inventario", hideFromSidebar: true },
  { label: "Ajustes", path: "/adjustments", elevatedOnly: true, hideFromSidebar: true },
];

export function canAccess(
  item: MenuItem,
  role: MembershipRole | null,
  modules: ModuleKey[],
  canCreateProducts: boolean
): boolean {
  if (isElevatedRole(role)) return true;
  if (item.allowIfCanCreateProducts && canCreateProducts) return true;
  if (item.elevatedOnly) return false;
  if (!item.moduleKey) return true;
  return modules.includes(item.moduleKey);
}

export function findMenuItem(path: string): MenuItem | undefined {
  return menuItems.find((item) => item.path === path);
}