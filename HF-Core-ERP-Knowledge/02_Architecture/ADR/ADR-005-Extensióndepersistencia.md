# ADR-005  Extensión de persistencia local (localStorage) a Materia Prima

**Fecha:** 19/07/2026, durante ENT-017 (BP-018 Compras).

**Estado:** Aprobada e implementada.

---

## Problema

BP-014 dejó registrado que "confirmar una producción y descontar stock real" no era posible porque `rawMaterials.ts` es un archivo estático — no hay dónde persistir un cambio. BP-015 registró el plan (Fase 1: `localStorage` como puente; Fase 2: Firebase/Vercel) pero quedó "no iniciado", a la espera de que el CEO decidiera cuándo arrancarlo.

BP-016 (Configuración) sí necesitó persistencia real desde el primer día y adelantó Fase 1 de BP-015, pero *solo* para Configuración (`Company`, `BusinessParameters`, `TaxConfig`).

Compras (BP-018) no puede construirse sin resolver lo mismo para Materia Prima: "Recepción → Actualización de costos" (EL-Verdadero-MVP-EIF.md, Flujo 3) significa, en código, que `currentStock` y `unitCost` de `RawMaterial` tienen que poder cambiar y **quedarse cambiados** después de recargar la página.

## Decisión

Se extiende el mismo patrón ya usado en `configService.ts` (BP-016) a Materia Prima, mediante un servicio nuevo — `rawMaterialInventoryService.ts` — en vez de modificar `rawMaterials.ts` o `RawMaterial.ts`:

1. **`rawMaterials.ts` pasa a ser exclusivamente la semilla** (valor inicial), tal como ya preveía BP-015. No se vuelve a editar a mano para reflejar stock o costo real.
2. **`localStorage` guarda un "override" por materia prima** (`currentStock`, `unitCost`, `updatedAt`), indexado por `id`. Si no hay override, se usa el valor de la semilla — así el catálogo sigue funcionando igual para toda materia prima que Compras todavía no haya tocado.
3. **`RawMaterial.ts` (el modelo) no se modifica** — Regla 1, AI_CONTEXT.md. Cualquier página que ya use `import { rawMaterials } from "../data/rawMaterials"` directamente (ej. `ProductionSimulator`, si aplica) sigue funcionando exactamente igual; simplemente no verá los cambios de Compras hasta que se migre a leer desde `rawMaterialInventoryService.getEffectiveRawMaterials()`.

## Consecuencias

- Compras y Producción hoy leen la materia prima de dos fuentes distintas (`data/rawMaterials.ts` directo vs. `rawMaterialInventoryService`). Esto es una inconsistencia temporal aceptada a propósito, para no reabrir ni arriesgar el código de Producción (ya cerrado y probado) dentro de esta entrega.
- **Backlog registrado, no bloqueante:** migrar `ProductionSimulator`/`ProductionPage` a `rawMaterialInventoryService.getEffectiveRawMaterials()` en una sesión futura, para que "cuánto tengo" sea el mismo número en Producción y en Compras. Hasta entonces, Producción seguirá mostrando el stock de la semilla, no el actualizado por compras reales.
- Esta decisión NO reemplaza la Fase 2 de BP-015 (Firebase/Vercel), que sigue pendiente y sigue siendo necesaria para multiusuario/multi-dispositivo. Es, igual que en BP-016, una extensión puntual de Fase 1 al segundo dato que la operación diaria ya necesita real.

## Referencia

Entregable de origen: BP-018 (Compras).