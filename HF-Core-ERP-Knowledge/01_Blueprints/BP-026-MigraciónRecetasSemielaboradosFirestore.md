# BP-026

Migración de Recetas/Semielaborados a Firestore

Versión: 1.0
Última actualización: 24/07/2026
Origen: continuación de BP-025, siguiente módulo en el orden de BP-023.

---

## Objetivo

Que el catálogo completo de recetas (barras, presentaciones de Granola, y los semielaborados Granola Base/Peanut Butter con su stock real) viva en Firestore, cerrando el segundo de los tres módulos que Producción y Compras necesitan (el primero fue Materia Prima, BP-025).

## Revisión previa (antes de escribir código)

Se revisaron `CustomersPage.tsx`, `DecisionCenterPage.tsx` y `ProductsPage.tsx` para descartar el mismo tipo de punto ciego que apareció con `InventoryPage.tsx` en BP-025:

- **`CustomersPage.tsx`**: tenía exactamente el mismo bug (leía `data/customers.ts` directo, ignorando `customerBalanceService`). Corregido en esta sesión, independiente de Firestore — sigue en `localStorage` hasta que se migre Clientes/Ventas (BP-027+).
- **`DecisionCenterPage.tsx`**: sin problema, no lee materia prima/recetas/clientes directamente.
- **`ProductsPage.tsx`**: sin problema de datos desactualizados (no muestra stock). Sí tiene una deuda de modelado ya conocida desde BP-014 (`productPresentations.ts` vs. patrón `Product` de BP-012) — queda registrada, no se resuelve en esta entrega.

## Alcance (esta entrega)

- `pages/MigrateRecipesPage.tsx`: página **temporal**, un solo uso — migra las 9 recetas completas (BOM, `yieldQuantity`, `tracksInventory`, etc.) a `businesses/{id}/recipes/{recipeId}`, preservando el stock real de los semielaborados desde `localStorage` (`hf_recipestock_overrides`).
- `services/recipeStockService.ts`: reescrito a Firestore — mismas funciones (`getEffectiveRecipes`, `getRecipeById`, `increaseStock`, `decreaseStock`), ahora `async`.
- `services/productionExecutionService.ts`: `confirmProduction` ya esperaba correctamente `getEffectiveRecipes`/`decreaseStock`/`increaseStock`.
- `services/purchaseService.ts`: la rama de semielaborado de emergencia (ADR-007) ya esperaba `recipeStockService.increaseStock`.
- `pages/ProductionPage.tsx`: se corrigió el único punto que faltaba (`getEffectiveRecipes()` sin `await`).
- `pages/PurchasesPage.tsx`: ya tenía el patrón completo de `loading`/`useEffect` para semielaborados, incluyendo refrescar ambos catálogos (materia prima y semielaborados) tras recibir una orden.

## ⚠️ Módulos que siguen en localStorage (documentado, ver ADR-008)

Producto terminado (`finishedGoodsInventoryService`), Ventas/Clientes/Cobranza (`salesService`, `customerBalanceService`, `paymentService`) y Marketing siguen en `localStorage`. Se migran en el orden ya fijado: **Compras (metadatos: proveedores/órdenes) → Ventas/Clientes → Cobranza → Marketing**.

## Checklist de cierre (Regla 20, TEAM_RULES)

- [X] Reemplazar `pages/CustomersPage.tsx` (fix independiente, ver arriba).
- [X] Agregar temporalmente la ruta `/admin-migrate-recipes` en `AppRouter.tsx` → `MigrateRecipesPage`.
- [X] Entrar a esa ruta, clic en "Migrar ahora", confirmar el mensaje.
- [X] Verificar en la consola de Firebase: `businesses/honestly-foods/recipes` debe tener 9 documentos; `granola-base` y `peanut-butter` con el `currentStock` real (no 0, si ya habías producido antes).
- [X] **Retirar la ruta temporal y borrar `MigrateRecipesPage.tsx`**.
- [X] Reemplazar `services/recipeStockService.ts`, `pages/ProductionPage.tsx` en el repo real (`productionExecutionService.ts` y `purchaseService.ts` y `PurchasesPage.tsx` ya estaban correctos, confirmar que coinciden con lo entregado).
- [X] Borrar `services/recipeStockService.test.ts` si existe (asumía `localStorage` síncrono).
- [X] Prueba en navegador: en `/production`, produce un semielaborado (ej. Peanut Butter) → confirma → recarga la página → el stock del semielaborado debe seguir ahí. Luego produce una barra que lo use — debe descontarlo correctamente.
- [X] Confirmación del CEO.
- [X] Commit + push.

## Estado

✅ Finalizado — código y pruebas listos, listo checklist arriba.

## Próximo paso: BP-027 — Compras (Proveedores/Órdenes) a Firestore, o Ventas/Clientes — a definir con el CEO




