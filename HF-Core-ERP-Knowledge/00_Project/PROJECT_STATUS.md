# Proyecto HF Core ERP

Versión 2.2 — 03/09/2026

Sprint actual: Ninguno abierto — MVP de los 8 flujos completo. Módulo de Costeo y Precios (BP-050, sugerido — confirmar numeración real con Claude Code) recién construido y en validación con datos reales del negocio.

Estado MVP: 🟢 Completo (uso interno, single-tenant) — 🟡 Requiere Fase 2 (roles/aislamiento) antes de multiusuario, y Cuentas por Pagar a proveedores antes de darse por "cerrado" para uso propio.

---

## Resumen ejecutivo

Los 8 flujos originales siguen completos y 100% en Firestore (ver v2.1 para el detalle). Desde esa versión se construyó de cero el **Módulo de Costeo y Precios** (ver sección dedicada abajo) y se cerró un hueco de seguridad real: **el stock mínimo y el costo unitario se podían editar sin ningún control**, a diferencia del stock físico, que sí requería PIN de supervisor desde BP-045.

---

## Qué está migrado a Firestore (y qué no)

Sin cambios respecto a v2.1 — los 8 flujos + Producto Terminado + Marketing siguen 100% en Firestore. Ningún servicio de persistencia sigue en localStorage.

## Blueprints finalizados

BP-001 a BP-049 completos (ver v2.1 y `docs/blueprints/` para el detalle). Nuevo desde esta versión:

- **BP-050 (sugerido)** — Módulo de Costeo y Precios: modelo de datos (`CostingSettings` en `BusinessParameters`, campos de precios en `Recipe`), motor de cálculo (`pricingService.ts`, 2 métodos de prorrateo + margen real + punto de equilibrio), ficha de configuración en Settings, y simulador interactivo (`/settings/pricing`) con gráficas de Recharts (donut de distribución de CIF, punto de equilibrio).
- **BP-051 (sugerido)** — Herramienta de desglose de costo (`buildCostBreakdown`) para auditar de dónde sale el costo de materia prima de cada receta, línea por línea y recursivo (soporta semielaborados anidados).
- **BP-052 (sugerido)** — Seguridad: PIN de supervisor + registro auditado extendido a stock mínimo y costo unitario (antes solo cubría cantidad de stock). Se agregó edición de costo unitario sin afectar stock (`setUnitCost`), y stock mínimo completo para Semielaborados y Producto Terminado (antes no existía para Producto Terminado, y en Semielaborados solo se mostraba sin poder editarse).

*(Los números BP-050 a BP-052 son sugeridos por Claude — confírmalos o corrígelos con la numeración real que use Claude Code, para no chocar con trabajo hecho en paralelo.)*

## Auditoría de arquitectura y seguridad (actualizado 03/09/2026)

| Hallazgo | Severidad | Estado |
|---|---|---|
| PIN de supervisor hardcodeado en texto plano en el repo público | 🔴 Crítico | ✅ Resuelto (v2.1) |
| `confirmProduction` no era atómico | 🔴 Crítico | ✅ Resuelto (v2.1) |
| `rawMaterialInventoryService`/`recipeStockService` sin transacciones | 🔴 Crítico | ✅ Resuelto (v2.1) |
| **Stock mínimo y costo unitario editables sin PIN ni auditoría** | 🔴 Crítico | ✅ **Resuelto (v2.2)** — ahora usan el mismo modal de PIN + motivo + registro auditado que ya protegía el stock físico |
| Reglas de Firestore sin aislamiento por `businessId` ni por rol | 🟡 Importante | ⏳ Pendiente — Fase 2 |
| Sin modelo de roles/permisos de usuario | 🟡 Importante | ⏳ Pendiente — Fase 2 |
| Cobertura de tests baja en servicios financieros | 🟡 Importante | ⏳ Pendiente |

## Módulo de Costeo y Precios (nuevo, 03/09/2026)

Construido en 4 partes + 2 correcciones, con la metodología desarrollada por el CEO junto a un CFO externo (documento: `HF-Core-ERP-Knowledge/99_Archive/metodologia_calculo_precios_y_finanzas.md` + especificación técnica del CFO).

**Qué incluye:**
- Ficha de Configuración (Settings → 💰 Costeo y Precios): ROI (equipos + herramientas + plazo de retorno), CIF (mano de obra, servicios, alquiler, costos personalizados), Marketing — todo mensual, con vista previa en vivo del total.
- Motor de cálculo (`src/services/pricingService.ts`, 10 tests unitarios pasando): costo de materia prima recursivo (soporta recetas que usan semielaborados como ingrediente), **2 métodos de prorrateo de costos fijos** (por participación en materia prima — default; y ABC por tiempo de manufactura — para casos como repostería decorada), precio sugerido usando **margen real** (no markup — precio = costo / (1 - margen)), y punto de equilibrio combinado multi-producto.
- Simulador interactivo (`/settings/pricing`): tabla editable por producto (producción estimada, margen, precio), gráfica de dona (distribución de CIF entre productos) y gráfica de punto de equilibrio (Recharts), ambas en vivo mientras se ajustan los números.
- **Herramienta de desglose** ("Ver desglose" en cada fila del simulador): muestra cada ingrediente de la receta con su costo, ordenado de mayor a menor, recursivo para semielaborados — pensada para auditar de dónde sale un costo que "no cuadra".

**Hallazgo real durante la validación con datos reales:** se usó la herramienta de desglose para investigar un costo de `HB_R1` (Honestly Bar Recovery) que salía en ~$150+/unidad — se encontró que **Almendra fileteada y Chía tenían el costo unitario cargado mal** (ej. $24/gramo en vez de $24 por el paquete completo). Esto expuso que el sistema no tenía forma de corregir un costo sin registrar una compra falsa — se resolvió agregando edición directa de costo unitario (protegida con PIN, ver sección de seguridad arriba). **Pendiente para el CEO:** terminar de revisar el costo de cada materia prima buscando errores similares (cualquier ingrediente común por encima de ~$1/gramo es sospechoso).

## Backlog explícito (fuera del MVP, registrado a propósito)

- ~~Módulo de cálculo de costo y precio de venta~~ ✅ Hecho (ver arriba) — pendiente solo que el CEO termine de auditar/corregir los costos de materia prima existentes.
- **Cuentas por Pagar a proveedores** (asignado a Claude Code, aún no iniciado) — hoy solo se registra si una compra fue contado/crédito, sin saldo ni módulo de pagos a proveedores.
- Conectar Firebase Storage para comprobantes de pago (pospuesto por costo).
- Rediseño de Granola a granel + empaque por demanda — pendiente de decisión de negocio.
- Dashboard con gráficas generales (ventas por periodo, clientes nuevos por mes) — el simulador de precios ya usa Recharts, se puede reusar el patrón.
- Importar catálogo real de clientes desde Excel del CEO.
- Pruebas automatizadas contra el emulador de Firestore.
- Fase 2 (reglas de Firestore con aislamiento por `businessId` + roles dueño/ventas/producción) y Fase B (multiusuario/multi-negocio SaaS) — estrategia acordada: completar backlog de uso propio primero, probar ~1 semana, luego evaluar Fase B solo si no genera costos nuevos en Firebase.

## Nota de proceso — trabajo en paralelo entre IAs

Sin cambios respecto a v2.1: dividir por módulo, nunca por capa; archivos compartidos (`rawMaterialInventoryService.ts`, `recipeStockService.ts`, `finishedGoodsInventoryService.ts`, `inventoryAdjustmentService.ts`, `models/*`, `firestore.rules`) requieren coordinación explícita. **Nota nueva:** `inventoryAdjustmentService.ts` y `InventoryPage.tsx` se tocaron a fondo en esta sesión (v2.2) — si Claude Code tenía trabajo en curso sobre esos archivos, revisar conflictos antes de continuar.

Última actualización: 03/09/2026.