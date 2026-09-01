# Proyecto HF Core ERP

Versión 2.1 — 01/09/2026

Sprint actual: Ninguno abierto — MVP de los 8 flujos completo para Honestly Foods CA. En fase de estabilización y endurecimiento de seguridad (auditoría de arquitectura externa, ver abajo), con documentación para posible traspaso de equipo y trabajo en paralelo entre IAs.

Estado MVP: 🟢 Completo y 100% en Firestore (uso interno, single-tenant) — 🟡 Requiere trabajo adicional antes de ser producto SaaS multiusuario (ver Backlog).

---

## Resumen ejecutivo

Los 8 flujos definidos en `EL-Verdadero-MVP-EIF.md` están construidos y probados con datos reales del negocio: **Configurar → Catálogo → Comprar → Producir → Vender → Cobrar → Facturar → Promocionar**, más el Centro de Decisiones (Nivel 2, ADR-003).

La persistencia migró completamente de `localStorage` a **Firebase (Firestore + Authentication)**, módulo por módulo, entre BP-023 y BP-043 (ver ADR-008). **Ya no queda ningún módulo de datos en localStorage** — Producto Terminado (BP-042) y Marketing (BP-043) fueron los últimos en migrar. Un solo negocio (`businesses/honestly-foods`), un solo usuario autenticado (el CEO) — arquitectura ya preparada para multiusuario en Firestore (`businesses/{businessId}`), pero sin construir todavía el registro/aislamiento de múltiples negocios (Fase B, ver PRODUCT_VISION.md).

---

## Qué está migrado a Firestore (y qué no)

| Módulo | Estado | Colección |
|---|---|---|
| Configuración (Empresa, Parámetros, Impuestos) | 🟢 Firestore | `businesses/{id}` (campos) |
| Materia Prima | 🟢 Firestore | `businesses/{id}/rawMaterials` |
| Recetas / Semielaborados | 🟢 Firestore | `businesses/{id}/recipes` |
| Proveedores y Órdenes de Compra | 🟢 Firestore | `businesses/{id}/suppliers`, `.../purchaseOrders` |
| Clientes | 🟢 Firestore | `businesses/{id}/customers` |
| Ventas | 🟢 Firestore | `businesses/{id}/sales` |
| Pagos | 🟢 Firestore | `businesses/{id}/payments` |
| Facturas | 🟢 Firestore | `businesses/{id}/invoices` |
| Producto Terminado (inventario) | 🟢 Firestore | `businesses/{id}/finishedGoods` — **migrado (BP-042)** |
| Marketing (estrategia, calendario) | 🟢 Firestore | `businesses/{id}/marketingStrategy`, `.../marketingPosts` — **migrado (BP-043)** |

**Ningún servicio de persistencia sigue en localStorage.** Los únicos archivos sin Firestore son `authService.ts` (usa Firebase Auth, no Firestore directamente), `dashboardService.ts` y `productionCalculatorService.ts` (son calculadores puros en memoria, no servicios de datos — correcto que no toquen Firestore).

## Blueprints finalizados

BP-001, BP-005, BP-007 a BP-014 (Producción y su Fase 2), BP-016 a BP-043 completos — ver `docs/blueprints/` para el detalle de cada uno. Índice rápido de los más recientes:

- **BP-023 a BP-026**: Fase A de Firebase — setup, autenticación, migración de Materia Prima y Recetas.
- **BP-027 a BP-029**: Clientes en Ventas, venta de materia prima/semielaborados, anulación de venta, Facturación con numeración secuencial.
- **BP-030 a BP-034**: migración completa de Compras/Clientes/Ventas/Pagos/Facturas a Firestore; registro extendido de pagos (método, referencia, fecha real del pago).
- **BP-035**: Retención de IVA en Cuentas por Cobrar.
- **BP-036**: fichas colapsables, filtro alfabético, edición en línea, navegación cruzada entre módulos.
- **BP-037**: Compras avanzadas (Kg/Gr, exención de IVA, datos contables) y Anulación de Compra/devolución.
- **BP-038**: correcciones post-mantenimiento (imports faltantes, saldos corruptos, edición de pagos).
- **BP-042**: migración de Producto Terminado a Firestore.
- **BP-043**: migración de Marketing a Firestore.

## Auditoría de arquitectura y seguridad (01/09/2026, revisión externa)

Se realizó una auditoría completa de arquitectura sobre el commit del 27/08. Hallazgos y estado:

| Hallazgo | Severidad | Estado |
|---|---|---|
| PIN de supervisor hardcodeado en texto plano en el repo público | 🔴 Crítico | ✅ **Resuelto** — movido a `VITE_SUPERVISOR_PIN` en `.env.local`, PIN anterior rotado |
| `confirmProduction` no era atómico pese a decirlo en el comentario (múltiples escrituras sueltas, sin transacción) | 🔴 Crítico | ✅ **Resuelto** — reescrito como una sola `runTransaction` de Firestore |
| `rawMaterialInventoryService` y `recipeStockService` sin transacciones (riesgo de lost update en concurrencia) | 🔴 Crítico | ✅ **Resuelto** — migrados a `runTransaction` |
| Reglas de Firestore sin aislamiento por `businessId` ni por rol | 🟡 Importante | ⏳ Pendiente — Fase 2 |
| Sin modelo de roles/permisos de usuario | 🟡 Importante | ⏳ Pendiente — Fase 2 |
| Falta `.env.example` | 🟡 Importante | ✅ **Resuelto** |
| Cobertura de tests baja en servicios financieros | 🟡 Importante | ⏳ Pendiente |

Detalle completo en `HF-Core-ERP_Auditoria_Arquitectura.md` (guardar copia en esta misma carpeta).

## ADR registradas

ADR-001, ADR-003 (con adenda), ADR-004 (con adenda — usar la versión única, sin sufijo A/B), ADR-005 a ADR-009. Las más relevantes para entender la arquitectura actual: **ADR-008** (por qué y cómo se migró a Firebase) y **ADR-009** (cálculo de retención de IVA, y la regla de "todo campo nuevo necesita respaldo al leerlo").

## Backlog explícito (fuera del MVP, registrado a propósito)

- Cuentas por Pagar a proveedores (hoy solo se registra si una compra fue contado/crédito, sin saldo ni módulo de pagos a proveedores).
- Conectar Firebase Storage para comprobantes de pago (pospuesto por costo).
- Rediseño de Granola a granel + empaque por demanda (separar producción en bulk de la presentación de venta) — **pendiente de decisión de negocio antes de asignarse como tarea técnica**.
- Dashboard con gráficas (ventas por periodo, clientes nuevos por mes) — Recharts ya está instalado, falta implementar las vistas.
- Importar catálogo real de clientes desde Excel del CEO.
- Pruebas automatizadas reescritas contra el emulador de Firestore (las de `localStorage` quedaron obsoletas con la migración y no se repusieron).
- Fase B: multiusuario/multi-negocio (SaaS), reglas de seguridad de Firestore más granulares (ver tabla de auditoría arriba), CI/CD, entornos separados (dev/staging/prod).

## Arquitectura

Frontend: React + TypeScript + Vite. Backend: Firebase (Firestore + Authentication). Sin backend propio — toda la lógica de negocio vive en `src/services/*.ts`, consumida directamente por las páginas.

Patrón consistente en todos los servicios de datos: **semilla en código (`data/*.ts`) migrada una sola vez a Firestore**; de ahí en adelante Firestore es la única fuente de verdad. Ítems que pueden ser "una cosa u otra" (receta con materia prima o componente, compra de materia prima o semielaborado, venta de producto/semielaborado/materia prima) usan el mismo patrón dual de campos opcionales mutuamente excluyentes en vez de un enum + unión de tipos — decisión consistente desde ADR-004.

Arquitectura: Estable.

Bloqueos: Ninguno.

## Nota de proceso — trabajo en paralelo entre IAs

A partir de esta versión, el proyecto se desarrolla con dos IAs en paralelo (Claude Code + Claude vía chat). Regla acordada: **dividir por módulo, nunca por capa** — cada IA trabaja en archivos que la otra no toca en la misma sesión. Los archivos compartidos entre casi todos los módulos (`rawMaterialInventoryService.ts`, `recipeStockService.ts`, `finishedGoodsInventoryService.ts`, `models/*`, `firestore.rules`) requieren coordinación explícita antes de tocarlos. Este archivo (`PROJECT_STATUS.md`) es la fuente de verdad compartida — actualizarlo después de cada bloque de trabajo cerrado, por cualquiera de las dos IAs.

Última actualización: 01/09/2026.