# BP-017

Sistema de Formularios (FormInput, FormSelect, FormButton)

Versión: 1.0
Última actualización: 19/07/2026
Origen: feedback del CEO tras probar BP-016 en navegador — los campos de `ConfigPage` (y por extensión los de `ProductionPage`) usaban `<input>`/`<select>`/`<button>` sin estilo, muy por debajo del acabado de `ResetButton.tsx` (BP-014).

---

## Objetivo

Un solo set de componentes de formulario reutilizables, con el mismo lenguaje visual que `ResetButton` (gradiente sutil, sombra, efecto de presión, bordes redondeados), para que cualquier pantalla nueva del ERP no vuelva a improvisar estilos de campo.

## Alcance (esta entrega)

- `components/FormInput.tsx`: input de texto/número con label, glow de foco (`colors.primary`) y sombra interna sutil.
- `components/FormSelect.tsx`: select con la misma apariencia, flecha propia (se quita la flecha nativa del navegador con `appearance: none`).
- `components/FormButton.tsx`: mismo efecto 3D que `ResetButton` (gradiente + sombra + `translateY` al presionar), pero parametrizable (`variant="primary"` en verde `colors.primary`, `variant="secondary"` en azul `colors.secondary`) en vez de fijo en rojo — `ResetButton` sigue siendo el componente correcto para acciones destructivas/reinicio, no se toca.
- `pages/ConfigPage.tsx` migrada a los tres componentes nuevos (reemplaza la entrega de BP-016).

## Decisión de diseño

Todos los colores salen de `theme/colors.ts` (paleta oscura ya existente: `background`, `surface`, `card`, `primary`, `border`, etc.) — cero colores nuevos inventados, para que un cambio de paleta a futuro siga actualizando todo el sistema desde un solo archivo, tal como ya ocurre con `Sidebar.tsx` y `ResetButton.tsx`.

`FormSelect.tsx` se entrega en esta ronda aunque `ConfigPage` todavía no usa ningún `<select>` (Impuestos usa inputs de texto/número) — se adelanta porque `ProductionPage` sí tiene menús desplegables (elegir qué producir) y es el siguiente lugar donde se va a necesitar.

## Fuera de alcance de esta entrega (Backlog explícito)

- **Aplicar `FormSelect`/`FormInput` a `ProductionPage.tsx`.** No se incluye en esta entrega para no bloquear el avance a Compras — el CEO priorizó cerrar rápido. Queda registrado como ajuste visual pendiente, de bajo riesgo (no cambia lógica, solo estilos), a aplicar en cualquier sesión futura que toque esa página.
- Validación visual de errores (borde rojo, mensaje bajo el campo) — no había ningún caso de error que resolver todavía en Configuración.

## Checklist de cierre (Regla 20, TEAM_RULES)

- [X] Copiar `FormInput.tsx`, `FormSelect.tsx`, `FormButton.tsx` a `src/components/`.
- [X] Reemplazar `src/pages/ConfigPage.tsx` con la versión de esta entrega.
- [X] Prueba en navegador: `/settings` se ve con inputs redondeados, glow al hacer foco, y el botón "Guardar" con el mismo efecto 3D que "Reiniciar consulta" en `/production`.
- [X] Confirmación del CEO.
- [X] Commit + push.

## Estado

✅ Finalizado.