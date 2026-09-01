# ADR-004

# Recetas Multinivel (Productos Intermedios como Ingrediente de otra Receta)

**Fecha:** 17/07/2026, a partir de la información real de negocio compartida por el CEO (documento Mayordomía + Excel de costos).

**Estado:** Aprobada. Pendiente de implementación (ver BP-011).

---

## Problema

El modelo `Recipe`/`RecipeItem` (BP-009) asume que toda receta se compone únicamente de materia prima directa (`RawMaterial`). La realidad del negocio de Honestly Foods no es así: una "Honestly Bar Classic" no se hace con avena y miel directamente — se hace con **Granola Base** (que a su vez es una receta con 7 ingredientes) y **Honestly Peanut Butter** (que a su vez es una receta con 3 ingredientes). Son productos intermedios: no se venden solos, pero tienen su propio BOM, su propio rendimiento por lote y, eventualmente, su propio costo.

Forzar esto en el modelo actual llevaría a "aplanar" manualmente las cantidades (por ejemplo, calcular a mano cuánta avena hay en 25g de Granola Base) cada vez que cambie la fórmula base — exactamente el tipo de trabajo manual y propenso a error que el ERP debe eliminar (PRODUCT_VISION.md).

## Decisión

1. **`RecipeItem` se extiende, no se reemplaza** (Regla 1, nunca perder trabajo existente): un ítem de receta ahora puede referenciar **una** de dos cosas, nunca ambas:
   - `rawMaterialId` → materia prima directa (comportamiento actual, sin cambios).
   - `componentRecipeId` → otra receta (producto intermedio).

2. **`Recipe` incorpora `isIntermediate: boolean`**. Una receta intermedia (ej. Granola Base) no requiere `productId`, porque no es un producto vendible por sí mismo — es un insumo interno de otras recetas.

3. **El cálculo de necesidad de materia prima (BP-010) se vuelve recursivo**: al pedir "necesito producir X barras Classic", el sistema debe expandir automáticamente Granola Base y Honestly Peanut Butter hasta llegar a materia prima real (avena, maní, aceite de coco, etc.), sumando cantidades cuando la misma materia prima aparece en más de una rama.

4. **Límite de profundidad de recursión (5 niveles)** como salvaguarda contra referencias circulares accidentales entre recetas.

## Consecuencias

- El servicio `productionCalculatorService` cambia de "sumar directo" a "resolver el árbol de la receta". La firma de `calculateProductionNeeds` gana un parámetro (`recipes`), ya disponible en los componentes que la consumen (`ProductionSimulator` ya recibe `recipes` como prop) — no rompe la integración de ENT-010.
- BP-009 queda vigente para el caso de una receta de un solo nivel (aún válido, ej. si una receta futura no tuviera productos intermedios), pero su modelo conceptual queda **extendido** por este ADR.
- Esto habilita naturalmente el costeo por receta en el futuro (Backlog): si cada nivel tiene su propio BOM, el costo de un producto final se puede derivar sumando el costo de sus componentes, sin recalcular todo a mano.

## Referencia

Entregable de origen: BP-011 (Recetas Multinivel y Catálogo Real de Productos).

---

## Adenda (17/07/2026) — Corrección tras prueba real en navegador

Al probar con datos reales, el CEO detectó que la resolución recursiva original desarmaba TODO hasta materia prima, incluso para semielaborados que en la vida real tienen su propio inventario (se producen en lote y se guardan en almacén: Granola, Honestly Peanut Butter). Eso generaba alertas ruidosas e inútiles al simular una barra (11 líneas de avena, coco, ajonjolí... en vez de una sola línea "falta Granola").

**Corrección:** se agrega `tracksInventory` a `Recipe`. Cuando una receta se usa como `componentRecipeId` dentro de otra Y tiene `tracksInventory: true`, el cálculo se detiene ahí — verifica el stock propio del semielaborado, no lo desarma. Solo se desarma hasta materia prima cuando se calcula la receta del semielaborado **directamente** (ej. planear cuánto fabricar de la presentación de Granola de 400g).

Esto también resuelve, de forma natural, el pedido del CEO de vender Granola y (en el futuro) Peanut Butter como productos propios en varias presentaciones: cada presentación es su propia receta con `productId`, con la fórmula derivada proporcionalmente de la receta base — ver BP-012.