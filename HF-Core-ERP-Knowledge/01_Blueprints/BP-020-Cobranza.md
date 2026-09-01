# BP-020  Cobranza (Cuentas por Cobrar → Pagos → Saldos)

Versión: 1.0
Última actualización: 19/07/2026
Origen: EL-Verdadero-MVP-EIF.md, Flujo 6 ("Cobrar") — cierra el ciclo Configurar → Catálogo → Comprar → Producir → Vender → Cobrar del verdadero MVP.

---

## Objetivo

Que un pago de un cliente reduzca de verdad su saldo pendiente (`Customer.balance`), con historial de pagos consultable.

## Alcance (esta entrega)

- `models/Payment.ts`.
- `services/paymentService.ts`: `registerPayment` reutiliza `customerBalanceService.adjustBalance` (BP-019) con monto negativo — cero código nuevo de manejo de saldo, solo el registro del pago en sí.
- `pages/FinancePage.tsx` (ruta `/finance`, reemplaza el `ComingSoonPage` actual): cuentas pendientes, formulario de registro de pago, historial.
- Pruebas: `paymentService.test.ts` (6 casos).

## Decisión de ruta

El `Sidebar` no tiene un ítem "Cobranza" separado — el módulo vive en `/finance` (el ítem "📈 Finanzas" ya existente). Es una decisión deliberada, no un descuido: Cuentas por Cobrar es funcionalmente parte de Finanzas. Si en el futuro Finanzas crece con KPIs semanales/mensuales o rentabilidad (ver ENTREPRENEUR_JOURNEY.md, Flujo semanal/mensual), se evaluará separar Cobranza en su propia ruta — no antes, para no fragmentar el menú sin necesidad real.

## Decisiones de diseño

1. **Se permiten abonos parciales.** El monto del pago no tiene que ser igual al saldo pendiente.
2. **Se permite que el saldo quede negativo** (el cliente pagó de más — a favor). No se bloquea; en un negocio real esto ocurre (anticipos, redondeo) y bloquear el pago sería peor que dejar el saldo en negativo.
3. **No hay validación contra `creditLimit`/`creditDays`** en esta entrega — esos campos de `Customer` ya existían pero no se usan activamente todavía. Backlog.

## Fuera de alcance (Backlog explícito)

- Alertas de facturas vencidas (EL-Verdadero-MVP-EIF.md las menciona en el Centro de Decisiones: "Hay tres facturas vencidas") — requiere que `Sale` tenga fecha de vencimiento, que hoy no existe (BP-019 no la modeló porque una venta de contado no vence). Backlog: agregar `dueDate` a `Sale` cuando `paymentType === "credit"`, usando `Customer.creditDays`.
- Validar el límite de crédito (`creditLimit`) antes de permitir una venta a crédito nueva.
- Recibo o comprobante de pago imprimible.

## Checklist de cierre (Regla 20, TEAM_RULES)

- [X] Copiar `models/Payment.ts`, `services/paymentService.ts` (+test), `pages/FinancePage.tsx` al repo real.
- [X] `npx vitest run`.
- [X] En `AppRouter.tsx`: reemplazar el `ComingSoonPage` de `/finance` por `<FinancePage />`.
- [X] Prueba en navegador: con el saldo que dejó la venta a crédito de BP-019 (Supermercado El Centro, $135), registrar un pago de $50 y confirmar que el saldo baja a $85.
- [X] Confirmación del CEO.
- [X] Commit + push.

## Estado

✅ Finalizado — código y pruebas listos, listo checklist arriba.

## 🎉 Con esto se cierra el ciclo completo del verdadero MVP

Configurar (BP-016) → Catálogo (ya existía) → Comprar (BP-018) → Producir (BP-014, con el puente de ADR-006) → Vender (BP-019) → Cobrar (BP-020). El siguiente paso natural, según BP-019, es **Producción Fase 2**: cerrar el puente manual de inventario de producto terminado conectando Producción real con Compras y Ventas — quedaría el único hueco de automatización real que falta para que el ciclo funcione solo, sin pasos manuales.