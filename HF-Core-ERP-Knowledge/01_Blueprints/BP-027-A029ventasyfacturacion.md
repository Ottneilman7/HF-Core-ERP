# BP-027 a BP-029

Clientes en Ventas, Venta de Materia Prima/Semielaborados, Anulación de Venta y Facturación

Versión: 1.0
Última actualización: 26/07/2026
Origen: feedback directo del CEO probando `/sales` en producción (uso real, no hipotético).

---

## BP-027 — Ficha de Cliente ampliada

- `models/Customer.ts` extendido (Regla 1, campos opcionales): `tradeName`, `taxId`, `retentionAgentType` ("none"|"agent_75"|"agent_100"), `address`.
- `services/customerBalanceService.ts`: `createCustomer()` — alta de cliente nuevo desde la app, guardado aparte de `customers.ts` (localStorage, key `hf_customers_added`), fusionado en `getEffectiveCustomers()`.
- `pages/SalesPage.tsx`: sección "+ Nuevo cliente" con Razón social, Denominación comercial, Persona Natural/Jurídica, RIF/CI, Agente de retención, contacto, teléfono, ciudad, dirección.
- `pages/CustomersPage.tsx`: muestra los campos nuevos cuando existen.

## BP-028 — Vender materia prima y semielaborados

- `models/Sale.ts`: `SaleItem` ahora referencia UNO de tres (`productId` | `componentRecipeId` | `rawMaterialId`) — mismo patrón dual que `RecipeItem` (ADR-004) y `PurchaseOrderItem` (ADR-007).
- `services/salesService.ts`: `createSale` valida y descuenta el inventario correcto según el tipo (todo o nada).
- `pages/SalesPage.tsx`: selector "¿Qué vas a vender?" (Producto terminado / Semielaborado / Materia prima suelta) — evita un desplegable único gigante mezclando los tres catálogos.

## BP-029 — Anular venta + Facturación

### Anular venta
- `Sale` gana `status: "active" | "voided"`.
- `salesService.voidSale()`: revierte inventario (de los tres tipos) y, si era a crédito, revierte el cargo al saldo del cliente. No se edita una venta — se anula y se vuelve a crear correcta (trazabilidad).
- Botón "Anular" en `/sales`, junto a cada venta activa.

### Facturación
- `models/Invoice.ts`, `services/invoiceService.ts`: numeración secuencial de 5 dígitos (`00001` en adelante, `localStorage` key `hf_invoice_counter`), IVA calculado del impuesto marcado `isDefault` en `/settings`.
- Cada venta confirmada genera automáticamente su factura.
- `pages/InvoicesPage.tsx` (ruta `/invoices`, sin ítem en Sidebar a propósito — se accede desde "📄 Ver factura" en cada venta): formato inspirado en el talonario real del CEO — datos de la empresa (`/settings`) arriba a la izquierda, N° de factura y fecha arriba a la derecha, datos del cliente (incluida Dirección) y desglose Base Imponible/IVA/Total.
- Enlace directo `/sales` → `/invoices#invoice-{saleId}` (ancla, salta a la factura exacta).
- Compartir/descargar como imagen (`html2canvas`, dependencia nueva): dos botones separados — **Descargar** (siempre baja el `.jpg` al dispositivo) y **Compartir** (panel nativo del sistema — WhatsApp, correo, etc. — con aviso si el dispositivo no lo soporta). Se separaron tras confirmar que "Compartir" único causaba confusión en escritorio (Windows abre panel de compartir de todos modos, sin opción clara de solo descargar).

## Fix adicional en esta ronda: consolidación de `/inventory`

Encontrado al confundir la materia prima deprecada "Mantequilla de Maní" (id `"3"`, inactiva) con el semielaborado real (receta `peanut-butter`) — dos registros con nombre casi idéntico en colecciones distintas. `InventoryPage.tsx` ahora muestra tres secciones en un solo lugar: Materia Prima (filtra inactivos), Semielaborados, Producto Terminado (movido desde `/sales`).

## Fuera de alcance (Backlog explícito)

- Rediseño de Granola: producir a granel y "empacar" en presentaciones (50g/200g/400g) como paso aparte, en vez de que cada presentación tenga su propia receta que consume materia prima directo. El más grande de los pendientes — afecta el motor de cálculo ya probado.
- Módulo de carga inicial de inventario/facturas de compra (alternativa rápida a crear una Orden de Compra completa cada vez).
- Dashboard con gráficas (ventas diarias/mensuales, # clientes por mes, temporalidad ajustable) — registrado, "para futuro" según el propio CEO.
- Continuar la migración a Firestore: Compras (proveedores/órdenes), Ventas/Clientes/Cobranza, Marketing siguen en `localStorage` (ver ADR-008/BP-023).

## Checklist de cierre (Regla 20, TEAM_RULES)

Ya completado por el CEO en la sesión: instalación de `html2canvas`, prueba de venta con los tres tipos de ítem, prueba de anular, prueba de factura con descarga y compartir. Pendiente: commit + push de todo lo anterior a esta documentación.

## Estado

🟢 Cerrado — 
✅ Finalizado 