# BP-005 Materia Prima (Raw Material Master)

Versión: 1.0 (reconstruida)

Última actualización: 17/07/2026

⚠️ **Nota de origen:** Este Blueprint no fue recibido como documento independiente entre los archivos del repositorio de conocimiento, aunque PROJECT_STATUS.md lo lista como finalizado y BP-009 lo referencia como dependencia directa (RecipeItem.rawMaterialId). Se reconstruye a partir de las referencias cruzadas en BP-007, BP-008, BP-009 y ADR-003. **Debe ser validado por el CEO/CTO contra el código real de `RawMaterial.ts` antes de darse por definitivo.**

---

## Objetivo

Que el ERP conozca el catálogo de materias primas del negocio, como base para Recetas (BP-009), Producción y, en el futuro, Compras e Inventario.

## Alcance (inferido, a confirmar)

Incluye:

- Modelo `RawMaterial` con identificador interno (`id`) que nunca cambia, independiente del nombre visible (mismo principio que Product y Customer).
- Unidad principal de registro por materia prima (`unit`), distinta de la unidad que puede usarse dentro de una receta específica (ver BP-009).
- Codificación configurable (`code`), siguiendo Regla 13 de TEAM_RULES.

No incluye (confirmado explícitamente por BP-009 como "fuera del alcance"):

- Campo `criticality` (materia prima crítica por tiempo de reabastecimiento) — decisión explícita de no implementarlo aún.
- Conversión automática de unidades.
- Control de stock por lote/vencimiento.

## Modelo conceptual (a confirmar contra el código)

```
RawMaterial
├── id: string
├── code: string
├── name: string
├── unit: string
├── currentStock: number   ⚠️ ASUMIDO — necesario para ENT-010, confirmar nombre real del campo
└── active: boolean
```

## Reglas de negocio

- Las materias primas se referencian por `id`, nunca por nombre (mismo principio de Product y Customer).
- El ERP se adapta a la codificación del negocio, no al revés (Regla 13).

## Dependencias

- ADR-001 (arquitectura modular por dominio).
- Es dependencia directa de BP-009 (Recipe.items[].rawMaterialId) y de BP-010 (cálculo de necesidad de materia prima).

## Estado

🟡 Reconstruido documentalmente. Pendiente de confirmación del CEO/CTO sobre:
1. Nombre exacto del campo de stock actual en el código (`currentStock`, `stock`, `quantity`, etc.).
2. Si existen campos adicionales no contemplados aquí.

✅ Finalizado. Verificado en navegador (resultado exacto esperado) y confirmado git commit + push por el CEO el 17/07/2026.
---  

Versión: 2.0 (confirmada contra código real)

Última actualización: 17/07/2026


Objetivo

Que el ERP conozca el catálogo de materias primas del negocio, como base para Recetas (BP-009), Producción y, en el futuro, Compras e Inventario.

Modelo real (confirmado, src/models/RawMaterial.ts)

typescriptexport interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  supplier: string;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  active: boolean;
}

Hallazgo — campo no documentado

minimumStock ya existe en el modelo real y no estaba registrado en ningún Blueprint. No debe confundirse con criticality (BP-009, explícitamente fuera de alcance — se refiere a tiempo de reabastecimiento, no a un umbral de cantidad). minimumStock es simplemente el punto bajo el cual la materia prima se considera crítica por cantidad, y ya se usa en BP-010 (ver ese Blueprint) para generar alertas preventivas.

Reglas de negocio


Las materias primas se referencian por id, nunca por nombre (mismo principio de Product y Customer).
El ERP se adapta a la codificación del negocio, no al revés (Regla 13).
unit es texto libre descriptivo (ej. "Gramos"), mientras que RecipeItem.unit usa abreviaturas (ej. "g"). Son la misma unidad física pero con distinta notación — ver nota en BP-010 sobre esta inconsistencia de datos (no bloqueante, pero pendiente de unificar cuando se implemente conversión de unidades).


Dependencias


ADR-001 (arquitectura modular por dominio).
Es dependencia directa de BP-009 (Recipe.items[].rawMaterialId) y de BP-010 (cálculo de necesidad de materia prima + alerta por mínimo).


Estado

✅ Finalizado (documental). Confirmado contra el código real del repositorio HF-CORE-ERP el 17/07/2026. No requirió desarrollo nuevo — el módulo ya existía en producción.
---

# Adenda BP-011 (17/07/2026) — Catálogo real cargado

* Se agregaron 11 materias primas reales (Coco, Maní, Ajonjolí, Uvas Pasas, Papelón, Sal Fina, Aceite de Coco, Chía, Almendra Fileteada, Chocolate Oscuro 70%, Fruit Roll), con unitCost real derivado de BOM_HonestlyFoods.xlsx (promedio de proveedores, en $/gramo).
* El registro id "3" (Mantequilla de Maní) queda deprecado (active: false): pasa a ser la receta intermedia "Honestly Peanut Butter" (ver BP-011, ADR-004). No se elimina el registro para no perder trazabilidad histórica (Regla 1, TEAM_RULES).
* currentStock de las materias primas nuevas se cargó en 0 (placeholder): no había inventario real registrado en los documentos de origen. El CEO debe ajustarlo desde la app una vez desplegada.
* Fruit Roll tiene unitCost: 0 marcado como ⚠️ pendiente — no hay BOM detallado de los rollos de fruta en la fuente (solo estimados de compra), así que no se fabricó un número. Queda para un Blueprint futuro.
