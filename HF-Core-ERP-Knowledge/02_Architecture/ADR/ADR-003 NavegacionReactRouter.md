# ADR-003

# Navegación con React Router y Arquitectura de Dos Niveles (Operativo / Decisiones)

**Fecha:** Decisión tomada durante ENT-008A. Formalizada como ADR el 17/07/2026 — documentación retroactiva, ya que esta decisión vivía únicamente dentro de la conversación de desarrollo y no como archivo independiente del repositorio de conocimiento.

**Estado:** Aprobada e implementada (ENT-008A, cerrado con commit y push).

---

## Problema

Hasta ENT-008, cada nuevo módulo requería modificar `App.tsx` directamente, reemplazando manualmente qué página se mostraba. Esto no escala: cada módulo nuevo aumentaba el riesgo de romper la navegación de los módulos ya existentes.

Además, cada módulo mostraba únicamente datos crudos — contadores, listas — sin relación directa con la filosofía de producto definida en PRODUCT_VISION.md y ENTREPRENEUR_JOURNEY.md: un ERP orientado a decisiones, no a registro de datos.

---

## Decisión

**1. Navegación:** Adoptar **React Router DOM** como mecanismo oficial y único de navegación del ERP. Se introduce `AppRouter` como punto central de rutas, y el `Sidebar` se conecta a esas rutas. Ningún módulo nuevo debe volver a modificar `App.tsx` para exponer su pantalla — solo debe registrarse en `AppRouter` y en el menú del `Sidebar`.

**2. Arquitectura de información en dos niveles**, permanente para todo el proyecto:

- **Nivel 1 — Operativo:** vive dentro de cada módulo de dominio (Productos, Clientes, Inventario, Compras, Producción, Ventas, etc.). Contiene los datos maestros y transaccionales del negocio.
- **Nivel 2 — Decisiones:** vive únicamente en el Dashboard, que pasa a llamarse oficialmente **Centro de Decisiones**. Nunca mostrará tablas ni contadores crudos — solo acciones recomendadas, derivadas de reglas de negocio (y, en el futuro, de modelos predictivos), que consumen datos del Nivel Operativo.

---

## Consecuencias

- Todo módulo nuevo debe evaluarse bajo el patrón **Nivel Maestro / Nivel Inteligente** introducido en BP-008: qué datos se registran (operativo) y qué indicador o recomendación se deriva de ellos (decisión).
- El Centro de Decisiones queda protegido de crecer de forma desordenada: cualquier elemento nuevo debe responder tres preguntas antes de agregarse — ¿ayuda a decidir? ¿reduce tiempo o errores en la operación diaria? ¿acerca más rápido al MVP? Si la respuesta es no a cualquiera, la idea va al Backlog, no al Dashboard.
- La navegación queda desacoplada: agregar un módulo ya no implica riesgo de romper los módulos existentes (refuerza ADR-001, arquitectura modular por dominio).
- Esta decisión no es trivial de revertir: todo módulo construido a partir de ENT-008A asume esta separación de dos niveles. Revertirla implicaría refactorizar el Dashboard y cada módulo operativo por igual.

---

## Referencia

Entregable de origen: ENT-008A. Ver Blueprint relacionado: BP-008 (Customer Master), donde se aplicó por primera vez el patrón Nivel Maestro / Nivel Inteligente que esta ADR eleva a regla de arquitectura general.