# ADR-007

# Compra de emergencia de semielaborados (Granola/Peanut Butter ya hechos)

**Fecha:** 20/07/2026, feedback del CEO tras probar BP-021.

**Estado:** Aprobada e implementada.

---

## Problema

El CEO detectó que, en la vida real, aunque Honestly Foods normalmente fabrica su propia Granola y Mantequilla de Maní, podría necesitar comprarlas ya hechas a un tercero en una emergencia (ej. falla de producción propia, pico de demanda). El sistema, tal como quedó en BP-018/BP-021, solo permitía comprar materia prima — no había forma de que una compra sumara directamente al stock de un semielaborado (`Recipe.currentStock`).

## Decisión

Se extiende `PurchaseOrderItem` (BP-018) con el mismo patrón dual que ya usa `RecipeItem` (BP-011/ADR-004): un ítem de compra referencia **una** de dos cosas, nunca ambas:

- `rawMaterialId` → materia prima directa (comportamiento sin cambios).
- `componentRecipeId` → un semielaborado (`Recipe` con `tracksInventory: true`) comprado ya hecho.

`purchaseService.receivePurchaseOrder` distingue el tipo y aplica el efecto correspondiente: `rawMaterialInventoryService.receiveStock` (con actualización de costo) o `recipeStockService.increaseStock` (sin costo — `Recipe.ts` no modela costo propio todavía, ver Backlog).

`createPurchaseOrder` valida que cada ítem tenga exactamente uno de los dos campos — rechaza órdenes con ambos o ninguno.

En `PurchasesPage.tsx`, se agrega un selector "¿Qué estás comprando?" (Materia prima / Semielaborado ya hecho), con una advertencia visible de que es un uso excepcional — para que nadie lo use por default en vez de fabricar en `/production`.

## Consecuencias

- **Backlog:** `Recipe.ts` no tiene campo de costo propio. Si se compra un semielaborado ya hecho, hoy no se actualiza ningún costo de ese semielaborado (a diferencia de materia prima). Cuando se aborde costeo por receta (mencionado como habilitado a futuro en ADR-004), esto debería resolverse en conjunto.
- El desplegable de materia prima ahora filtra `active: true` — corrige, de paso, el bug que originó esta conversación (se podía comprar por error la Mantequilla de Maní deprecada, id "3").

## Referencia

Extiende BP-018 (Compras) y BP-021 (Producción Fase 2).