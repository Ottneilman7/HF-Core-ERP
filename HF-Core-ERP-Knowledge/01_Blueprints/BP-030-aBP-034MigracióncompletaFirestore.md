# BP-030 a BP-034

Migración completa a Firestore (Compras, Clientes, Ventas/Pagos/Facturas) y Registro Extendido de Pagos

Versión: 1.0
Última actualización: 30/07/2026
Origen: ADR-008 (Fase A) — continuación módulo por módulo, mismo criterio que Materia Prima (BP-025) y Recetas (BP-026).

---

## BP-030 — Fix de consolidación previo a esta ronda

Antes de seguir migrando, se revisaron páginas no cubiertas por ningún BP anterior (mismo punto ciego de `InventoryPage.tsx` en BP-025):
- `CustomersPage.tsx` leía `data/customers.ts` directo, ignorando `customerBalanceService` — corregido.
- `DecisionCenterPage.tsx` y `ProductsPage.tsx` revisadas, sin problema (no leen datos que cambien con Compras/Producción/Ventas).

## BP-031 — Compras (Proveedores + Órdenes) a Firestore

- `services/purchaseService.ts` reescrito a Firestore: `businesses/{id}/suppliers`, `businesses/{id}/purchaseOrders`.
- Migración de datos ya creados vía página temporal (`MigrateSuppliersOrdersPage.tsx`, retirada tras uso).
- `PurchasesPage.tsx`: carga asíncrona; orden de la lista de órdenes (más recientes primero, botón para invertir); ficha de Proveedores ampliada (Razón social, denominación comercial, RIF/CI, contacto, teléfono, ciudad, dirección) y hecha colapsable; edición de proveedores (`updateSupplier`).

## BP-032 — Clientes a Firestore

- `services/customerBalanceService.ts` reescrito a Firestore: `businesses/{id}/customers`. Reemplaza el patrón semilla+overrides de `localStorage` — Firestore ya es la única fuente de verdad, no hace falta seguir fusionando con `customers.ts`.
- Migración de datos (semilla + clientes agregados desde la app + saldos reales) vía página temporal.
- Ajuste mínimo de `await` en `salesService.ts` y `paymentService.ts` (consumidores de `adjustBalance`/`getCustomerById`) para no romper mientras se migraba el resto.
- `CustomersPage.tsx`: carga asíncrona, ficha de cliente ampliada (denominación comercial, RIF/CI, agente de retención, dirección) y edición (`updateCustomer`).
- `SalesPage.tsx` y `FinancePage.tsx`: catálogo de clientes migrado a estado asíncrono.

## BP-033 — Ventas, Pagos y Facturas a Firestore

- `services/salesService.ts`, `services/paymentService.ts`, `services/invoiceService.ts` reescritos a Firestore: `businesses/{id}/sales`, `.../payments`, `.../invoices`.
- Numeración de facturas: contador movido a un campo (`invoiceCounter`) en el documento principal del negocio, incrementado con una transacción de Firestore (`runTransaction`) — evita duplicar número.
- Migración de datos existentes (ventas, pagos, facturas, y el valor del contador vigente) vía página temporal.
- `SalesPage.tsx`, `InvoicesPage.tsx`, `FinancePage.tsx`: todos los listados pasan a carga asíncrona.

## BP-034 — Registro extendido de pagos

- `models/Payment.ts` ampliado: método de pago (efectivo, transferencia, pago móvil, cheque, tarjeta, criptomoneda), N° de referencia, institución de origen/destino, y **fecha real del pago** (`paymentDate`) separada de `createdAt` (cuándo se registró en el sistema) — para poder conciliar contra el estado de cuenta bancario real, no contra cuándo se tecleó en la app.
- `pages/PaymentsPage.tsx` (ruta `/payments`, sin ítem en Sidebar — se accede desde "Ver" en `/finance`, mismo patrón que `/invoices` desde `/sales`): detalle completo de cada pago.
- **Campo de comprobante (foto/PDF) queda deshabilitado a propósito** — requiere Firebase Storage, que tiene costo; decisión del CEO de posponerlo hasta que sea necesario. El modelo (`proofUrl`, `proofFileName`) ya está listo para conectarlo sin volver a tocar el resto del código cuando llegue el momento.

## Fuera de alcance (Backlog explícito)

- Conectar Firebase Storage para comprobantes de pago (pospuesto por costo).
- Migrar Marketing a Firestore (único módulo que sigue en `localStorage`).

## Checklist de cierre (Regla 20, TEAM_RULES)

Ya completado por el CEO en sesión: las 3 migraciones de datos (Compras, Clientes, Ventas/Pagos/Facturas), pruebas de persistencia tras recargar, registro de pagos con todos los campos nuevos. Pendiente: commit + push.

## Estado

🟢 Cerrado — pendiente commit + push.