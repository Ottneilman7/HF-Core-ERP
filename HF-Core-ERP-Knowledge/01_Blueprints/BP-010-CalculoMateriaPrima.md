# BP-010 Cálculo Automático de Materia Prima Necesaria (con Alerta en Centro de Decisiones)

Versión: 1.0
Última actualización: 17/07/2026
Origen: Formalizado explícitamente en BP-009 como siguiente entregable (ENT-010).

---

## Objetivo

Que, dado "quiero producir X unidades del producto Y", el ERP calcule automáticamente cuánta materia prima se necesita (usando la Recipe activa), la compare contra el stock actual, y — si falta algo — lo convierta en una acción recomendada dentro del **Centro de Decisiones** (Nivel 2, ADR-003), nunca en una tabla cruda.

Ejemplo (ENTREPRENEUR_JOURNEY.md): "Tu inventario alcanza para 2 días. Compra avena hoy." — ENT-010 es la primera pieza real de ese Motor de Decisiones.

## Alcance

Incluye:

- Servicio `productionCalculatorService` (regla de negocio, separado de la UI — Regla 6 TEAM_RULES).
- Cálculo: por cada `RecipeItem` de la receta activa del producto, `necesario = (cantidadAProducir / recipe.yieldQuantity) * item.quantity`.
- Comparación contra `RawMaterial.currentStock` (ver nota en BP-005 sobre el nombre real del campo).
- Componente de alerta `MaterialShortageAlert` para el Centro de Decisiones, mostrando solo acciones ("Compra X hoy"), no tablas.
- Componente `ProductionSimulator` embebible en RecipesPage, donde el usuario ingresa cuánto quiere producir.

No incluye (fuera del alcance del MVP, igual que se dejó explícito en BP-009):

- Descuento real de inventario (Producción como módulo transaccional no existe aún).
- Conversión automática de unidades entre compra y consumo.
- Costeo o margen.
- Campo `criticality` en RawMaterial.

## Modelo conceptual

```
ProductionNeed
├── rawMaterialId: string
├── name: string
├── requiredQuantity: number
├── unit: string
├── availableStock: number
├── isSufficient: boolean
└── shortfall: number        (0 si isSufficient = true)
```

## Reglas de negocio

1. El cálculo siempre usa la receta con `active: true` y mayor `version` del producto.
2. Si `yieldQuantity` es 0 o la receta no existe, el cálculo debe fallar de forma explícita (no asumir valores).
3. La alerta en el Centro de Decisiones solo aparece cuando `isSufficient = false` — nunca se listan materias primas suficientes (Nivel 2 no muestra datos crudos, ADR-003).
4. El texto de la alerta debe ser una acción, no un dato: "Compra {faltante} {unidad} de {nombre} para producir {producto}" — no "Stock: 12/20".

## Dependencias

- BP-009 (Recipe / RecipeItem).
- BP-005 (RawMaterial) — **bloqueante hasta confirmar el nombre real del campo de stock** (ver BP-005, Estado).
- ADR-003 (Centro de Decisiones, Nivel 2).

## Estado

🟡 Código entregado como propuesta (ver ENT-010 más abajo), **pendiente de integración** contra el repositorio real `HF-CORE-ERP`, ya que no se tuvo acceso a `RawMaterial.ts`, `Recipe.ts` ni al componente actual del Centro de Decisiones. Checklist de cierre según Regla 20 aún no ejecutado.

## Próximo paso

Una vez validado el campo de stock en BP-005 e integrado el código en el repo real: ejecutar checklist de Regla 20 y cerrar ENT-010.
---


# BP-010 Cálculo Automático de Materia Prima Necesaria (con Alerta en Centro de Decisiones)

Versión: 2.0 (confirmada e integrada contra código real)
Última actualización: 17/07/2026

Objetivo

Que, dado "quiero producir X unidades del producto Y", el ERP calcule automáticamente cuánta materia prima se necesita (usando la Recipe activa), la compare contra el stock actual y contra el mínimo configurado, y convierta cualquier riesgo en una acción recomendada dentro del Centro de Decisiones — nunca en una tabla cruda.

Alcance final

Incluye:

* services/productionCalculatorService.ts — regla de negocio pura, separada de la UI (Regla 6).
* Dos tipos de alerta, no solo una:
    1. Urgente (getShortages): el stock actual no alcanza para producir. Mensaje tipo "Compra X hoy."
    2. Preventiva (getLowStockWarnings): el stock alcanza, pero producir dejaría el inventario por debajo de RawMaterial.minimumStock. Aprovecha un campo del modelo real que existía pero no se estaba usando en ninguna regla de negocio.

* contexts/ProductionAlertsContext.tsx — puente entre RecipesPage (donde se simula) y HomePage (donde se decide), sin acoplar ambas páginas.
* ProductionSimulator embebido en cada tarjeta de RecipesPage.
* MaterialShortageAlert en el Centro de Decisiones real (HomePage.tsx, corregido — ver Adenda ADR-003).

No incluye (fuera del alcance del MVP, igual que BP-009):
* Descuento real de inventario (Producción como módulo transaccional no existe aún).
* Conversión automática de unidades.
* Costeo o margen (aunque RawMaterial.unitCost ya existe en el modelo, no se usa aquí).

Hallazgos durante la integración
    1. yieldQuantity real es 1 (receta expresada por unidad de producto, no por lote de 60 como sugería el ejemplo original de BP-009). La fórmula del servicio es genérica y funciona igual en ambos casos — no requirió cambios.
    2. Inconsistencia de notación de unidades: RawMaterial.unit usa texto completo ("Gramos"), RecipeItem.unit usa abreviatura ("g"). Numéricamente no afecta el cálculo (ambos son gramos), pero es una inconsistencia de datos a unificar cuando se aborde conversión de unidades. No bloqueante — registrada aquí para no perderla (Regla 11, TEAM_RULES).
    3. HomePage.tsx no era el Centro de Decisiones real pese a que ADR-003 lo daba por implementado. Corregido como parte de este entregable — ver Adenda ADR-003.

Estado

✅ Código completo y consistente con el repositorio real. Pendiente únicamente de que el CEO/CTO lo copie al repo, corra las pruebas y confirme en navegador (ver checklist de cierre, Regla 20, en el mensaje de entrega).
---

# Adenda BP-011 (17/07/2026) — Servicio ahora multinivel

calculateProductionNeeds fue extendido para resolver recursivamente productos intermedios (recibe ahora un cuarto parámetro recipes). No se rompió la integración de ENT-010: ProductionSimulator ya recibía recipes como prop, solo se agregó su reenvío en la llamada al servicio. Ver ADR-004 y BP-011 para el detalle de la extensión.

Los datos de prueba de este Blueprint (barra de 100g) quedan como referencia histórica del MVP genérico. Las pruebas reales ahora usan la fórmula de 50g de HB_C1 (ver productionCalculatorService.test.ts actualizado en BP-011).