# BP-048

Configuración con Fichas Desplegables y Recetas Simplificadas

Versión: 1.0
Última actualización: 20/08/2026
Origen: revisión del CEO tras usar la app — ConfigPage sin fichas
desplegables se sentía pesada, RecipeConfigPage tenía opciones que
confundían sin agregar valor operativo.

---

## Objetivo

A. Fichas desplegables en /settings — mismo patrón visual que /purchases.
B. RecipeConfigPage simplificada: 3 tipos de producto claros, sin campos
   que confunden, semielaborado puede ser vendible.

---

## Parte A — ConfigPage con fichas desplegables

### Cambios
- 3 fichas: Empresa / Parámetros / Impuestos — cada una colapsable.
- "Empresa" abre por defecto (la más frecuente al entrar a Configuración).
- El resto cierra por defecto.
- Lógica de guardado idéntica — solo cambia la presentación.

### Archivo: `src/pages/ConfigPage.tsx` — REEMPLAZADO

---

## Parte B — RecipeConfigPage simplificada

### Cambios vs. versión anterior

**Tipo de producto — de selector confuso a 3 opciones claras con radio buttons:**

| Tipo | tracksInventory | productId | Cuándo usarlo |
|---|---|---|---|
| Semielaborado | true | opcional | Granola a granel, Peanut Butter — tienen stock propio, pueden usarse como ingrediente y/o venderse |
| Producto Terminado | false | requerido | Barras, bolsas — SKU vendible directo |
| Otro | false | no | Uso interno sin inventario propio |

**Un semielaborado puede ser vendible:** si el CEO selecciona "Semielaborado",
aparece un selector opcional para asociarlo a un SKU de venta. Así el Peanut
Butter puede ser ingrediente de las barras Y producto vendido a granel.

**Se elimina** el checkbox "Semielaborado con inventario propio" — queda implícito
en el tipo "Semielaborado".

**Se elimina** el campo "Rinde (cantidad por lote)" de la UI — seguía existiendo
en el modelo (`yieldQuantity`, `yieldUnit`) por compatibilidad con los datos
existentes en Firestore, pero se fijó en 1 al guardar y no se muestra.

**Código de producto:** campo visible y prominent en el formulario — es la
codificación interna del negocio (ej. "GRA-001"), distinta al ID del sistema.

### Archivo: `src/pages/RecipeConfigPage.tsx` — REEMPLAZADO

---

## Compatibilidad con datos existentes

Los documentos de recetas ya en Firestore siguen siendo válidos:
- `tracksInventory: true` → se muestra como "Semielaborado"
- `productId` presente → se muestra como "Producto Terminado" (o Semielaborado vendible)
- Ninguno de los dos → "Otro"

`yieldQuantity` y `yieldUnit` se conservan en Firestore con los valores
que ya tenían — el sistema los ignora en la UI pero no los borra.

---

## Checklist de cierre (Regla 20, TEAM_RULES)

- [x] `ConfigPage.tsx` con fichas desplegables
- [x] `RecipeConfigPage.tsx` simplificada
- [x] Verificar que las recetas existentes se muestran correctamente
- [x] Verificar que se puede crear/editar un semielaborado vendible
- [x] `npm run build` ✅
- [x] git commit + push

## Estado

Cerrado