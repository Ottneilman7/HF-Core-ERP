# BP-021  Producción — Fase 2 (Confirmar producción real)

Versión: 1.0
Última actualización: 20/07/2026
Origen: BP-014 (dejó pendiente "confirmar producción" desde el inicio) y BP-019/ADR-006 (puente manual que esta entrega reemplaza).

---

## Objetivo

Que "Calcular" en `/production` deje de ser solo una simulación: agregar "Confirmar producción", que aplica de verdad el resultado — consume materia prima y semielaborados, y suma producto terminado o stock de semielaborado, según corresponda.

## Alcance (esta entrega)

- `services/recipeStockService.ts`: mismo patrón de `rawMaterialInventoryService` (ADR-005) aplicado a `Recipe.currentStock` (semielaborados con `tracksInventory`). `recipes.ts` sigue siendo semilla.
- `services/rawMaterialInventoryService.ts`: se agrega `consumeStock` (resta) junto a `receiveStock` (suma) ya existente — no se tocó nada de lo que ya funcionaba.
- `services/productionExecutionService.ts`: `confirmProduction(recipe, quantity)` — todo o nada (mismo patrón que Compras/Ventas): valida con el motor ya probado de `productionCalculatorService.calculateProductionNeeds` que todo alcanza, y si es así, descuenta cada insumo (materia prima o semielaborado, según `sourceType`) y suma el resultado:
  - a `finishedGoodsInventoryService` si `recipe.productId` existe (SKU vendible).
  - al propio stock del semielaborado (`recipeStockService`) si no tiene `productId` (ej. producir más Granola Base directamente).
- `pages/ProductionPage.tsx`: el cálculo ahora usa `recipeStockService.getEffectiveRecipes()` (antes usaba `recipes.ts` estático — no reflejaba producciones anteriores de semielaborados). Se agrega el botón "✔ Confirmar producción", visible solo cuando el cálculo no tiene faltantes.
- Pruebas: `recipeStockService.test.ts` (5 casos), `productionExecutionService.test.ts` (5 casos, incluyendo semielaborado, producto vendible, todo-o-nada, y acumulación de dos confirmaciones).

## Decisión de diseño

**No se creó ningún modelo nuevo tipo `ProductionOrder`/`ProductionLog`.** `confirmProduction` es una función que aplica un efecto (como `receivePurchaseOrder`), no crea un registro histórico propio en esta entrega — el historial de "qué se produjo cuándo" queda en Backlog si se necesita más adelante (auditoría, reportes). El 80/20 de "que el inventario quede correcto" no lo necesita todavía.

## ADR-006 — cerrado

El puente manual de `SalesPage.tsx` ("Registrar producción terminada") queda **obsoleto pero no se eliminó de esa página en esta entrega** — para no tocar código de Ventas ya cerrado y probado dentro de este Blueprint. Backlog: retirar esa sección de `SalesPage.tsx` en la próxima sesión que la toque (es una limpieza de bajo riesgo, no lógica).

## Fuera de alcance (Backlog explícito)

- Historial/bitácora de producciones confirmadas.
- Retirar la sección manual de inventario de `SalesPage.tsx` (ver arriba).
- Producción consolidada de varias líneas a la vez (`calculateProductionOrder` ya existe en el servicio pero `ProductionPage` solo maneja una receta a la vez — sin cambios en esta entrega).

## Checklist de cierre (Regla 20, TEAM_RULES)

- [X] Copiar `services/recipeStockService.ts` (+test), `services/productionExecutionService.ts` (+test), y reemplazar `services/rawMaterialInventoryService.ts` y `pages/ProductionPage.tsx` en el repo real.
- [X] `npx vitest run`.
- [X] Prueba en navegador: en `/purchases`, recibe suficiente materia prima para un lote de Granola Base o Peanut Butter → en `/production`, selecciona ese semielaborado, calcula, confirma → verifica que el stock de materia prima bajó y que ahora puedes producir una barra que lo use como componente.
- [X] Confirmación del CEO.
- [X] Commit + push.

## Estado

🟡 En desarrollo — código y pruebas listos, pendiente checklist arriba.

## Próximo paso natural

Con esto, el ciclo completo (Configurar → Catálogo → Comprar → Producir → Vender → Cobrar) queda **automático de punta a punta**, sin ningún paso manual. Candidatos igual de válidos para el próximo sprint: limpiar el puente manual de `SalesPage` (rápido), importar los clientes reales del Excel del CEO (mencionado en BP-019), o Marketing (Flujo 7, el último módulo del verdadero MVP que falta).

---

<!-- Pega este bloque al inicio de tu CHANGELOG.md real -->

## ENT-021 20/07/2026 — Compra de emergencia de semielaborados (ADR-007)

### Contexto

El CEO, probando el checklist de BP-021, compró por error 400g de "Mantequilla de Maní (DEPRECADA)" — expuso dos cosas: (1) el desplegable de Compras no filtraba materia prima inactiva, y (2) una necesidad real: poder comprar Granola/Peanut Butter ya hechas en una emergencia.

### Modificado

- models/PurchaseOrder.ts: `PurchaseOrderItem` ahora acepta `rawMaterialId` O `componentRecipeId` (mismo patrón dual que `RecipeItem`, ADR-004).
- services/purchaseService.ts: `createPurchaseOrder` valida que cada ítem tenga exactamente uno de los dos campos; `receivePurchaseOrder` distingue el tipo y aplica el efecto correcto (`rawMaterialInventoryService.receiveStock` o `recipeStockService.increaseStock`).
- services/purchaseService.test.ts: +3 casos (semielaborado de emergencia, validación de ítem inválido, validación de ítem con ambos campos).
- pages/PurchasesPage.tsx: selector "¿Qué estás comprando?" (Materia prima / Semielaborado ya hecho); el desplegable de materia prima ahora filtra `active: true` (corrige el bug original).
- ADR-007-CompraEmergenciaSemielaborados.md

### Dato a limpiar manualmente (no automatizado)

La compra de prueba de 400g de Mantequilla de Maní deprecada (id "3") quedó en `localStorage`, sin efecto real. Limpieza opcional vía consola del navegador (ver conversación de soporte).

### Pendiente antes de cerrar ENT-021

⚠️ Checklist de Regla 20: integrar al repo real (reemplaza `PurchaseOrder.ts`, `purchaseService.ts` + test, `PurchasesPage.tsx`), `npx vitest run`, prueba en navegador (comprar Peanut Butter como semielaborado de emergencia y confirmar que suma a su stock, no a materia prima), confirmación del CEO, commit + push.