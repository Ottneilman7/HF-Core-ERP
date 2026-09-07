# BP-054 — Roles, Módulos Personalizables y Aislamiento Multiusuario (Fase 2)

## Objetivo
Cerrar el hallazgo de seguridad ya registrado desde v2.2: cualquier usuario autenticado en el proyecto de Firebase podía leer y escribir los datos del negocio sin verificar pertenencia, y no existía ninguna diferencia entre Dueño, Gerente, Ventas y Producción. Además, dar al Dueño/Gerente control real y personalizable sobre qué puede ver y hacer cada persona del equipo, sin depender de un desarrollador para cada ajuste.

## Alcance
- Modelo de Membresía por negocio, con rol (etiqueta) y una lista explícita de **módulos** habilitados, editable por persona.
- Firestore Rules reescritas: de "cualquier autenticado puede todo" a membresía real + módulo habilitado por colección.
- Gestión de equipo desde la app (`/team`): alta de cuenta nueva (sin pasar por Firebase Console), edición de rol/módulos, restablecer contraseña, eliminar acceso.
- Reemplazo del PIN de supervisor (`VITE_SUPERVISOR_PIN`, expuesto en el bundle del cliente — control inseguro por diseño) por verificación de rol real en las reglas.
- Bloqueo de navegación: una página no autorizada ya no se abre (antes solo se escondía del Sidebar, pero la URL directa igual funcionaba).
- Respaldo manual de datos (`/backup`) y cambio/restablecimiento de contraseña, ambos sin backend propio (ADR-008).

## Responsabilidades
- `models/Membership.ts`: `MembershipRole`, `ModuleKey`, `DEFAULT_MODULES_BY_ROLE`, `Membership` (incluye `modules: ModuleKey[]` y `canCreateProducts?: boolean`, ver BP-055).
- `services/membershipService.ts`: leer/crear/editar/eliminar membresías.
- `lib/secondaryAuth.ts`: crea la cuenta de Firebase Auth de un nuevo miembro sin cerrar la sesión del Dueño (segunda instancia temporal del SDK — ver ADR-010).
- `services/authService.ts`: `changeMyPassword` (propia cuenta), `sendPasswordReset` (para otra persona, vía correo — no es posible fijarle una contraseña directamente sin Admin SDK).
- `contexts/AuthContext.tsx`: expone `role`, `modules`, `canCreateProducts` del usuario activo.
- `router/menuConfig.ts`: única fuente de verdad de qué rutas existen y qué módulo/rol las habilita — la usan tanto `Sidebar` como `RouteGuard`.
- `router/RouteGuard.tsx`: bloquea el render de una página si el usuario no tiene el módulo/rol requerido.
- `pages/TeamPage.tsx`, `pages/BackupPage.tsx`: UI de administración, ambas `elevatedOnly`.

## Modelo conceptual
```
businesses/{businessId}/members/{uid} → Membership {
  role: "owner" | "manager" | "sales" | "production",
  modules: ModuleKey[],   // ["ventas","clientes","compras","inventario","produccion","finanzas","marketing"]
  canCreateProducts?: boolean,
  email, displayName?, createdAt
}
```
El rol define una plantilla de módulos por defecto al crear el miembro (`DEFAULT_MODULES_BY_ROLE`), pero `modules` queda guardado explícito y editable después — no es un cálculo derivado del rol en cada lectura. Owner/Manager siempre tienen acceso total, sin importar `modules` (bypass por rol elevado).

**Excepción a propósito**: Equipo, Respaldo y Configuración del negocio nunca son delegables por módulo — siempre exclusivos de Dueño/Gerente. Dejar que alguien sin ese nivel pueda agregar usuarios o exportar todos los datos es un riesgo que no se abre aunque técnicamente se pudiera.

## Reglas de negocio
- Ventas: `ventas` (Ventas+Facturas+Cobranza), `clientes`, `marketing` por defecto.
- Producción: `compras`, `inventario`, `produccion` por defecto.
- Las reglas de Firestore son la única fuente real de control de acceso — el Sidebar y `RouteGuard` son UX, no seguridad; su ausencia nunca debe ser la única defensa.
- `inventoryAdjustments` (ajustes manuales de stock) siempre requiere Dueño/Gerente, sin excepción — ningún módulo lo habilita.
- Alta de cuenta nueva: usa una segunda instancia temporal de Firebase (`initializeApp` con nombre único + `deleteApp` al terminar) para no cerrar la sesión de quien la está creando.
- Eliminar un miembro borra su membresía (revoca acceso de inmediato vía reglas) pero no la cuenta de Firebase Auth en sí — eso requeriría Admin SDK/backend, fuera de alcance (ADR-008).
- Restablecer contraseña de otra persona: correo de restablecimiento de Firebase, nunca se fija una contraseña directamente desde el cliente.

## Dependencias
- Depende de `authService.ts`/`AuthContext.tsx` ya existentes — se extendieron, no se reemplazaron.
- Toca archivos marcados como compartidos entre sesiones de IA en versiones previas de `PROJECT_STATUS.md`: `firestore.rules`, `InventoryPage.tsx`, `inventoryAdjustmentService.ts`, `rawMaterialInventoryService.ts` — reconciliado contra el estado real del repo antes de aplicar (confirmado sin conflicto con el trabajo de Cuentas por Pagar, BP-053).

## Fuera del alcance del MVP
- Fase B (multiempresa: un usuario con más de un negocio) — sigue pospuesta por decisión propia del CEO.
- Matriz de permisos campo por campo dentro de una misma colección (hoy es por colección completa).
- Invitaciones por correo automatizadas / Cloud Functions.
- Eliminación real de la cuenta de Firebase Auth al remover a alguien del equipo.

## Evolución futura
El campo `modules` ya es una lista explícita por persona, no derivada del rol — activar Fase B más adelante no requiere rediseñar este modelo, solo agregar `businessId` como dimensión adicional si un mismo usuario llega a pertenecer a más de un negocio.

## Estado
✅ Finalizado — probado con cuentas reales de Ventas y Producción, comportamiento confirmado según lo diseñado.

## Historial
- 05-06/09/2026 — Implementado y probado en sesión de chat (ver también BP-055, BP-056, ADR-010, ADR-011).