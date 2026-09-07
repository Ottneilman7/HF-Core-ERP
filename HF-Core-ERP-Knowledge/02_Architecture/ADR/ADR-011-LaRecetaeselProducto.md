# ADR-011 — La receta es el producto: retiro del catálogo de `Product` paralelo

## Contexto
En una auditoría inicial (antes de esta serie de sesiones) se detectó que `ProductsPage.tsx` mostraba datos hardcodeados (`src/data/products.ts`) sin ningún CRUD real, y se construyó un sistema paralelo completo (`models/Product.ts`, `services/productService.ts`, colección `products` en Firestore) para resolverlo.

Al implementar la ficha de creación de productos con receta/BOM (BP-055), se descubrió que esa página era en realidad **código legado ya reemplazado a propósito**: `RecipeConfigPage.tsx` tiene un comentario explícito del equipo original — *"BP-048: se elimina por completo la dependencia de data/products.ts. La receta ES el producto."* Es decir, el `productId` que usan `Sale`, `PurchaseOrder` e `Inventory` en todo el sistema **ya es el id de una `Recipe`** con `tracksInventory: false`, no el id de un `Product` separado. El catálogo paralelo nunca se conectó a nada — el producto de prueba creado durante esa sesión (BP-054) quedó huérfano, invisible en Inventario, exactamente por esto.

## Decisión
Se retira por completo el catálogo paralelo: `pages/ProductsPage.tsx`, `services/productService.ts`, la ruta `/products` y la colección `products` en Firestore. `Recipe` se extiende con `category` y `description` (antes solo vivían en `Product`), y pasa a ser, sin ambigüedad, la única entidad para cualquier SKU vendible — con receta (fabricado aquí) o sin ella (reventa, ver BP-055).

## Alternativas consideradas
1. **Mantener ambas entidades sincronizadas** (`Product` + `Recipe` enlazadas por `recipe.productId`) — es lo que el modelo original dejaba abierto como posibilidad (`Recipe.productId?`), pero agrega una capa de indirección y un punto más de sincronización sin necesidad real: nada en el sistema actual necesita separar "metadata de catálogo" de "receta operativa".
2. **Retirar el catálogo paralelo y extender `Recipe`** (elegida) — menos entidades, menos que se pueda desincronizar, y alineado con la decisión que el propio equipo ya había tomado en BP-048.

## Consecuencias
- Cualquier código futuro que necesite "el producto" debe usar `Recipe`, nunca crear una tabla o colección de productos separada.
- El link "Ver Catálogo" en `InventoryPage` apunta a `/settings/recipes`, no a una página de catálogo aparte.
- Un producto de reventa sin fabricación (BP-055) sigue siendo una `Recipe` con `items: []` — no un tipo de dato distinto.

## Estado
Implementado (BP-055). Lección para próximas sesiones: antes de construir un CRUD nuevo para una entidad que "parece" no tener gestión, verificar si existe una página o servicio equivalente ya migrado con otro nombre — un comentario de código como el de BP-048 es más confiable que la ausencia aparente de funcionalidad.