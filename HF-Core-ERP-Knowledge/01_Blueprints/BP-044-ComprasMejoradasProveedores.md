# BP-044

Compras Mejoradas — Proveedores, Tipos de Ítem, IVA, Factura de Compra

Versión: 1.0
Última actualización: 22/08/2026
Origen: revisión del CEO tras usar el módulo de Compras con datos reales.

---

## Cambios implementados

### A. Botón "Nuevo Proveedor" fuera de fichas + Ver detalle
- El botón "+ Nuevo proveedor" se movió al header de la página, siempre
  visible, sin necesitar abrir la ficha de Proveedores.
- Cada proveedor en la lista tiene dos botones: **Ver** (despliega panel
  inline con todos los datos: razón social, RIF, contacto, teléfono con
  enlace directo para llamar, ciudad, dirección) y **Editar**.
- Fix: la lista de proveedores se refresca inmediatamente al agregar uno
  nuevo (antes había que recargar la página).

### B. 4 tipos de ítem en Nueva Orden
El selector "¿Qué estás comprando?" pasó de 2 a 4 opciones:
- **Materia prima** — del catálogo de rawMaterials (con selector Kg/g).
- **Semielaborado ya hecho** — del catálogo de recetas con inventario propio
  (uso excepcional/emergencia).
- **Producto terminado para revender** — del catálogo de recetas sin
  inventario propio. Al recibir, suma al inventario de finishedGoods.
- **Otro** — nombre libre + unidad libre. No afecta ningún catálogo al
  recibir (sirve para servicios, insumos de limpieza, etc.).

### C. IVA por ítem en compras
- Checkbox "Este ítem está exento de IVA" por cada ítem.
- El total de la orden calcula: exento + base imponible × (1 + 16%).
- Resumen previo en el draft: exento / gravado / total con IVA.
- La ficha de Órdenes muestra el desglose igual que /invoices.

### D. Vista /orders con formato factura + selector de fechas + CSV
- Membrete del proveedor (nombre, RIF, dirección, teléfono).
- Sección "Comprador" con datos de la empresa (desde configService).
- Tabla de ítems con columna IVA (Exento / +16%).
- Desglose de totales: Monto exento + Base imponible + IVA + Total.
- Selector de rango Desde/Hasta con atajos (Hoy, Esta semana, Este mes).
- Resumen del período: órdenes, exento, base imponible, IVA, total comprado.
- Botón "Exportar CSV" del período filtrado.

---

## Archivos modificados

| Archivo | Acción |
|---|---|
| `src/models/PurchaseOrder.ts` | `finishedProductId`, `customItemName`, `customItemUnit` agregados a `PurchaseOrderItem` |
| `src/services/purchaseService.ts` | Soporte para los 4 tipos de ítem en `receivePurchaseOrder` y `voidPurchaseOrder` |
| `src/pages/PurchasesPage.tsx` | Botón Ver proveedor, nuevo proveedor fuera de fichas, 4 tipos, IVA por ítem |
| `src/pages/OrdersPage.tsx` | Formato factura, selector de fechas, resumen del período, exportar CSV |

---

## Backlog explícito

- Descargar factura de compra individual como imagen (igual que /invoices).
- Cuentas por Pagar a proveedores: registrar pagos a crédito y llevarles
  el saldo, igual que se hace con clientes en Cobranza.

## Estado

✅ Cerrado — 22/08/2026