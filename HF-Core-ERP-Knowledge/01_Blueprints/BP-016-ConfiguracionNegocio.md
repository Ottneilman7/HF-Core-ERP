# BP-016  Configuración del negocio (Empresa, Parámetros, Impuestos)

Versión: 1.0
Última actualización: 19/07/2026
Origen: EL-Verdadero-MVP-EIF.md, Flujo 1 ("Configurar el negocio") — identificado como hueco en AUDITORIA-MVP-EIF.md (19/07/2026): el flujo fundacional del MVP nunca se había construido pese a que Catálogo, Producción y Centro de Decisiones ya existen.

---

## Objetivo

Que exista un único lugar donde el emprendedor define, una sola vez, los datos que el resto del sistema va a necesitar: quién es su empresa, en qué moneda opera, qué margen quiere usar por defecto y qué impuestos aplican. Sin esto, el módulo de Costeo/Precio de Venta (Sprint 3) y cualquier factura futura no tienen de dónde partir.

## Alcance (esta entrega)

- Modelos: `Company`, `BusinessParameters`, `TaxConfig` (con `TaxRate[]`).
- Persistencia real vía `localStorage` (`configService.ts`) — no se pierde al recargar. Es la primera aplicación concreta de BP-015 Fase 1, limitada a Configuración por ahora.
- `ConfigContext` para que cualquier página futura (Costeo, Ventas, Facturación) pueda leer `parameters.baseCurrency` o `taxConfig.taxes` sin volver a consultar `localStorage` directamente.
- `ConfigPage.tsx` (ruta sugerida `/config`): tres secciones — Empresa, Parámetros, Impuestos — cada una con su propio guardado independiente.
- Pruebas (`configService.test.ts`): 5 casos, cubriendo estado vacío, guardado de empresa, valores por defecto de parámetros, guardado de parámetros e impuestos.

## Decisiones de diseño

1. **Los tipos de agente de retención (persona natural/jurídica, no agente, 75%, 100%) NO viven en `TaxConfig`.** Son un atributo por Cliente, no del negocio — se definirán junto con el modelo `Customer` cuando se aborde Ventas/Clientes (ya existe `CustomerModel` desde ENT-008, según CHANGELOG). `TaxConfig` solo contiene el catálogo de impuestos (ej. IVA).
2. **Una sola página, tres formularios independientes.** A diferencia de Producción o Ventas, Configuración se llena una vez y se ajusta poco — no justifica su propia sub-navegación.
3. **`localStorage` solo para Configuración en esta entrega**, no para Producción/Inventario todavía. Extenderlo a esos módulos requiere la decisión completa del CEO registrada en BP-015 (Fase 1 vs. saltar directo a Fase 2).

## Fuera de alcance (Backlog explícito)

- Multiempresa, multimoneda simultánea, múltiples tasas de impuesto por producto — excluido explícitamente por EL-Verdadero-MVP-EIF.md ("Lo que NO vamos a construir ahora").
- Validación de formato de `taxId` por país (RIF venezolano vs. NIT vs. RUC) — se deja como texto libre por ahora.

## Checklist de cierre (Regla 20, TEAM_RULES)

- [X] Copiar archivos al repo real (HF-CORE-ERP).
- [X] `npx vitest run` sobre `configService.test.ts`. — requirió instalar happy-dom como dependencia de desarrollo (npm install -D happy-dom) porque el servicio usa localStorage, una API de navegador que Vitest no simula por defecto en Node. Se agregó // @vitest-environment happy-dom como primera línea del archivo de test, aplicando el entorno solo a ese archivo (no a todo el proyecto).
- [X] Prueba en navegador: guardar Empresa, recargar la página, confirmar que persiste. Pendiente tras conectar la ruta.
- [X] Ruta conectada en AppRouter.tsx como /settings (ya existía en Sidebar.tsx; se reemplazó ComingSoonPage por ConfigPage en esa ruta — no se creó /config nueva).
- [X] App envuelta con <ConfigProvider> dentro de AppRouter.tsx (mismo nivel que ProductionAlertsProvider, dentro de <BrowserRouter>).
- [X] Confirmación del CEO tras probar en navegador.
- [X] Commit + push.

Nota técnica — por qué ConfigProvider se agregó en AppRouter.tsx y no en App.tsx

App.tsx solo renderiza <AppRouter />, sin lógica propia. ProductionAlertsProvider (BP-010) ya establecía el patrón de colocar los Providers de contexto dentro de AppRouter.tsx, junto a BrowserRouter. ConfigProvider sigue el mismo patrón por consistencia — no hay razón para que Configuración rompa una convención que ya funciona para Producción.

## Estado

✅ Finalizado.

## Próximo paso natural

Con Configuración resuelta, el siguiente hueco real del verdadero MVP es **Flujo 3: Compras** (Proveedores, Órdenes de compra, Recepción, Actualización de costos) — hoy Producción ya sabe "qué falta" pero no existe dónde registrar que se compró y que el costo de una materia prima cambió.