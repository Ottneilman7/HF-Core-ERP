# BP-037

Compras Avanzadas (Datos Contables, Captura en Kg/Gr) y Anulación de Compra

Versión: 1.0
Última actualización: 31/07/2026
Origen: feedback del CEO tras registrar compras reales — faltaban datos que la contabilidad necesita, y la captura en gramos era engorrosa cuando el proveedor cotiza por kilo.

---

## Objetivo

Que una Orden de Compra registre lo que la contabilidad real necesita (fecha de factura, N° de factura, contado/crédito, exención de IVA por ítem), y que el emprendedor pueda capturar cantidad y costo en la unidad que le resulte natural (Kg), sin calcular a mano el precio por gramo.

## Alcance

- `models/PurchaseOrder.ts`: `purchaseDate` (fecha de la factura del proveedor, distinta de `createdAt`), `supplierInvoiceNumber`, `paymentTerm` ("cash"|"credit"), `PurchaseOrderItem.isVatExempt`.
- `pages/PurchasesPage.tsx`: selector de unidad de captura (Kg/Gr) — al elegir Kg, cantidad y costo se ingresan en kilos y el sistema los convierte a gramos (unidad base de `RawMaterial`) automáticamente antes de guardar. Checkbox de exención de IVA por ítem.
- Proveedores, Nueva orden y Órdenes ahora en fichas colapsables (mismo patrón que `/inventory` y `/finance`), para no perder el hilo cuando el catálogo crezca.
- Listado de Órdenes rediseñado: botones "Recibir"/"Anular"/"Ver" arriba a la derecha; "Factura N°" y "Total" abajo a la derecha (mismo lenguaje visual que "Ventas registradas").

## Anulación de Compra (devolución a proveedor)

- `services/purchaseService.ts`: `voidPurchaseOrder`. Si la orden seguía `"ordered"` (no recibida), solo se cancela. Si ya estaba `"received"`, **revierte el stock que había sumado** (consume de vuelta la materia prima o el semielaborado que se había recibido) antes de marcarla `"voided"`.
- `pages/OrdersPage.tsx` (ruta `/orders`, sin ítem en Sidebar — se accede desde "Ver" en `/purchases`): detalle completo de cada orden, con el mismo botón de anular.

## Fuera de alcance (Backlog explícito)

- Cuentas por Pagar completas (llevarle la cuenta a los proveedores como se le lleva a los clientes) — el campo `paymentTerm` queda registrado para contabilidad, pero no genera un saldo por pagar ni un módulo de pagos a proveedores todavía.

## Estado

🟢 Cerrado.