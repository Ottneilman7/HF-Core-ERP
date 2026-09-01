# BP-011 Recetas Multinivel y Catálogo Real de Productos (Honestly Foods)

Versión: 1.0
Última actualización: 17/07/2026
Origen: Información real de negocio suministrada por el CEO (Mayordomía_Negocios_y_Proyectos.md + BOM_HonestlyFoods.xlsx), previa al desarrollo del ERP y usada ahora para reemplazar los datos genéricos de MVP.

---

## Objetivo

Reemplazar los datos de ejemplo del MVP (pensados para "cualquier startup") por el catálogo, las recetas y los costos reales de Honestly Foods, e implementar la capacidad de que una receta use **otra receta** como ingrediente (producto intermedio) — ver ADR-004.

## Alcance

Incluye:

- Extensión de `RecipeItem` (`rawMaterialId` | `componentRecipeId`) y `Recipe` (`isIntermediate`) — ADR-004.
- Servicio de resolución recursiva de materia prima (`resolveRawMaterialRequirements`), integrado de forma no disruptiva en `calculateProductionNeeds` (BP-010).
- Catálogo real de materias primas con costo unitario ($/g, derivado del promedio de proveedores en el Excel).
- Dos recetas intermedias reales: **Granola Base Honestly** y **Honestly Peanut Butter**.
- Tres recetas finales reales (barras de 50g): **HB_C1 (Classic)**, **HB_R1 (Recovery)**, **HB_E1 (Energy)**, con las cantidades corregidas por el CEO.
- Código de producto (SKU) real: se agrega el campo `code` a `Product`, poblado con los SKU ya decididos por el negocio (`HB_C1`, `HB_R1`, `HB_E1`).

No incluye (Backlog explícito, Regla 8 TEAM_RULES):

- BOM detallado de los Fruit Rolls (el documento de origen no da porcentajes por unidad, solo estimados de compra para la prueba piloto) — `Fruit Roll` se carga como materia prima con `unitCost: 0` y una nota `⚠️ PENDIENTE`, hasta que exista ese Blueprint.
- SKUs de empaque (Pack x3, Pack x6) como registros separados — son la misma receta empacada distinto; se registra en Backlog.
- Costeo automático por receta (aunque esta arquitectura lo habilita, calcular y mostrar costo por barra queda para un entregable propio).
- Carga de `currentStock` real de las materias primas nuevas — se cargan en `0` con `minimumStock` estimado, marcadas como placeholder; el CEO debe ajustarlas desde la app una vez esté desplegada (tal como se pidió: "eso se puede ingresar luego con la app ya desarrollada").

## Modelo conceptual

```
Recipe (Granola Base)          Recipe (Honestly Peanut Butter)
  isIntermediate: true            isIntermediate: true
  items: [RawMaterial x7]         items: [RawMaterial x3]
        \\                              /
         \\                            /
          Recipe (HB_C1 — Classic, 50g)
            isIntermediate: false
            productId: -> Product { code: "HB_C1" }
            items: [
              componentRecipeId: GranolaBase   25g
              componentRecipeId: PeanutButter  12g
              rawMaterialId: Miel               8g
              rawMaterialId: FruitRoll          5g
            ]
```

## Datos cargados (fuente: FUENTE_REAL_RECETAS_Y_COSTOS.md)

### Materias primas (unitCost en $/gramo, promedio de proveedores)

| Materia prima | unitCost ($/g) | Estado stock |
|---|---|---|
| Avena en hojuelas | 0.00222 | Real (ya cargado, 12000g) |
| Coco seco fileteado | 0.00095 | Placeholder (0g) |
| Maní natural sin sal | 0.00500 | Placeholder (0g) |
| Ajonjolí | 0.00567 | Placeholder (0g) |
| Uvas pasas | 0.00755 | Placeholder (0g) |
| Papelón | 0.00128 | Placeholder (0g) |
| Sal fina | 0.00150 | Placeholder (0g) |
| Miel de abeja | 0.01000 | Real (ya cargado, 500g) |
| Aceite de coco | 0.01235 | Placeholder (0g) |
| Chía | 0.01383 | Placeholder (0g) |
| Almendra fileteada | 0.02300 | Placeholder (0g) |
| Chocolate oscuro 70% | 0.01867 | Placeholder (0g) |
| Fruit Roll (tiras) | 0 ⚠️ pendiente | Placeholder (0g) |

⚠️ **Nota:** el registro anterior de `RawMaterial` id "3" (Mantequilla de Maní) queda **deprecado** (`active: false`) — pasa a ser la receta intermedia "Honestly Peanut Butter", no una materia prima directa. Es exactamente el tipo de corrección que este Blueprint existe para documentar (Regla de Oro, START_HERE.md).

### Recetas reales (versión 1, corregidas por el CEO)

- **Granola Base Honestly** — rinde 3200g: Avena 1600g, Coco 500g, Maní 300g, Ajonjolí 200g, Uvas pasas 200g, Fruit Roll (tiras) 200g, Papelón 1500g, Sal 15g.
- **Honestly Peanut Butter** — rinde 100g: Maní 90g, Aceite de coco 8g, Sal 2g.
- **HB_C1 (Classic, 50g):** Granola Base 25g + Peanut Butter 12g + Miel 8g + Fruit Roll 5g.
- **HB_R1 (Recovery, 50g):** Granola Base 22g + Almendra 5g + Chía 3g + Peanut Butter 12g + Miel 8g.
- **HB_E1 (Energy, 50g):** Granola Base 21g + Fruit Roll 5g + Peanut Butter 10g + Miel 7g + Chocolate 70% 7g.

## Dependencias

- ADR-004 (recetas multinivel).
- BP-005 (Materia Prima) — se actualiza con el catálogo real y costos.
- BP-009 (Recetas) — el modelo conceptual de un nivel sigue vigente y compatible; este Blueprint lo extiende.
- BP-010 (Cálculo de Materia Prima) — el servicio se vuelve recursivo sin romper la integración ya construida.

## Estado

✅ Finalizado — 19/07/2026