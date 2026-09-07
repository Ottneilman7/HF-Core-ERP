# Proyecto HF Core ERP

Versión 2.6 — 06/09/2026

Sprint actual: Ninguno abierto — **MVP completo y listo para uso diario (single-tenant, multiusuario con roles)**. Los 8 flujos originales + Costeo y Precios + Cuentas por Pagar + Fase 2 (roles/aislamiento/módulos personalizables) + ficha unificada de Producto/Receta, todo implementado y probado con cuentas reales.

Estado MVP: 🟢 Completo y listo para uso diario. Sin bloqueadores técnicos pendientes.

---

## Resumen ejecutivo

Con Fase 2 cerrada y probada (roles reales, módulos personalizables por persona, PIN reemplazado, catálogo de productos corregido y unificado) y `npm run build` confirmado sin errores, el sistema queda **completamente listo** para operar el negocio real con más de un usuario. Queda un solo pendiente, no bloqueante: que el CEO termine de auditar los costos de materia prima existentes (tarea de datos, no de código).

---

## Qué está migrado a Firestore (y qué no)

Sin cambios — 100% en Firestore, nada en localStorage.

## Blueprints finalizados

BP-001 a BP-053 (ver versiones anteriores — incluye Costeo y Precios, Cuentas por Pagar a proveedores). Nuevos en esta versión:

- **BP-054** — Roles, Módulos Personalizables y Aislamiento Multiusuario: `Membership` con lista explícita de módulos por persona (no solo rol fijo), Firestore Rules reescritas con aislamiento real, gestión de equipo desde la app (`/team`: alta de cuenta sin Firebase Console, edición, restablecer contraseña, eliminar), PIN de supervisor reemplazado por verificación de rol real, bloqueo de navegación por página (`RouteGuard`), respaldo manual de datos (`/backup`), cambio de contraseña propia.
- **BP-055** — Ficha Unificada de Producto/Receta: se retira el catálogo paralelo de `Product` (ver ADR-011 — la receta ya era el producto desde BP-048, y ese trabajo previo no se había conectado a nada). `Recipe` gana `category`/`description`, camino de producto de reventa sin BOM, permiso `canCreateProducts` para autorizar a Producción caso por caso.
- **BP-056** — Corrección de Unidad de Medida en Recetas: la ficha ahora distingue explícitamente "por unidad" (ej. 1 barra) de "a granel" (peso/volumen), evitando el error de configurar el rendimiento en la unidad equivocada.

## Auditoría de arquitectura y seguridad

Actualizado:
- ✅ **Resuelto y probado**: Firestore Rules con aislamiento real por negocio + permisos por módulo, verificado con cuentas de prueba de Ventas y Producción (ambas se comportaron según lo diseñado: acceso correcto a sus módulos, bloqueo correcto de lo demás, incluyendo bloqueo de navegación directa por URL).
- ✅ **Resuelto**: PIN de supervisor expuesto en el cliente — reemplazado por rol real en las reglas.
- ✅ **Resuelto**: catálogo de Productos sin CRUD real — corregido y luego, tras revisión más profunda, unificado con `RecipeConfigPage.tsx` (ver ADR-011) en vez de mantenerse como sistema paralelo.
- ✅ **Resuelto**: gestión de equipo sin depender de acceso a Firebase Console (relevante también de cara a una eventual venta del producto a terceros, Fase B).
- ✅ **Resuelto**: `npm run build` corrido y confirmado limpio (06/09/2026) — 0 errores de TypeScript, 0 imports sin usar pese a `noUnusedLocals: true`. 678 módulos, build en 2.74s. Nota: el proyecto usa Vite 8 con `rolldown` como bundler (más rápido que el Rollup clásico) — vale la pena tenerlo presente si algún día se investiga un problema de build raro y las guías genéricas de Rollup no aplican igual.
- Pendiente sin cambios: cobertura de tests automatizados en servicios financieros, `package.json` sin script `"test"`.

## Módulo de Costeo y Precios

Sin cambios. **Sigue pendiente que el CEO termine de auditar el costo unitario de cada materia prima** (>$1/gramo es sospechoso) — tarea de datos del negocio, no de código, y es lo único que falta para confiar del todo en los números de precio sugerido.

## Cuentas por Pagar a proveedores

Sin cambios respecto a v2.3/v2.4 — funcionando, probado con datos reales. ✅

## Fase 2 — Roles y Aislamiento (cerrada, 06/09/2026)

Ver BP-054 para el detalle completo. Resumen de lo probado en esta sesión:
- Cuenta de Ventas: ve Ventas/Clientes/Facturas/Cobranza/Marketing; no puede navegar a Inventario/Compras/Producción/Finanzas/Equipo/Respaldo/Configuración (la página ni se abre).
- Cuenta de Producción: ve Compras/Inventario/Producción; puede crear materia prima; **no puede** confirmar ajustes manuales de stock (el modal se abre pero el botón de guardar queda deshabilitado, y aunque se saltara la UI, la transacción de Firestore lo rechaza igual).
- Alta de cuenta nueva, edición de módulos, restablecer contraseña y eliminar acceso: probados desde `/team` sin necesidad de Firebase Console.
- Cambio de contraseña propia: probado desde el Sidebar.

## Ficha de Producto/Receta (cerrada, 06/09/2026)

Ver BP-055 y BP-056. `RecipeConfigPage.tsx` (`/settings/recipes`) es ahora la única forma de dar de alta un producto — con receta (fabricado aquí) o sin ella (reventa). Probado extremo a extremo: creación de producto de reventa → aparece en Inventario → seleccionable en Compras → stock sube al recibir. Producto fabricado con "por unidad" → cantidades correctas al escalar producción.

## Backlog explícito (fuera del MVP, registrado a propósito)

- ~~Fase 2 (roles y aislamiento)~~ ✅ Hecho y probado.
- ~~Catálogo de Productos~~ ✅ Hecho (unificado con Recetas, ver ADR-011).
- Conectar Firebase Storage para comprobantes de pago (pospuesto por costo).
- Rediseño de Granola a granel + empaque por demanda — pendiente de decisión de negocio.
- Dashboard con gráficas generales — puede reusar el patrón de Recharts del simulador de precios.
- Importar catálogo real de clientes desde Excel del CEO.
- Pruebas automatizadas contra el emulador de Firestore; agregar script `"test"` a `package.json`.
- README real (setup, variables de entorno, decisiones de arquitectura) — sigue siendo el boilerplate de Vite.
- Unificar `Payment`/`SupplierPayment` (duplicación estructural, sin urgencia).
- Auditar costos de materia prima existentes (CEO, tarea de datos).
- **Fase B** (multiusuario/multi-negocio SaaS) — evaluar después de un periodo de uso real con Fase 2 ya cerrada, solo si no genera costos nuevos en Firebase. Con `Membership.modules` ya explícito por persona, activar Fase B no requiere rediseñar el modelo de permisos.

## Nota de proceso — trabajo en paralelo entre IAs

Esta versión tocó a fondo: `firestore.rules`, `AuthContext.tsx`, `Sidebar.tsx`, `AppRouter.tsx`, `InventoryPage.tsx`, `RecipeConfigPage.tsx`, `models/Recipe.ts`, `models/Membership.ts`. Se retiraron `pages/ProductsPage.tsx` y `services/productService.ts` (ver ADR-011) — si alguna otra sesión los tenía en mente para algo, ya no existen. Si Claude Code retoma trabajo en este proyecto, empezar releyendo BP-054, BP-055, BP-056, ADR-010 y ADR-011 antes de tocar cualquiera de esos archivos.

Última actualización: 06/09/2026.