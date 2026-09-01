# BP-045

Inventario: Ajuste Auditado y Stock Mínimo Editable

Versión: 1.0
Última actualización: 21/08/2026
Origen: revisión del CEO — el inventario no tenía forma de corregirse
manualmente con trazabilidad, y el stock mínimo no era editable desde la UI.

---

## Objetivo

A. Ajuste de inventario con auditoría completa: cualquier modificación manual
   queda registrada con motivo, nota y PIN de supervisor.
B. Stock mínimo editable directamente desde /inventory para materia prima.
C. Historial de ajustes en /adjustments con filtro de rango de fechas y CSV.

---

## Archivos nuevos

### `src/services/inventoryAdjustmentService.ts`
- Colección Firestore: `businesses/{id}/inventoryAdjustments`
- `verifyPin(pin)`: verifica el PIN de supervisor (por defecto "1234",
  configurable en la constante `SUPERVISOR_PIN` del archivo).
- `adjustRawMaterial / adjustSemiFinished / adjustFinished`: guardan el
  ajuste en Firestore y llaman a `setStock` del servicio correspondiente.
- `getAdjustments()`: devuelve todos los registros.

### `src/pages/AdjustmentLogPage.tsx`
- Ruta: `/adjustments`
- Selector de rango Desde/Hasta con atajos (Hoy, Esta semana, Este mes).
- Resumen: total ajustes, aumentos, reducciones.
- Detalle por registro con color verde (aumento) o rojo (reducción).
- Exportar CSV del rango seleccionado.

---

## Archivos modificados

### `src/services/rawMaterialInventoryService.ts`
- `setStock(id, newStock)`: ajuste directo de stock.
- `setMinimumStock(id, minimumStock)`: actualiza solo el stock mínimo.

### `src/services/recipeStockService.ts`
- `setStock(id, newStock)`: ajuste directo de stock de semielaborado.

### `src/services/finishedGoodsInventoryService.ts`
- `setStock(id, newStock)`: ajuste directo de stock de producto terminado.

### `src/pages/InventoryPage.tsx`
- Modal de ajuste: campo nuevo stock + motivo + nota + PIN.
- Stock mínimo editable inline por materia prima (botón "Editar" → campo
  + "Guardar" / "Cancelar").
- Producto terminado ahora desde Firestore (recetas sin tracksInventory).
- Enlace a /adjustments desde la cabecera de la página.

### `src/router/AppRouter.tsx`
- Ruta `/adjustments` → `AdjustmentLogPage` agregada.

---

## PIN de supervisor

Por defecto: `1234`. Cambiar en `inventoryAdjustmentService.ts` línea 16.
Backlog: mover a `configService` para que sea configurable desde /settings.

---

## Backlog explícito

- Pérdidas en $ (requiere costeo de productos — módulo futuro de PVP).
- PIN configurable desde /settings sin tocar código.
- Stock mínimo editable también para semielaborados y producto terminado
  desde la UI de inventario (hoy solo materia prima).

## Estado

✅ Cerrado — 21/08/2026