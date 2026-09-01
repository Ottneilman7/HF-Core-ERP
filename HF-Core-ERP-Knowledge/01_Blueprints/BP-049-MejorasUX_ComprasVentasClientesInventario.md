# BP-049

Mejoras UX: Compras, Ventas, Clientes e Inventario

Versión: 1.0
Última actualización: 22/08/2026
Origen: revisión del CEO tras usar cada sección con datos reales.

---

## Cambios implementados

### 1. /purchases — Precio total y eliminar ítem del draft

**Problema:** el campo "Precio sin IVA" pedía el precio por gramo, lo que
obligaba al emprendedor a calcular manualmente (ej. $7.50 por 300g → $0.025/g).

**Fix:** el campo ahora se llama "Precio total pagado" — el emprendedor
ingresa lo que pagó en total por la cantidad indicada ($7.50) y el sistema
calcula automáticamente el precio por unidad (g/kg) y lo muestra como
referencia antes de agregar el ítem. La fórmula es:
`unitCost = totalCost / quantityInBaseUnit`

**Problema 2:** no había forma de eliminar un ítem del borrador de la orden
antes de crearla.

**Fix:** cada ítem en el listado del draft tiene un botón ✕ que lo elimina
de la lista sin afectar nada en Firestore (la orden aún no se ha creado).

**Archivo:** `src/pages/PurchasesPage.tsx`

---

### 2. /sales — Nuevo cliente fuera de fichas + fichas colapsables

- Botón "+ Nuevo cliente" movido al header de la página, siempre visible,
  igual que "+ Nuevo proveedor" en /purchases.
- Ficha "Nueva venta" colapsable (abierta por defecto).
- Ficha "Ventas registradas" colapsable (cerrada por defecto, para no
  saturar la pantalla al entrar).

**Archivo:** `src/pages/SalesPage.tsx`

---

### 3. /customers — Separación visual de nombres

**Problema:** razón social y denominación comercial aparecían pegadas,
sin espacio entre ellas.

**Fix:** razón social en `div` con `fontWeight 700` y `marginBottom 2px`;
denominación comercial en `div` separado con `fontSize 13px` y `marginBottom 8px`.
Los datos adicionales (RIF, contacto, teléfono, ciudad) se muestran con
`lineHeight 1.8` para mayor legibilidad. El teléfono tiene enlace `tel:` para
llamar directamente desde el dispositivo.

**Archivo:** `src/pages/CustomersPage.tsx`

---

### 4. /adjustments — Validación de stock sin cambio

**Problema:** era posible confirmar un ajuste de inventario sin modificar
la cantidad (stock nuevo = stock actual), lo que generaba un registro
inútil de "+0.00" en el historial.

**Fix:** se agrega validación en `AdjustModal` que muestra el error
"El stock nuevo es igual al actual. Modifica la cantidad antes de confirmar."
si `newStock === currentStock`.

**Archivo:** `src/pages/InventoryPage.tsx`

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/pages/PurchasesPage.tsx` | Precio total → unitCost automático + botón ✕ en draft |
| `src/pages/SalesPage.tsx` | Nuevo cliente fuera + fichas colapsables |
| `src/pages/CustomersPage.tsx` | Separación visual de nombres |
| `src/pages/InventoryPage.tsx` | Validación ajuste sin cambio de stock |

---

## Estado

✅ Cerrado — 22/08/2026