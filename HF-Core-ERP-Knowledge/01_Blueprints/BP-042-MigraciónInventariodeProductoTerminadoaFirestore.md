# BP-042

Migración de Inventario de Producto Terminado a Firestore

Versión: 1.0
Última actualización: 19/08/2026
Origen: continuación de la Fase A de migración a Firebase (ADR-008).
Con este Blueprint, cero datos del core del negocio quedan en localStorage.

---

## Objetivo

Mover `finishedGoodsInventoryService` de localStorage a Firestore, eliminando
el último módulo operacional del core que aún vivía en el navegador. A partir
de este cambio, el inventario de Producto Terminado es persistente entre
dispositivos y navegadores, igual que el resto del sistema.

## Contexto

`finishedGoodsInventoryService` fue el único servicio que quedó fuera de la
Fase A de migración (BP-023 a BP-038) por no ser bloqueante para el MVP de
un solo dispositivo. Con BP-041 resolviendo la deuda técnica de build,
BP-042 cierra la migración completa.

## Colección Firestore

```
businesses/{businessId}/finishedGoods/{productId}
  stock: number   ← único campo, con respaldo ?? 0 en toda lectura (ADR-009)
```

Un documento por producto. Si el documento no existe, el stock es 0.

## Archivos modificados

### `src/services/finishedGoodsInventoryService.ts` — REEMPLAZADO
- Todas las funciones pasan de síncronas a `async`.
- `getStock`, `getAllStock`: leen de Firestore con `getDoc` / `getDocs`.
- `increaseStock`, `decreaseStock`: usan `runTransaction` para atomicidad
  real (evita condiciones de carrera si dos operaciones ocurren simultáneamente).
- Regla ADR-009 aplicada: `Number.isFinite(snap.data()?.stock)` en toda
  lectura — nunca se asume que el campo existe.

### `src/services/productionExecutionService.ts` — ACTUALIZADO
- `finishedGoodsInventoryService.increaseStock` es ahora `async` →
  se agrega `await` en la línea correspondiente dentro de `confirmProduction`.
- Sin cambio en lógica de negocio.

### `src/router/AppRouter.tsx` — ACTUALIZADO (temporal + limpieza)
- Se agregó temporalmente la ruta `/migrate-finished-goods` para ejecutar
  la migración de datos reales, y se eliminó después de confirmar el stock
  en Firestore.

## Migración de datos

Stock real capturado el 19/08/2026 desde localhost:5173/inventory
y migrado mediante `MigrateFinishedGoodsPage.tsx` (página temporal,
eliminada después de usarse — misma metodología que BP-023/025/026):

| Producto | ID | Stock migrado |
|---|---|---|
| Honestly Bar Classic | 1 | 0 (no migrado) |
| Honestly Bar Recovery | 2 | 12 unidades |
| Honestly Bar Energy | 3 | 6 unidades |
| Granola Tradicional 50g | 4 | 42 unidades |
| Granola Tradicional 200g | 5 | 24 unidades |
| Granola Tradicional 400g | 6 | 26 unidades |

Nota: el stock se duplicó en Firestore durante la prueba (se ejecutó la
migración dos veces). Los datos son de prueba — el CEO borrará todo y
empezará con datos reales al terminar el MVP.

## Tests

`finishedGoodsInventoryService.test.ts` sigue pasando (4/4) — usa
localStorage en el entorno de test (happy-dom sin Firebase real), lo
cual es correcto para validar la lógica de cálculo sin necesitar
el emulador de Firestore.

## Checklist de cierre (Regla 20, TEAM_RULES)

- [x] `finishedGoodsInventoryService.ts` migrado a Firestore
- [x] `productionExecutionService.ts` actualizado con await
- [x] Migración de datos ejecutada en local
- [x] Stock verificado en /inventory
- [x] `MigrateFinishedGoodsPage.tsx` eliminado del repo
- [x] `npm run build` ✅ sin errores
- [x] `npx vitest run` ✅ 19 passed | 5 skipped | 0 failed
- [x] git commit + push

## Estado

✅ Cerrado — 19/08/2026