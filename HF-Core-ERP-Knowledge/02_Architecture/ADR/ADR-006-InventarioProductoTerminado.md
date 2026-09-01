# ADR-006

# Inventario de Producto Terminado — puente manual mientras no existe Producción Fase 2

**Fecha:** 19/07/2026, durante ENT-018 (BP-019 Ventas).

**Estado:** Aprobada e implementada (puente temporal, con criterio explícito de reemplazo).

---

## Problema

`Product.ts` nunca tuvo campo de stock (a diferencia de `RawMaterial`). Además, `ProductionPage` (BP-014) siempre fue una calculadora — "cuánto necesito sacar de almacén" — nunca llegó a ejecutar la Fase 2 que el propio BP-014 dejó pendiente: "confirmar producción" (descontar materia prima real y sumar producto terminado real). Esa Fase 2 requería la decisión de persistencia que en su momento no existía.

Ventas (BP-019, Flujo 5) necesita que exista inventario real de producto terminado para poder vender algo — sin esto, cualquier venta sería sobre un número inventado.

## Decisión

1. **`finishedGoodsInventoryService.ts`** nace con `getStock`, `increaseStock`, `decreaseStock`, sobre `localStorage`, arrancando en 0 para todo producto (no hay semilla — a diferencia de materia prima, aquí no había ningún valor de partida documentado).
2. **Puente manual en `SalesPage.tsx`:** una sección "Registrar producción terminada" donde el emprendedor anota manualmente cuánto fabricó, hasta que exista la automatización real.
3. **Criterio explícito de reemplazo:** cuando se construya la Fase 2 de BP-014 (confirmar producción desde `/production`), esa funcionalidad llamará a `finishedGoodsInventoryService.increaseStock()` — la misma función, sin cambios — y a `rawMaterialInventoryService` para descontar materia prima consumida. En ese momento, la sección manual de `SalesPage` se retira (queda marcado en el Backlog de BP-019).

## Consecuencias

- Ventas queda operativo hoy sin esperar a que se resuelva Producción Fase 2 — decisión consciente de secuencia (Regla 8: MVP tiene prioridad; entregar valor incremental).
- El registro manual de producción terminada es honesto pero manual — no descuenta materia prima automáticamente al "registrar producción terminada" en Ventas. Es una limitación aceptada: sirve para tener algo que vender, no reemplaza el cálculo/consumo real de BP-010/011.
- Backlog directo: Producción Fase 2 (BP-014) pasa a ser el siguiente candidato de mayor valor tras Ventas, porque cierra este puente y conecta automáticamente Producción → Inventario → Ventas.

## Referencia

Entregable de origen: BP-019 (Ventas).