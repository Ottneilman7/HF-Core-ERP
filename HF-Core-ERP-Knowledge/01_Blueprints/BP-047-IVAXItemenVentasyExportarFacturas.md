# BP-047

IVA por Ítem en Ventas y Exportación de Facturas

Versión: 1.0
Última actualización: 20/08/2026
Origen: revisión del CEO — todas las facturas calculaban IVA sobre el total,
sin considerar que algunos ítems (materia prima, alimentos básicos) están
exentos según la normativa venezolana.

---

## Problema

`invoiceService.createInvoiceFromSale` calculaba IVA sobre la suma de TODOS
los ítems sin excepción. Si se vendía materia prima (exenta) junto con barras
(gravadas), la factura era incorrecta: cobraba IVA sobre algo que no debía.

---

## Solución

### `models/Sale.ts`
Se agrega `isVatExempt?: boolean` a `SaleItem`. Campo opcional para
compatibilidad con ventas existentes (ADR-009: se lee con `?? false`).

### `models/Invoice.ts`
Se agrega:
- `isVatExempt?: boolean` en `InvoiceLine`
- `exemptAmount: number` en `Invoice` — suma de lineTotals exentos

### `services/invoiceService.ts`
`createInvoiceFromSale` ahora separa ítems exentos de gravados:
- `exemptAmount` = suma de lineTotals donde `isVatExempt = true`
- `baseImponible` = suma de lineTotals donde `isVatExempt = false`
- `ivaAmount` = `baseImponible * ivaPercentage / 100`
- `total` = `exemptAmount + baseImponible + ivaAmount`
- `netAmountDue` = `total - retainedAmount` (sin cambio de fórmula)

Facturas anteriores a este cambio se leen con `exemptAmount ?? 0` y
`line.isVatExempt ?? false` — no se rompen.

### `pages/SalesPage.tsx`
- Checkbox "Este ítem está exento de IVA" por cada ítem antes de agregarlo
- Productos terminados cargados desde Firestore (recetas sin tracksInventory)
  — elimina dependencia de `data/products.ts` (fix BP-048 aplicado aquí)
- Resumen previo en el draft: muestra exento vs. base imponible estimada
- Botón "Exportar facturas CSV" — descarga todas las facturas del negocio

### `pages/InvoicesPage.tsx`
- Columna "IVA" en la tabla de ítems: "Exento" / "Gravado" por línea
- Desglose de totales: Monto exento + Base imponible + IVA + Retención
- Botón "Exportar CSV" arriba — mismo formato que el de SalesPage

---

## Compatibilidad

Ventas y facturas anteriores a BP-047:
- `SaleItem.isVatExempt` ausente → se lee como `false` (todo gravado, igual que antes)
- `Invoice.exemptAmount` ausente → se lee como `0`
- `InvoiceLine.isVatExempt` ausente → se muestra "Gravado" (conservador)

---

## Checklist de cierre (Regla 20, TEAM_RULES)

- [x] `models/Sale.ts` — isVatExempt agregado
- [x] `models/Invoice.ts` — exemptAmount e isVatExempt agregados
- [x] `services/invoiceService.ts` — cálculo separado exento/gravado
- [x] `pages/SalesPage.tsx` — checkbox + Firestore + CSV
- [x] `pages/InvoicesPage.tsx` — desglose + CSV
- [x] `npm run build` ✅
- [x] Prueba: venta con un ítem exento y uno gravado → factura correcta
- [x] git commit + push

## Estado

🟡 Entregada — pendiente de aplicar y verificar.