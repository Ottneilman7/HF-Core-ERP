# ADR-010 — Permisos por módulo explícito en vez de grupos de rol fijos

## Contexto
La primera versión de Fase 2 (roles) definía grupos fijos por rol: `canWriteSales` (owner/manager/sales), `canWriteOperations` (owner/manager/production), etc., codificados directamente en `firestore.rules`. Funcionaba, pero tenía un problema real detectado al probarlo: Ventas necesitaba ver Cobranza, pero el diseño fijo no dejaba margen para que el Dueño decidiera caso por caso qué le conviene mostrar a cada persona — cualquier ajuste requería volver a tocar código y reglas.

## Decisión
Cada `Membership` guarda una lista explícita `modules: ModuleKey[]`. El rol sigue existiendo (para la etiqueta y como plantilla de módulos por defecto al crear a alguien), pero el control de acceso real —tanto en la UI (`menuConfig.ts`, `RouteGuard`) como en Firestore Rules— se resuelve contra esa lista, no contra el rol.

Las reglas leen el array con `get()` sobre el documento de membresía:
```
function hasModule(businessId, moduleName) {
  return isElevated(businessId)
    || (isMember(businessId) && moduleName in membershipDoc(businessId).data.modules);
}
```

## Alternativas consideradas
1. **Mantener grupos fijos por rol** (lo que había) — simple, pero rígido: cualquier caso especial (Ventas viendo Cobranza) exige cambiar código.
2. **Un rol nuevo por cada combinación posible** — no escala; con 7 módulos posibles, el número de combinaciones crece rápido y cada una necesitaría su propio nombre y lógica.
3. **Lista explícita de módulos por persona (elegida)** — el rol da un punto de partida sensato, pero cada persona puede ajustarse sin tocar código. Es también la base natural para permisos más finos si el negocio lo necesita después.

## Consecuencias
- `/team` necesita una UI de checkboxes (uno por módulo) en vez de solo un selector de rol — más superficie de UI, pero controlada solo por Dueño/Gerente.
- Documentos de `Membership` creados antes de este cambio no tienen `modules` — todo el código que los lee usa `?? []` o `?? defaultModulesFor(role)` para no romper (Regla 11).
- Equipo/Respaldo/Configuración se excluyen deliberadamente de este sistema (ver BP-054) — no son "un módulo más" para evitar que alguien los delegue sin darse cuenta de la implicación.

## Estado
Implementado (BP-054).