# BP-053 — Roles y Aislamiento Multiusuario (Fase 2)

## Objetivo
Cerrar el hallazgo de seguridad ya registrado en PROJECT_STATUS.md ("Reglas de
Firestore sin aislamiento por businessId ni por rol" / "Sin modelo de
roles/permisos de usuario"). Hoy cualquier usuario autenticado en el proyecto
de Firebase puede leer y escribir los datos de businesses/honestly-foods sin
que el sistema verifique que pertenece a ese negocio, y no existe diferencia
entre un usuario Dueño/Gerente, uno de Ventas y uno de Producción.

## Alcance
- Modelo de Membresía: qué usuario pertenece a qué negocio, con qué rol
  (owner, manager, sales, production).
- Reglas de Firestore que verifiquen membresía real antes de dar
  acceso — reemplazan "cualquier autenticado puede todo" por "solo quien
  pertenece a este negocio".
- Flujo de arranque (bootstrap): dar de alta la membresía "owner" de Otto en
  el negocio "honestly-foods" que ya existe, una sola vez.
- Ocultar/deshabilitar en la UI (Sidebar, botones de acciones sensibles) lo
  que el rol activo no debería usar.

## Responsabilidades
- `models/Membership.ts`: tipos (rol, membresía, perfil de usuario).
- `services/membershipService.ts`: leer/crear membresías y perfiles.
- `contexts/AuthContext.tsx` (extendido, no reemplazado): además de
  `user`/`loading`, expone `role` del usuario en el negocio activo.
- `firestore.rules`: única fuente de verdad del control de acceso real —
  el cliente nunca decide permisos, solo los refleja en la UI.

## Modelo conceptual

users/{uid} → perfil (email, negocios a los que pertenece)
businesses/{businessId}/members/{uid} → { role: owner|manager|sales|production }

Un usuario puede pertenecer a un solo negocio por ahora (el propio
"honestly-foods") — el modelo ya admite varios `businessId` en
`UserProfile.businessIds` para no tener que rediseñarlo cuando se active
Fase B, pero **no se construye todavía** ninguna pantalla para crear un
segundo negocio ni para invitar usuarios a él. Eso es explícitamente Fase B
(ver "Fuera del alcance").

## Reglas de negocio
- `owner` y `manager`: acceso total a su negocio (Regla 13 — TEAM_RULES:
  el ERP se adapta al negocio, no bloquea al dueño de su propia data).
- `sales`: acceso de lectura/escritura a Clientes, Ventas, Facturas, Cobranza.
  Sin acceso de escritura a Producción, Materia Prima, Costeo/Precios.
- `production`: acceso de lectura/escritura a Producción, Recetas, Inventario
  de materia prima/producto terminado. Sin acceso a Finanzas ni a datos de
  Clientes (saldos).
- Un usuario sin membresía en el negocio no puede leer ni escribir NADA de
  `businesses/honestly-foods/**` (hoy sí puede).

## Dependencias
- Depende de `authService.ts` / `AuthContext.tsx` ya existentes (BP-024) —
  no se reemplazan, se extienden.
- **No toca** `inventoryAdjustmentService.ts` ni `InventoryPage.tsx` en esta
  primera entrega — esos archivos están marcados en PROJECT_STATUS.md como
  tocados a fondo en v2.2 y requieren coordinación explícita con Claude Code
  antes de modificarlos (Regla de trabajo en paralelo entre IAs). El
  reemplazo del PIN de supervisor por verificación de rol queda como
  BP-053-B, condicionado a confirmar que no hay trabajo en curso ahí.
- No depende de ni bloquea BP-050/051/052 (Costeo y Precios) ni de Cuentas
  por Pagar (Claude Code).

## Fuera del alcance del MVP (Backlog, Regla 8)
- Fase B: multiempresa real (un usuario con más de un negocio, pantalla de
  "crear negocio nuevo", invitar miembros por correo). Pospuesto por tu
  propia decisión ya registrada en PROJECT_STATUS.md.
- Matriz fina de permisos por colección (qué exactamente puede escribir
  "sales" vs "production" documento por documento) — en esta entrega se
  resuelve a nivel de colección completa, no campo por campo.
- Reemplazo del PIN de supervisor (BP-053-B, ver Dependencias).
- Invitaciones por correo / Cloud Functions — se crea la membresía
  manualmente (tú, como owner, la das de alta) hasta que haya más de un
  usuario real usando el sistema.

## Evolución futura
Este modelo es la base directa de Fase B cuando decidas activarla: el mismo
`Membership`/`UserProfile` ya soporta `businessIds: string[]`, así que activar
multiempresa después es agregar una pantalla, no rediseñar el modelo de datos.

## Estado
🟡 Propuesto — pendiente de tu revisión y aprobación (Regla 19).

## Historial
- [fecha] — Propuesto por IA (chat), a partir del hallazgo de seguridad ya
  registrado en PROJECT_STATUS.md v2.2.