BP-012

Presentaciones Vendibles de Granola y Semielaborados con Inventario Propio

Versión: 1.0
Última actualización: 17/07/2026
Origen: Corrección solicitada por el CEO tras primera prueba en navegador de BP-011.

---

## Objetivo

1. Que Granola Tradicional se pueda vender en sus 3 presentaciones reales (50g, 200g, 400g), cada una con su propia ficha en Recetas mostrando la materia prima real que consume.
2. Que Granola y Honestly Peanut Butter, al ser usados dentro de otra receta (una barra), se traten como un insumo con inventario propio — no se desarmen en sus ingredientes cada vez.

## Alcance

Incluye:

- `Recipe.tracksInventory` + `currentStock`/`minimumStock`/`unit` propios (ver ADR-004, adenda).
- 3 nuevos `Product` + `Recipe`: `HG_T050`, `HG_T200`, `HG_T400`, con fórmula derivada proporcionalmente de `GRANOLA_BASE` (misma relación de ingredientes, escalada al tamaño del paquete).
- Alerta general en el Centro de Decisiones para semielaborados bajo mínimo (`getLowStockTrackedRecipes`), independiente de cualquier simulación — igual que ya existía para materia prima.
- Rediseño visual de las alertas: ícono por categoría + mensaje corto ("⚠️ No tienes suficiente Miel — faltan 3500.00 g."), en vez del texto largo anterior.
- Se quita la etiqueta "(producto intermedio)" de la vista de Recetas — un semielaborado se muestra igual que cualquier otro ingrediente.

No incluye (Backlog):

- Presentaciones de Honestly Peanut Butter — el CEO indicó que están "por definir". Se deja preparado (`tracksInventory: true`) para cuando se definan, siguiendo el mismo patrón de BP-012.
- Empaque "por docena" como variante de receta — es una unidad de venta (Ventas), no una composición distinta; una docena de Granola 400g son 12 unidades del mismo `HG_T400`.
- Unificar la fórmula base (`GRANOLA_BASE`, para uso interno en barras) con las fórmulas de las 3 presentaciones — hoy están separadas a propósito (Regla 80/20: evita re-arquitecturar el módulo de Producción real, que aún no existe, solo para eliminar una duplicación de datos). Queda anotado para cuando exista ese módulo.

## Reglas de negocio

- Un ingrediente de receta (`RecipeItem`) referencia una materia prima O una receta — nunca ambas (sin cambios, ADR-004).
- Si la receta referenciada tiene `tracksInventory: true`, el cálculo de necesidad se detiene ahí (verifica stock, no desarma).
- Las presentaciones de Granola (`HG_T050/200/400`) NO tienen `tracksInventory` — son productos finales vendibles, se calculan de punta a punta hasta materia prima real, como cualquier receta de un solo nivel.

## Estado

✅ Finalizado — 19/07/2026