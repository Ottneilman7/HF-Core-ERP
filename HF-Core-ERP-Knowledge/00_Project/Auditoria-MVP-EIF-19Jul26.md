# Auditoría del proyecto — Fase 1 (19/07/2026)

Realizada según lo solicitado: lectura de ENTREPRENEUR-INTELLIGENCE-FRAMEWORK-EIF.md → EL-Verdadero-MVP-EIF.md → toda la documentación de estado → estado real del código descrito en CHANGELOG/BP/ADR.

## Qué existe (confirmado en CHANGELOG, BP-011 a BP-014, ADR-003/004)

- Catálogo real de materia prima, productos y recetas multinivel (avena/maní → Granola/Peanut Butter → barras finales), con costeo derivado del Excel real del negocio.
- Cálculo recursivo de necesidad de materia prima, con semielaborados de inventario propio (no se desarman en cascada).
- Producción por Demanda (`/production`): decide cuánto producir, calcula qué sacar de almacén, respeta el máximo producible.
- Centro de Decisiones (`/decisions`) real, limpio de placeholders.
- Landing con navegación, recetas ocultas del emprendedor (no se expone la fórmula).

Todo esto cumple la Ley IX del EIF (simplicidad) y la Ley III (priorizar, no acumular) — es trabajo sólido, no se toca.

## Qué falta (el hallazgo principal)

**Flujo 1 del verdadero MVP — "Configurar el negocio" — nunca se construyó.** No existe `Company`, no existe página de configuración, no hay dónde vive la moneda base, el margen por defecto ni el catálogo de impuestos. El desarrollo saltó directo a Flujo 2 (Catálogo) y Flujo 4 (Producción).

Esto no es un error del equipo — BP-011/012/013/014 respondían a la prioridad real del CEO en su momento (validar el negocio de Honestly Foods primero). Pero antes de avanzar a Compras, Ventas o Finanzas, Flujo 1 debe existir: esos módulos van a necesitar moneda, margen e impuestos ya definidos.

También falta, por completo, todo Flujo 3 (Compras), Flujo 5 (Vender), Flujo 6 (Cobrar) y Flujo 7 (Promocionar) — consistente con PROJECT_STATUS.md, que los lista como no iniciados.

## Qué debe desarrollarse primero

**Sprint 1: Configuración** (Empresa, Parámetros, Impuestos) — bloquea silenciosamente todo lo que sigue. Ver BP-016.

Después, en el orden del verdadero MVP: Flujo 3 (Compras) es el siguiente hueco real, porque Producción ya sabe "qué falta" pero no hay dónde registrar una orden de compra ni actualizar costos cuando llega la mercancía.

## Riesgos

- **Riesgo de alcance:** el CEO recibió una propuesta externa de "empezar de nuevo desde Sprint 0". Aplicado literalmente, eso violaría la Regla 1 de AI_CONTEXT.md (nunca reemplazar trabajo existente) y descartaría BP-011 a BP-014, que ya están probados con datos reales del negocio. Se interpreta "empezar de nuevo" como *completar la base que falta*, no como *reescribir lo que funciona*.
- **Riesgo de persistencia:** BP-015 sigue "no iniciado" formalmente, pero Configuración ya lo necesita para ser útil el primer día. Se resuelve parcialmente en Sprint 1 (ver BP-016) sin esperar el ADR completo de Firebase/Vercel.
- **Riesgo de reconciliación pendiente:** `productPresentations.ts` vs. patrón `Product` de BP-012 sigue sin resolver (registrado en PROJECT_STATUS.md). No bloquea Sprint 1, pero debe resolverse antes de avanzar a Ventas.

## Decisiones tomadas en esta sesión

- Sprint 1 = Configuración (Empresa, Parámetros, Impuestos), ver BP-016.
- Persistencia de Configuración vía `localStorage`, adelantando BP-015 Fase 1 solo para este módulo (no para Producción/Inventario todavía — eso sigue pendiente de la decisión completa del CEO).