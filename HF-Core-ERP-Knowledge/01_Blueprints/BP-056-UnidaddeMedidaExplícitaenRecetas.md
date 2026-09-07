# BP-056 — Unidad de Medida Explícita en Recetas (Por Unidad vs A Granel)

## Objetivo
Corregir un error de captura real (detectado por el CEO al usar la ficha de BP-055): el campo único "Cantidad esperada + Unidad" no distinguía entre "cuánto pesa la mezcla de ingredientes" y "en qué unidad se cuenta el stock final", lo que llevó a configurar una barra de 50g como "rendimiento = 50 Gramos" en vez de "rendimiento = 1 Barra 50gr", y a que Producción contara gramos en vez de barras.

## Alcance
- La ficha pregunta explícitamente **"¿Cómo se cuenta el stock de este producto?"** con dos caminos, solo para Producto Terminado (no aplica a reventa ni a semielaborado):
  - **Por unidad**: los ingredientes listados producen exactamente 1 unidad; solo se pide el nombre de esa unidad (ej. "Barra 50gr"). `yieldQuantity` queda forzado a `1`, no editable.
  - **A granel**: comportamiento anterior, cantidad numérica + unidad elegida de una lista cerrada (Gramos/Kilogramos/Mililitros/Litros) en vez de texto libre.
- Semielaborado sigue forzado a "a granel" siempre — no tiene sentido como unidad discreta.
- Al editar una receta ya existente, el tipo se infiere: `yieldQuantity === 1` → "por unidad"; cualquier otro valor → "a granel".

## Responsabilidades
- `pages/RecipeConfigPage.tsx`: nuevo estado local `measurementType: "discrete" | "bulk"` (no se guarda tal cual en Firestore, es solo de la UI — lo que se guarda sigue siendo `yieldQuantity`/`yieldUnit`, ahora garantizados consistentes).

## Modelo conceptual
No hay cambios en `Recipe` — `yieldQuantity`/`yieldUnit` ya existían. El cambio es enteramente de UX: la ficha ahora hace imposible guardar la combinación confusa (cantidad ≠ 1 con una unidad que en realidad describe una unidad discreta).

## Reglas de negocio
- "Por unidad" + Producto Terminado → `yieldQuantity` se guarda como `1` sin importar lo que el usuario intente escribir (el campo ni siquiera es editable en ese modo).
- "A granel" → unidad restringida a una lista cerrada (antes era texto libre, lo que también permitía inconsistencias como "gramos" vs "Gramos").
- Producción no cambió su lógica de escalado (`cantidad a producir ÷ yieldQuantity × cada ingrediente`) — el bug era de configuración de datos, no de cálculo.

## Dependencias
- Depende directamente de BP-055 (la ficha que introdujo el flujo completo de creación de producto).

## Fuera del alcance del MVP
- Conversión automática entre unidades (ej. de Kilogramos a Gramos) — hoy se elige una sola unidad y se usa consistentemente.

## Evolución futura
Si se necesitan más unidades a granel (ej. onzas, para negocios que compren en el sistema imperial), `BULK_UNITS` es un array de una línea para extender.

## Estado
✅ Finalizado — probado recreando el producto que había fallado, confirmando que 750 unidades del ingrediente correcto generan 15 unidades del producto, no 750.

## Historial
- 06/09/2026 — Implementado tras reporte de bug real del CEO usando la ficha de BP-055 por primera vez.