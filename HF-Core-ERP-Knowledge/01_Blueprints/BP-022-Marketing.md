## BP-022  Marketing (Estrategia → Calendario de Publicaciones → Asistente)

Versión: 1.0
Última actualización: 20/07/2026
Origen: EL-Verdadero-MVP-EIF.md, Flujo 7 ("Promocionar") — último módulo de los 8 flujos del verdadero MVP.

---

## Objetivo

Que el emprendedor publique con constancia y de forma profesional en redes, sin necesitar un experto en marketing — un asistente simple que sugiere y recuerda, no un CRM.

## Alcance (esta entrega)

- `models/MarketingStrategy.ts`: meta de publicaciones por semana + pilares de contenido.
- `models/MarketingPost.ts`: una publicación planificada/publicada, con fecha y notas.
- `services/marketingService.ts`: estrategia con **valores por defecto ya poblados** (2 publicaciones/semana, 5 pilares de contenido sugeridos — Producto, Detrás de cámaras, Testimonios, Educativo, Promociones) — como lo propondría un marketing manager junior el primer día, no una pantalla en blanco. `getSuggestions()` calcula recordatorios: publicación de hoy, publicaciones atrasadas, días sin publicar, y si el calendario de la semana no alcanza la meta.
- `pages/MarketingPage.tsx` (ruta `/marketing`, reemplaza el `ComingSoonPage` actual).
- Pruebas: `marketingService.test.ts` (8 casos).

## Decisión de diseño — por qué NO se incluyó campo de red social por publicación

El CEO decidió explícitamente mantener el 80/20: la parte operativa (constancia, estrategia clara, recordatorios) importa más ahora mismo que el detalle de en qué red se publica. Backlog explícito, no descartado — se agrega en cuanto el emprendedor necesite reportar por canal.

## Fuera de alcance (Backlog explícito)

- Campo de red social (Instagram/TikTok/etc.) por publicación.
- Métricas reales de alcance/engagement (requeriría integración con APIs de redes — fuera del alcance del MVP, EL-Verdadero-MVP-EIF.md lo excluye explícitamente: "no necesitamos integraciones masivas").
- Generación de contenido con IA (fuera de alcance del MVP — "no necesitamos IA avanzada, todavía no").

## Checklist de cierre (Regla 20, TEAM_RULES)

- [X] Copiar `models/MarketingStrategy.ts`, `models/MarketingPost.ts`, `services/marketingService.ts` (+test), `pages/MarketingPage.tsx` al repo real.
- [X] `npx vitest run`.
- [X] En `AppRouter.tsx`: reemplazar el `ComingSoonPage` de `/marketing` por `<MarketingPage />`.
- [X] Prueba en navegador: planifica una publicación para hoy → confirma que aparece la sugerencia "Hoy toca publicar" → márcala como publicada.
- [X] Confirmación del CEO.
- [X] Commit + push.

## Estado

✅ Finalizado — código y pruebas listos, listo checklist arriba.

## 🎉 Con esto se completan los 8 flujos del verdadero MVP

Configurar, Catálogo, Comprar, Producir, Vender, Cobrar, Promocionar, y Decidir (Centro de Decisiones, ya construido desde ENT-010). El Backlog que queda (importar clientes reales, factura formal en PDF, campo de red social, historial de producción, Fase 2 de Firebase) son todas mejoras sobre un MVP ya completo y funcionando de punta a punta — no huecos del MVP en sí.