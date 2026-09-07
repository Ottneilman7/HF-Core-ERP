# BP-055 — Ficha Unificada de Producto/Receta (categoría, reventa, autorización)

## Objetivo
Convertir `RecipeConfigPage.tsx` en la única ficha de alta de productos (ver ADR-011), agregando lo que le faltaba para cubrir el caso de uso real: categorías abiertas (no catálogo cerrado), productos que no se fabrican (reventa de mercancía de terceros), y una autorización explícita para crear productos nuevos — antes propuesta como un PIN, resuelta con el mismo mecanismo de permisos de BP-054.

## Alcance
- `category` y `description` en `Recipe` (antes solo existían en el `Product` retirado).
- Selector de categoría: dropdown de categorías ya usadas + opción "Agregar categoría nueva" (sin colección de categorías separada — se derivan de las recetas existentes).
- Camino de "Producto de reventa": receta con `items: []`, sin exigir ingredientes; su stock se alimenta recibiendo una compra (`PurchaseOrder` con `finishedProductId`, ya existente desde BP-044) en vez de "confirmar producción".
- Permiso `canCreateProducts` en `Membership`: por defecto solo Dueño/Gerente pueden crear/editar recetas; Producción puede, persona por persona, si el Dueño lo activa explícitamente en `/team`.
- Atajo "+ Nuevo Producto (con receta) →" desde `InventoryPage`, para no obligar a pasar por Configuración.

## Responsabilidades
- `models/Recipe.ts`: `category?`, `description?` agregados (Regla 11: opcionales, no rompen recetas existentes).
- `models/Membership.ts`: `canCreateProducts?: boolean`, deliberadamente fuera de `modules` (ver Reglas de negocio).
- `pages/RecipeConfigPage.tsx`: formulario con categoría, descripción, checkbox de reventa (oculta la sección de ingredientes y su validación cuando está marcado).
- `router/menuConfig.ts`: `/settings/recipes` ahora es `elevatedOnly` con excepción `allowIfCanCreateProducts`.
- `services/firestore.rules`: `recipes` separa `create` (gated por `canCreateProducts`) de `update` (sigue abierto a quien ya tiene el módulo `inventario`/`produccion`, para que registrar producción normal no se vea afectado) y `delete` (solo elevado).

## Modelo conceptual
```
Recipe {
  ...(sin cambios de BP-011/012)
  category?: string
  description?: string
  items: []              // vacío = producto de reventa, sin BOM
}
```
Crear una `Recipe` nueva (definir un producto) y actualizar una existente (ej. sumar stock al confirmar producción) son ahora dos permisos distintos en las reglas — antes `write` los trataba igual.

## Reglas de negocio
- Categoría es obligatoria; se escribe libre la primera vez y queda disponible como opción para las siguientes recetas — sin necesidad de una pantalla de "gestionar categorías".
- Un producto de reventa nunca tiene `tracksInventory: true` (no aplica ser semielaborado sin ingredientes propios).
- `canCreateProducts` se muestra en `/team` únicamente cuando el rol elegido es Producción — Ventas nunca lo necesita, Dueño/Gerente ya tienen todo.
- Documentos de `Membership` sin este campo (creados antes de BP-055) se tratan como `false` — `undefined == true` es `false` en las reglas, y en el cliente se usa `?? false`.

## Dependencias
- Depende de BP-044 (`PurchaseOrder.finishedProductId`) para que la reventa tenga una forma real de recibir stock.
- Depende de BP-054 (Membership, reglas basadas en módulo) para el nuevo permiso.
- Reemplaza y retira el trabajo de la sesión anterior sobre `ProductsPage.tsx`/`productService.ts` (ver ADR-011).

## Fuera del alcance del MVP
- Gestión de categorías como entidad propia (renombrar/fusionar categorías existentes) — hoy son solo el valor de texto que ya usan las recetas.
- Reventa con variantes de proveedor por SKU (hoy un producto de reventa es un solo SKU, sin distinguir de qué proveedor vino cada unidad en stock).

## Evolución futura
Si más adelante se necesita restringir la creación de productos por categoría (ej. Producción autorizado solo para "Snacks", no para "Mercancía Seca"), `canCreateProducts` puede evolucionar de booleano a lista de categorías permitidas sin cambiar la forma general del permiso.

## Estado
✅ Finalizado — probado creando un producto de reventa y confirmando que aparece en Inventario y es seleccionable en Compras.

## Historial
- 06/09/2026 — Implementado. Ver también BP-056 (corrección de unidad de medida, detectada probando esta misma ficha).