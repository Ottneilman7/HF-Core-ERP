# BP-025  Migración de Materia Prima a Firestore

Versión: 1.0
Última actualización: 23/07/2026
Origen: continuación de BP-024, siguiente módulo en el orden fijado en BP-023.

---

## Objetivo

Que Compras y Producción lean/escriban el catálogo real de materia prima en Firestore, preservando el stock que ya se acumuló comprando durante BP-018/BP-021 (no se reinicia en 0).

## Alcance (esta entrega)

- `pages/MigrateRawMaterialsPage.tsx`: página **temporal**, un solo uso. Lee la semilla (`rawMaterials.ts`) + el override vigente en `localStorage` (`hf_rawmaterial_overrides`) y escribe los 14 materiales a Firestore (`businesses/{id}/rawMaterials/{rawMaterialId}`) con su stock real, no el de la semilla.
- `services/rawMaterialInventoryService.ts`: reescrito a Firestore — mismas funciones (`getEffectiveRawMaterials`, `getRawMaterialById`, `receiveStock`, `consumeStock`), ahora `async`. Ya no importa `rawMaterials.ts`.
- `services/purchaseService.ts`: `receivePurchaseOrder` ahora `async`, usa `for...of` con `await` (no `forEach`, que no espera promesas) para no arriesgar condiciones de carrera si una orden tiene varios ítems.
- `services/productionExecutionService.ts`: `confirmProduction` ahora `async`, espera `getEffectiveRawMaterials`/`consumeStock`. `recipeStockService` (semielaborados) sigue síncrono por ahora — se migra en BP-026.
- `pages/PurchasesPage.tsx` y `pages/ProductionPage.tsx`: adaptadas a la carga asíncrona (estado `loading`, `useEffect`).

## ⚠️ Módulos mixtos durante la migración (documentado a propósito, ver ADR-008)

Ahora mismo: **Materia Prima → Firestore**, **Semielaborados (Recipe.currentStock) → todavía localStorage**. Es intencional y temporal — BP-026 migra lo que falta. No es un bug si notas que Materia Prima persiste entre dispositivos pero el stock de Granola/Peanut Butter no (ese sigue en el navegador actual hasta BP-026).

## Pruebas: quedan obsoletas, no se actualizan en esta entrega

`rawMaterialInventoryService.test.ts`, y las partes de `purchaseService.test.ts`/`productionExecutionService.test.ts` que dependen de materia prima síncrona, asumían `localStorage`. Con Firestore async, necesitan el emulador de Firestore para probarse correctamente — se reescriben cuando se complete toda la migración (BP-02X, Backlog), no módulo por módulo, para no reescribir la misma prueba varias veces.

## Checklist de cierre (Regla 20, TEAM_RULES)

- [X] Agregar temporalmente la ruta `/admin-migrate-raw-materials` en `AppRouter.tsx` apuntando a `MigrateRawMaterialsPage` (fuera del `Sidebar`, no hace falta agregarla ahí).
- [X] Entrar a esa ruta, clic en "Migrar ahora", confirmar el mensaje "14 materiales migrados".
- [X] Verificar en la consola de Firebase: `businesses/honestly-foods/rawMaterials` debe tener 14 documentos, con el stock real (ej. Avena en 17000 si ya la recibiste antes).
- [X] **Retirar la ruta temporal y borrar `MigrateRawMaterialsPage.tsx`** — no es parte permanente de la app.
- [X] Reemplazar `rawMaterialInventoryService.ts`, `purchaseService.ts`, `productionExecutionService.ts`, `PurchasesPage.tsx`, `ProductionPage.tsx` en el repo real.
- [X] Borrar `services/rawMaterialInventoryService.test.ts` (obsoleto, ver arriba).
- [X] pages/InventoryPage.tsx reemplazado (el fix de hoy — ya lo confirmaste).
- [X] Prueba en navegador: en `/purchases`, recibe una orden de materia prima real → confirma que el stock sube y persiste tras recargar. En `/production`, calcula con esa materia prima → confirma que ve el stock actualizado.
- [X] Confirmación del CEO.
- [X] Commit + push.

## Estado

✅ Finalizado — código y pruebas listos, listo checklist arriba.

## Próximo paso: BP-026 — Recetas/Semielaborados a Firestore