# BP-009 Recetas de Producción (Bill of Materials — BOM)

Versión: 1.0

Última actualización: 17/07/2026

Fuente: Reconstruido a partir del avance real de ENT-009 (Chat-001.md). A diferencia de BP-008, este entregable no aparece cerrado en el archivo — no hay confirmación de git commit/push final. Se documenta con su estado real de avance.


Objetivo

Que el ERP conozca exactamente cómo se fabrica cada producto — no como un simple listado de ingredientes, sino como la base estructural para Producción, Costos, Inventario, Compras, Rentabilidad y el Centro de Decisiones.


Alcance

Incluye:


Modelo Recipe y RecipeItem.
Una receta por presentación comercial (SKU), no por producto genérico — decisión de arquitectura explicada abajo.
Versionado de recetas (version), para poder mejorar una fórmula sin perder el historial de producción anterior.
Unidad de medida explícita por ingrediente dentro de la receta (unit), independiente de la unidad principal con que se registra la materia prima.
Primera pantalla (RecipesPage) que conecta en una sola vista tres módulos distintos: Producto, Materia Prima y Receta.


No incluye (ver "Fuera del alcance del MVP").


Responsabilidades


Registrar la composición (BOM) de cada producto/presentación.
Ser la fuente única de verdad para calcular el consumo de materia prima cuando exista Producción.
Servir de base para el futuro cálculo de costo por producto.
Permitir múltiples versiones de una misma receta sin perder las anteriores — igual que trabaja realmente una empresa de alimentos.



Modelo conceptual

Recipe
├── id: string
├── code: string           (ej. REC-HB-C1)
├── productId: string       (referencia a Product / presentación)
├── version: number
├── yieldQuantity: number   (cuánto produce esta receta, ej. 1 lote → 60 barras)
├── yieldUnit: string
├── items: RecipeItem[]
└── active: boolean

RecipeItem
├── rawMaterialId: string   (nunca el nombre — el nombre puede cambiar, el id no)
├── quantity: number
└── unit: string            (unidad explícita de este ingrediente en ESTA receta)

Relaciones

RawMaterial (1) ←── RecipeItem (N) ──→ (1) Recipe ──→ Product


Reglas de negocio

Cada presentación comercial (SKU) tiene su propia receta, aunque comparta fórmula base con otras presentaciones del mismo producto (ej. REC-HB-C1, REC-HB-C3, REC-HB-C6 para Honestly Bar Classic en sus tres presentaciones). Esto prepara el sistema para diferencias futuras en empaque, etiquetas, costos y tiempos de producción por presentación, sin complicar el MVP actual.
Las recetas referencian materia prima por rawMaterialId, nunca por nombre — mismo principio aplicado en Product (BP-007) y Customer (BP-008): el identificador interno nunca cambia, el nombre visible sí puede hacerlo.
Cada receta lleva un número de version. Mejorar una fórmula no borra el historial de producción hecho con la versión anterior.
La unidad de cada ingrediente (unit) se declara explícitamente en cada RecipeItem, en lugar de asumir que siempre coincide con la unidad principal de la materia prima. Esto prepara conversiones futuras (ej. comprar miel en kg y consumirla en gramos) sin romper el modelo — aplica la Regla 13 de TEAM_RULES ("el ERP se adapta al negocio, no al revés").


Dependencias

BP-007 (Product Master): Recipe.productId referencia una presentación de producto existente.
RawMaterial: RecipeItem.rawMaterialId referencia materias primas ya implementadas en el código. ⚠️ No se incluyó ningún Blueprint de RawMaterial entre los documentos que recibí — puede que exista con otro número (PROJECT_INDEX.md menciona BP-001 y BP-007, con un salto entre medio) o que nunca se haya formalizado. Vale la pena confirmarlo antes de seguir.
ADR-001 (arquitectura modular por dominio).
ADR-003 (Centro de Decisiones): la idea de alertar sobre materias primas críticas nace directamente de esa decisión.


Fuera del alcance del MVP

Cálculo de costo por receta y por unidad producida.
Cálculo de margen y precio sugerido.
Descuento automático de inventario al producir (Producción, como módulo, todavía no existe).
Campo criticality en RawMaterial (materias primas críticas por tiempo de reabastecimiento) — ya se conversó como idea de diseño, pero explícitamente se decidió no implementarla aún para mantener el MVP simple.
Conversión automática de unidades entre compra y consumo.


Evolución futura

Producción (Órdenes de producción) consumiendo Recipe para descontar inventario automáticamente.
Costeo automático por receta y por unidad producida.
Margen y precio sugerido por producto.
Alertas del Centro de Decisiones cuando una materia prima crítica (criticality) ponga en riesgo una producción planificada.
Unidad de medida configurable por el usuario (unidad, lote, kg, caja, paquete) — mismo principio de "codificación configurable" ya aplicado en Productos y Clientes.

Estado

✅ Finalizado. Verificado en navegador (resultado exacto esperado) y confirmado git commit + push por el CEO el 17/07/2026.

Entregado:


Modelo Recipe / RecipeItem, incluyendo el campo unit por ingrediente.
recipes.ts con la primera receta real de Honestly Foods (REC-HB-C1).
RecipesPage.tsx, integrando por primera vez tres módulos (Product + RawMaterial + Recipe) en una sola vista.
Ruta /recipes registrada en AppRouter, navegable desde el Sidebar.


Decisión tomada: el cálculo automático de materia prima necesaria según cantidad a fabricar (con alerta de stock faltante en el Centro de Decisiones) no se incluyó en ENT-009 — queda formalmente como ENT-010, con su propio Blueprint.

---

# Adenda BP-011 / ADR-004 (17/07/2026) — Extensión a recetas multinivel

El modelo conceptual de un solo nivel documentado arriba (una receta = lista de materia prima directa) sigue siendo válido como caso particular, pero fue **extendido**: una receta ahora puede consumir otra receta como ingrediente (producto intermedio), necesario para representar correctamente el negocio real de Honestly Foods (Granola Base y Honestly Peanut Butter como insumos internos de las barras). Ver BP-011 para el detalle completo y ADR-004 para la decisión de arquitectura.

La receta de ejemplo original de este Blueprint (`REC-HB-C1`, barra de 100g con 3 ingredientes directos) era un dato de prueba genérico del MVP, no la fórmula real del negocio. Queda reemplazada por `HB_C1` v2 (50g, multinivel) en BP-011.