# Adenda a ADR-003 — Corrección de estado de implementación

**Fecha:** 17/07/2026, durante ENT-010.

## Hallazgo

ADR-003 registraba el Nivel 2 (Centro de Decisiones) con estado "Aprobada e implementada" desde ENT-008A. Al revisar el código real durante ENT-010, se confirmó que esto no era exacto:

- `HomePage.tsx` existía como tarjeta estática sin ninguna lógica de decisión.
- `HomePage.tsx` ni siquiera estaba registrada en `AppRouter` — la ruta `"/"` apuntaba a `CustomersPage`.

Es decir: la arquitectura de dos niveles estaba **decidida y documentada**, pero el Nivel 2 no estaba **construido**. Regla de Oro (START_HERE.md) exige tratar esto como lo que es: una decisión sin respaldo real hasta que se implemente.

## Corrección (ENT-010)

- `HomePage.tsx` se convierte en el Centro de Decisiones real: consume `ProductionAlertsContext` y renderiza únicamente acciones (`MaterialShortageAlert`), nunca tablas ni contadores — cumpliendo el principio original de ADR-003.
- `AppRouter` corregido: `"/"` → `HomePage`. `CustomersPage` queda exclusivamente en `/customers` (ya existía esa ruta, estaba duplicada).

## Estado actualizado

ADR-003 pasa a: **Aprobada. Implementación del Nivel 1 (Operativo) completa desde ENT-008A. Implementación del Nivel 2 (Decisiones) completada en ENT-010** — con una única fuente de decisiones activa por ahora (alertas de materia prima, BP-010). Se espera que futuros entregables (Compras, Cobranza, KPIs semanales — ver ENTREPRENEUR_JOURNEY.md) se sumen al mismo Centro de Decisiones sin crear páginas nuevas.