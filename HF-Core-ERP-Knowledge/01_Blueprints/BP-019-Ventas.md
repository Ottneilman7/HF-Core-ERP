# BP-019  Ventas (Cliente → Venta → Factura → Inventario)

Versión: 1.0
Última actualización: 19/07/2026
Origen: EL-Verdadero-MVP-EIF.md, Flujo 5 ("Vender") — siguiente hueco real tras cerrar BP-018 (Compras) y su ajuste de consistencia con Producción.

---

## Objetivo

Que el emprendedor pueda registrar una venta a un cliente ya existente (`Customer`, desde ENT-008), descontando inventario real de producto terminado y, si la venta es a crédito, aumentando el saldo de cuentas por cobrar de ese cliente — mismo campo `Customer.balance` que ya existía, ahora con movimiento real.

## Alcance (esta entrega)

- `models/Sale.ts`: una venta cumple el rol de Venta y Factura a la vez (80/20 — no se construye documento de factura formal/PDF).
- `services/finishedGoodsInventoryService.ts`: inventario real de producto terminado (`Product` no tenía campo de stock — ver ADR-006).
- `services/customerBalanceService.ts`: extiende el patrón de `rawMaterialInventoryService` (ADR-005) a `Customer.balance` — `customers.ts` sigue siendo semilla, `localStorage` guarda el saldo vigente.
- `services/salesService.ts`: `createSale` valida stock de todos los ítems antes de tocar nada (todo o nada), descuenta inventario, y si `paymentType === "credit"` aumenta el saldo del cliente.
- `pages/SalesPage.tsx` (ruta `/sales`, reemplaza el `ComingSoonPage` actual): selección de cliente, armar venta con varios ítems, contado/crédito, lista de ventas registradas — y la sección de puente manual de inventario (ver ADR-006).
- Pruebas: `finishedGoodsInventoryService.test.ts` (4 casos), `customerBalanceService.test.ts` (4 casos), `salesService.test.ts` (5 casos, incluyendo el caso "todo o nada" con varios ítems).

## Decisiones de diseño

1. **Todo o nada:** si una venta tiene 3 ítems y el tercero no tiene stock suficiente, no se descuenta nada de los otros dos. Evita inventario a medias por una venta que falló a mitad de camino.
2. **Sale = Venta + Factura.** Generar un PDF de factura formal (con impuestos de `TaxConfig`, BP-016) queda en Backlog — el valor inmediato es "descontar inventario y saber quién me debe", no el documento fiscal todavía.
3. **El puente manual de inventario de producto terminado vive en `SalesPage`, no en una página nueva** — es temporal por diseño (ver ADR-006), no merece su propio módulo permanente.

## Fuera de alcance (Backlog explícito)

- **Producción Fase 2** (BP-014): confirmar producción real, descontando materia prima y sumando producto terminado automáticamente. Es el reemplazo natural del puente manual de esta entrega — candidato de mayor prioridad para el próximo sprint.
- Factura formal en PDF, aplicando `TaxConfig` (BP-016) al total de la venta.
- Cotización previa a la venta (EL-Verdadero-MVP-EIF.md ya la marca como opcional en el MVP).
- Editar o anular una venta ya confirmada.
- Importar clientes reales desde el Excel del CEO, reemplazando los datos de ejemplo de `customers.ts` (mencionado por el CEO, no bloqueante para esta entrega — se agenda aparte).

## Checklist de cierre (Regla 20, TEAM_RULES)

- [X] Copiar `models/Sale.ts`, `services/finishedGoodsInventoryService.ts` (+test), `services/customerBalanceService.ts` (+test), `services/salesService.ts` (+test), `pages/SalesPage.tsx` al repo real.
- [X] `npx vitest run`.
- [X] En `AppRouter.tsx`: reemplazar el `ComingSoonPage` de `/sales` por `<SalesPage />`.
- [X] Prueba en navegador: registrar producción terminada (ej. 50 Honestly Bar Classic) → crear una venta a crédito a "Supermercado El Centro" → confirmar que el inventario baja y que el saldo del cliente sube de 120 a lo esperado.
- [X] Confirmación del CEO.
- [X] Commit + push.

## Estado

✅ Finalizado — código y pruebas listos, listo checklist arriba.

## Próximo paso natural

Con Ventas resuelto, quedan dos caminos igual de válidos según el verdadero MVP: **Flujo 6 (Cobrar)** — pagos sobre las ventas a crédito, usando `customerBalanceService.adjustBalance` con monto negativo, ya construido y probado en esta entrega — o **Producción Fase 2**, que cierra el puente manual de ADR-006. Se recomienda Cobrar primero (es más rápido, la función ya existe) y dejar Producción Fase 2 como el siguiente sprint grande.