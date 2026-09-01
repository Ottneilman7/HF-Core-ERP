BP-014

Producción por Demanda ("Voy a producir X, dime qué sacar")

Versión: 1.0
Última actualización: 18/07/2026
Origen: ENTREPRENEUR_JOURNEY.md, Capacidad 2 ("Saber qué fabricar") — priorizado por el CEO como siguiente capacidad tras BP-013.

---

## Objetivo

Reemplazar la exploración manual de recetas por una sola pregunta: "¿cuánto vas a producir hoy?" — y que la app calcule, usando el motor de BP-011/012 (sin cambios en su lógica), exactamente qué sacar de almacén.

## Alcance (Fase 1 — esta entrega)

- Página `ProductionPage.tsx` (ruta `/production`), reemplaza el hub anterior.
- Lista de **todo lo que se puede producir**: los 3 SKU finales (barras) y los semielaborados con inventario propio (Granola a granel, Peanut Butter) — a diferencia de la antigua RecipesPage, aquí no importa si tiene `productId` o no, porque el emprendedor también necesita poder decir "voy a producir 6.4kg de Granola" sin que eso sea un SKU vendible.
- El usuario elige qué producir e ingresa la cantidad **en la unidad natural de esa receta** (gramos para Granola/Peanut Butter, unidades para las barras).
- El resultado es una lista completa (no solo faltantes) de qué sacar de almacén, con ícono, cantidad y estado (✅ suficiente / ⚠️ falta).
- Cuando la cantidad no es múltiplo exacto del rendimiento por lote (`yieldQuantity`), se muestra cuántos lotes representa (ej. "6400g ≈ 2.00 lotes de 3200g") — así el emprendedor conecta el número con su proceso real (ej. "2 hornos"), sin que el sistema necesite modelar hornos como un concepto aparte.

## Fuera de alcance de esta entrega (Backlog explícito)

- **Reparto automático entre presentaciones según demanda real de ventas.** El CEO confirmó: por ahora el emprendedor decide manualmente cuánto va a cada presentación; el reparto automático (empacar más en las presentaciones que más se venden) requiere datos reales de Ventas, que todavía no existen como módulo. Queda registrado como evolución directa de BP-014 una vez exista Capacidad 3 (Ventas).
- **Persistencia real de inventario ("ejecutar y descontar del almacén").** Hoy el catálogo (`rawMaterials.ts`, `recipes.ts`) son archivos estáticos, no una base de datos — no hay dónde "guardar" que ya se produjo algo y que el stock bajó. Confirmar una producción y que el stock se actualice de verdad requiere una decisión de arquitectura propia (¿localStorage como solución puente, o backend real con base de datos?) — no la voy a improvir dentro de esta entrega. Ver "Próxima decisión pendiente" abajo.

## Próxima decisión pendiente (antes de Fase 2)

Ahora mismo, calcular "qué sacar" no puede traducirse en "descontarlo del inventario" porque el proyecto no tiene backend ni base de datos — todo vive en archivos TypeScript estáticos que solo cambian cuando yo edito código. Para que "ejecutar la producción" actualice el stock de verdad, hay dos caminos:

1. **Corto plazo:** guardar el inventario en `localStorage` del navegador (rápido de construir, funciona ya, pero solo vive en esa computadora/navegador).
2. **Mediano plazo:** backend real con base de datos (permite multiusuario, respaldo, acceso desde el celular) — es un cambio de arquitectura grande, merece su propio ADR.

Se necesita la decisión del CEO antes de construir la Fase 2 (confirmar y descontar stock).

## Estado

✅ Finalizado — 19/07/2026
---

# Adenda (19/07/2026) — Centro de Decisiones limpio

Se retiró la sección "Inventario" (alertas automáticas de stock mínimo) de DecisionCenterPage. Motivo (feedback CEO): esos mínimos (RawMaterial.minimumStock, Recipe.minimumStock) son placeholders que yo cargué al construir BP-011/012 — no valores que el emprendedor haya definido todavía. Mostrarlos como alerta automática generaba ruido, no una decisión real.

Regla de diseño confirmada: el Centro de Decisiones solo debe reflejar lo que el dueño del negocio consulta o registra activamente (hoy: Producción; a futuro: Marketing, tareas del local, etc.) — nunca umbrales que nadie configuró.

Las funciones getLowStockRawMaterials / getLowStockTrackedRecipes se mantienen en el servicio (no se pierde el trabajo, Regla 1) pero dejan de usarse en DecisionCenterPage. Quedan en Backlog para cuando exista una pantalla de Configuración donde el emprendedor defina sus propios mínimos reales — ahí sí tendría sentido reactivarlas.

Se agrega components/ResetButton.tsx, reutilizable, con estilo moderno (gradiente + sombra + efecto de presión).

Adenda — Reconciliación pendiente con productPresentations.ts

Al recuperar ProductsPage.tsx original, se descubrió que el repositorio ya tenía un patrón propio para presentaciones de producto (data/productPresentations.ts: un Product + N presentaciones enlazadas por productId). BP-012 resolvió el mismo problema para Granola de otra forma (3 Product independientes: HG_T050, HG_T200, HG_T400). Son dos formas de modelar lo mismo — hay que reconciliarlas para no violar Regla 16 (una sola fuente de verdad). Pendiente: revisar productPresentations.ts y decidir cuál patrón queda como oficial.