# ADR-009

# Cálculo del monto a cobrar según Agente de Retención de IVA

**Fecha:** 30/07/2026, feedback del CEO tras probar Facturación con clientes reales.

**Estado:** Aprobada e implementada (BP-035).

---

## Problema

El saldo de cuentas por cobrar (`Customer.balance`) se ajustaba con `Sale.total` — la suma de precio × cantidad de los ítems, **sin impuesto**. La Factura sí calculaba correctamente Base Imponible + IVA, pero ese cálculo vivía separado y nunca llegaba a actualizar el saldo real del cliente. Resultado: Cuentas Pendientes mostraba la base imponible (sin IVA) para todos los clientes, sin importar su tipo de agente de retención.

En Venezuela (y regímenes fiscales similares), un cliente Agente de Retención de IVA no paga el IVA directo al vendedor — retiene un porcentaje (75% o 100%) y lo entera directamente al ente tributario (SENIAT), entregando un comprobante de retención. El vendedor solo cobra el resto.

## Decisión

**Fórmula:** `netAmountDue = baseImponible + ivaAmount − (ivaAmount × retentionFraction)`

Donde `retentionFraction` sale de `Customer.retentionAgentType`: `none` → 0 (paga el total completo), `agent_75` → 0.75 (paga base + 25% del IVA), `agent_100` → 1 (paga solo la base, no paga nada de IVA).

**Dónde vive el cálculo:** en `invoiceService.createInvoiceFromSale`, no en `salesService`. Razón: `Sale` es un registro de inventario/operación (qué se vendió, de dónde salió), no sabe de impuestos ni de retención — mezclar ambas responsabilidades habría obligado a que `Sale` conociera el `TaxConfig` y el `Customer` completo, algo que no le corresponde. `Invoice` ya combina ambos (venta + cliente + impuestos), es el lugar correcto.

**Efecto sobre el saldo del cliente:** `salesService.createSale` deja de ajustar el saldo. Ahora es `invoiceService.createInvoiceFromSale` quien lo hace, con `netAmountDue` (el monto correcto), inmediatamente después de calcular la factura.

**Anulación:** `salesService.voidSale` ya no revierte `sale.total` — busca la factura asociada (`invoiceService.getInvoiceBySaleId`) y revierte `invoice.netAmountDue`, el monto que realmente se había cargado.

**Transparencia:** `Invoice` guarda `retentionFraction`, `retainedAmount` (lo que el cliente retiene, no cobra Otto) y `netAmountDue` (lo que sí debe pagar) — visibles en `/invoices` como desglose, para que el CEO pueda conciliar contra los comprobantes de retención que reciba.

## Consecuencias

- **Compatibilidad con facturas anteriores a este cambio:** no tienen los campos `retentionFraction`/`retainedAmount`/`netAmountDue` (no existían al crearse) — causó una caída real de `/invoices` y de `/sales` (`Cannot read properties of undefined`) hasta agregar valores por defecto (`?? 0`, `?? inv.total`) en la UI. **Lección aplicada de aquí en adelante:** cualquier campo nuevo agregado a un modelo ya en uso debe tener respaldo (`??`) en cada lugar donde se lee, no solo donde se escribe — se repitió el mismo patrón de bug 3 veces seguidas (retención en `/invoices`, fecha de pago en `/finance` y `/payments`) antes de adoptar esta regla de forma sistemática.
- Los saldos de ventas hechas ANTES de este fix quedaron con el monto viejo (incorrecto) — no se recalculan solos; requieren anular y volver a crear la venta (ya hecho por el CEO con sus 3 casos de prueba).

## Referencia

Entregable de origen: BP-035 (parte de la Entrega 2 acordada con el CEO tras BP-034).