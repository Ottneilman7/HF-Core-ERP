# BP-035

Retención de IVA en Cuentas por Cobrar

Versión: 1.0
Última actualización: 30/07/2026
Origen: feedback del CEO probando Facturación con clientes reales de distintos tipos de agente de retención. Decisión de arquitectura completa en ADR-009 — este Blueprint es el entregable que faltaba documentar formalmente.

---

## Objetivo

Que el saldo real que un cliente debe pagar (Cuentas Pendientes, `/finance`) refleje correctamente su tipo de agente de retención de IVA, no el monto de la factura sin ajustar.

## Alcance

- `models/Invoice.ts`: campos nuevos `retentionFraction`, `retainedAmount`, `netAmountDue`.
- `services/invoiceService.ts`: `createInvoiceFromSale` calcula la retención según `Customer.retentionAgentType` y es quien ajusta el saldo del cliente (ya no `salesService`).
- `services/salesService.ts`: `createSale` deja de tocar el saldo; `voidSale` revierte usando `invoice.netAmountDue` (con respaldo a `invoice.total`/`sale.total` para facturas antiguas sin el campo).
- `pages/InvoicesPage.tsx`: desglose visible (Total factura, Retenido por el cliente, A cobrar).

## Fórmula

`netAmountDue = baseImponible + ivaAmount − (ivaAmount × retentionFraction)`

`retentionFraction`: `none` → 0, `agent_75` → 0.75, `agent_100` → 1.

## Estado

🟢 Cerrado — ver ADR-009 para el detalle completo de la decisión y sus consecuencias (incluida la lección sobre campos nuevos en modelos existentes).