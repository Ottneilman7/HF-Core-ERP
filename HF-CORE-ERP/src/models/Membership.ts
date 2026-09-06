export type MembershipRole = "owner" | "manager" | "sales" | "production";

export type ModuleKey =
  | "ventas" | "clientes" | "compras" | "inventario"
  | "produccion" | "finanzas" | "marketing";

export const ALL_MODULES: ModuleKey[] = [
  "ventas", "clientes", "compras", "inventario", "produccion", "finanzas", "marketing",
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  ventas: "Ventas (+ Facturas y Cobranza)",
  clientes: "Clientes",
  compras: "Compras (+ Órdenes y Pagos a Proveedores)",
  inventario: "Inventario (+ Catálogo de Productos)",
  produccion: "Producción",
  finanzas: "Finanzas",
  marketing: "Marketing",
};

export const DEFAULT_MODULES_BY_ROLE: Record<MembershipRole, ModuleKey[]> = {
  owner: ALL_MODULES,
  manager: ALL_MODULES,
  sales: ["ventas", "clientes", "marketing"],
  production: ["compras", "inventario", "produccion"],
};

export interface Membership {
  uid: string;
  businessId: string;
  role: MembershipRole;
  modules: ModuleKey[];
  // BP-055: crear un producto nuevo (con o sin receta/BOM) es una decisión
  // de negocio, no una tarea operativa del día a día — por defecto solo
  // owner/manager. Se puede activar por persona específica de Producción
  // que ya se haya ganado la confianza del dueño. No es un permiso más
  // dentro de `modules` a propósito: así queda claro en /team que es una
  // excepción puntual, no parte del paquete normal de su rol.
  canCreateProducts?: boolean;
  email: string;
  displayName?: string;
  createdAt: string;
}

export const ELEVATED_ROLES: MembershipRole[] = ["owner", "manager"];

export function isElevatedRole(role: MembershipRole | null | undefined): boolean {
  return !!role && ELEVATED_ROLES.includes(role);
}

export const ROLE_LABELS: Record<MembershipRole, string> = {
  owner: "Dueño",
  manager: "Gerente",
  sales: "Ventas",
  production: "Producción",
};