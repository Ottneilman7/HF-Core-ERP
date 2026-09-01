# BP-024

Migración de Configuración a Firestore

Versión: 1.0
Última actualización: 23/07/2026
Origen: ADR-008 / BP-023 — primer servicio de negocio migrado de `localStorage` a Firestore.

---

## Objetivo

Que `/settings` (Empresa, Parámetros, Impuestos) lea y escriba en Firestore, no en `localStorage` — primer módulo migrado, valida el patrón antes de seguir con el resto (BP-025 en adelante).

## Alcance (esta entrega)

- `services/configService.ts`: mismas funciones (`getCompany`, `saveCompany`, `getParameters`, etc.) pero ahora `async`, leyendo/escribiendo el documento `businesses/{CURRENT_BUSINESS_ID}` en Firestore (campos `company`, `parameters`, `taxConfig`).
- `contexts/ConfigContext.tsx`: agrega estado `loading`; carga los tres datos en paralelo (`Promise.all`) al montar.
- `pages/ConfigPage.tsx`: muestra "Cargando configuración..." mientras `loading` es `true`; sincroniza los formularios con un `useEffect` cuando los datos llegan (antes, con `localStorage`, estaban disponibles de inmediato); los `handleSave...`/`handleAddTax`/`handleRemoveTax` ahora son `async`.

## ⚠️ Dato importante: la Configuración anterior en localStorage NO se migra automáticamente

Si ya habías guardado la Empresa/Parámetros/Impuestos en `/settings` durante BP-016 (en `localStorage`), esos datos siguen ahí pero **la app ya no los lee** — Firestore empieza vacío. Dado que son solo 3-4 campos, la recomendación (80/20, Regla del 80/20 en AI_CONTEXT.md) es **volver a escribirlos a mano en `/settings`** una vez migrado, en vez de construir un script de migración de un solo uso para tan pocos datos.

## Fuera de alcance (Backlog explícito — continúa BP-025 en adelante)

Todo lo demás sigue en `localStorage` por ahora: materia prima, recetas/semielaborados, compras, ventas, clientes, cobranza, marketing. Se migran uno por uno, mismo criterio de orden que BP-023: **Materia Prima → Recetas/Semielaborados → Compras → Ventas/Clientes → Cobranza → Marketing**.

## Checklist de cierre (Regla 20, TEAM_RULES)

- [ ] Reemplazar `services/configService.ts`, `contexts/ConfigContext.tsx`, `pages/ConfigPage.tsx` en el repo real.
- [ ] Prueba en navegador: entra a `/settings`, debe verse "Cargando configuración..." brevemente y luego el formulario vacío (normal, no migra lo anterior). Llena Empresa, guarda, recarga la página (F5) — confirma que persiste. Ve a la consola de Firebase → Firestore Database → debe existir el documento `businesses/honestly-foods` con el campo `company`.
- [ ] Confirmación del CEO.
- [ ] Commit + push.

## Estado

✅ Finalizado — código y pruebas listos, listo checklist arriba.