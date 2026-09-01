# BP-036

Mejoras de UX: fichas colapsables, filtro alfabético, edición en línea, navegación entre módulos

Versión: 1.0
Última actualización: 30/07/2026
Origen: feedback del CEO usando la app con datos reales, previendo crecimiento del catálogo.

---

## Objetivo

Que la app siga siendo cómoda de usar cuando el catálogo de materia prima, clientes, proveedores, ventas y pagos crezca mucho más allá de los datos de prueba actuales.

## Cambios

- **Fichas colapsables** (mismo componente reutilizado en `/inventory`, `/finance`, `/purchases`): cada sección (Materia Prima, Semielaborados, Producto Terminado / Cuentas pendientes, Registrar pago, Historial de pagos / Proveedores) se despliega al hacer clic en su encabezado, con flecha ▲/▼ indicando el estado.
- **Filtro alfabético agrupado** en `/inventory` (A-D, E-H, I-L, M-P, Q-T, U-Z): aparece automáticamente cuando una sección supera 8 artículos, para no tener que hacer scroll manual en catálogos grandes.
- **Edición en línea** de Clientes (`/customers`, vía `/sales`) y Proveedores (`/purchases`): botón "Editar" por ficha, sin necesitar una pantalla aparte.
- **Orden cronológico con botón de inversión** en Compras (Órdenes), Ventas (Ventas registradas) y Cobranza (Historial de pagos): más reciente primero por defecto, con opción de ver desde el más antiguo.
- **Navegación cruzada entre módulos** (`/sales` → `/invoices`, `/finance` → `/payments`): enlaces con ancla (`#invoice-{id}`, `#payment-{id}`) que saltan directo al registro correspondiente — necesitó scroll manual (`scrollIntoView`) porque la navegación de React Router no dispara el salto nativo del navegador a anclas.
- **Rediseño de la ficha de Venta** (`/sales`): cliente/fecha arriba a la izquierda, botones "Anular"/"Ver factura" arriba a la derecha; productos abajo a la izquierda, "Total Factura"/"Total a Pagar" abajo a la derecha — separa visualmente el monto fiscal del monto que realmente paga el cliente (ver ADR-009).

## Checklist de cierre (Regla 20, TEAM_RULES)

Ya probado por el CEO en sesión (fichas colapsables, edición, orden, navegación cruzada, layout de venta). Pendiente: commit + push.

## Estado

🟢 Cerrado — pendiente commit + push.