# BP-018  Compras (Proveedores, Órdenes de Compra, Recepción, Actualización de Costos)

Versión: 1.0
Última actualización: 19/07/2026
Origen: EL-Verdadero-MVP-EIF.md, Flujo 3 ("Abastecerse") — siguiente hueco real tras cerrar BP-016/BP-017 (ver AUDITORIA-MVP-EIF.md).

---

## Objetivo

Que el emprendedor pueda registrar a quién le compra, qué pidió y, al recibirlo, que el sistema actualice de verdad el stock y el costo de esa materia prima — sin editar código.

## Alcance (esta entrega)

- Modelos: `Supplier`, `PurchaseOrder` (con `PurchaseOrderItem[]`, estado `"ordered" | "received"`).
- `services/rawMaterialInventoryService.ts`: hace efectiva la materia prima real (semilla de `rawMaterials.ts` + overrides en `localStorage`) — ver ADR-005 para el detalle de la decisión de arquitectura.
- `services/purchaseService.ts`: proveedores, crear orden, recibir orden (recepción = efecto real sobre inventario, idempotente — recibir dos veces la misma orden no duplica stock).
- `pages/PurchasesPage.tsx` (ruta `/purchases`, reemplaza el `ComingSoonPage` actual): alta de proveedores, armar una orden con varios ítems, ver órdenes pendientes/recibidas, botón "Recibir".
- Pruebas: `rawMaterialInventoryService.test.ts` (5 casos) y `purchaseService.test.ts` (5 casos), ambas con `happy-dom` (mismo patrón validado por el CEO en BP-016).
- Construida directamente con `FormInput`/`FormSelect`/`FormButton` de BP-017 — nace ya con el estilo moderno, no hace falta un Blueprint de estilos aparte para Compras.

## Decisión de diseño

**Recibir actualiza el costo, no lo promedia.** Si el mismo proveedor (u otro) vende la misma materia prima más cara o más barata, `unitCost` pasa a ser el del pedido que se acaba de recibir. Costeo promedio ponderado queda registrado como mejora futura (Backlog) — el 80/20 de "saber cuánto me está costando ahora" no lo necesita todavía.

## ⚠️ Inconsistencia temporal — RESUELTA (adenda 19/07/2026)

ProductionPage.tsx migrado de import { rawMaterials } from "../data/rawMaterials" a getEffectiveRawMaterials() (llamada dentro de handleCalculate, no una vez al montar — así siempre lee el stock vigente, incluyendo lo recibido en Compras). Cambio de una línea de import + una constante local, sin tocar la lógica de productionCalculatorService.

ProductionSimulator.tsx no requirió cambio: ya recibía rawMaterials como prop — es responsabilidad de quien lo use (RecipesPage) decidir la fuente. Nota: /recipes no está registrada en el router desde BP-013, por lo que este componente hoy no es alcanzable desde la UI; no es código muerto, está inactivo a propósito (la fórmula no se expone al emprendedor).

## Fuera de alcance (Backlog explícito)

- Costeo promedio ponderado.
- Cotizaciones a proveedores antes de convertirse en orden (EL-Verdadero-MVP-EIF.md ya marca "Cotización" como opcional en el MVP).
- Edición/cancelación de una orden ya creada — hoy solo se puede crear y recibir.
- Migrar `ProductionPage` a leer del inventario real (ver arriba).

## Checklist de cierre (Regla 20, TEAM_RULES)

- [X] Copiar `models/Supplier.ts`, `models/PurchaseOrder.ts`, `services/rawMaterialInventoryService.ts` (+ test), `services/purchaseService.ts` (+ test), `pages/PurchasesPage.tsx` al repo real.
- [X] `npx vitest run`.
- [X] En `AppRouter.tsx`: reemplazar el `ComingSoonPage` de `/purchases` por `<PurchasesPage />` (mismo patrón que `/settings` en BP-016).
- [X] Prueba en navegador: crear proveedor → crear orden con la Avena (id "1") → "Recibir" → confirmar en consola/inspector que `localStorage["hf_rawmaterial_overrides"]` tiene la Avena en 17000 (12000 + 5000 de ejemplo).
- [X] Confirmación del CEO.
- [X] Commit + push.

## Estado

✅ Finalizado.

## Próximo paso natural

Con Compras resuelto, el siguiente hueco real del verdadero MVP es **Flujo 5: Vender** (Clientes ya existe desde ENT-008 — falta Venta/Factura e Inventario de producto terminado).