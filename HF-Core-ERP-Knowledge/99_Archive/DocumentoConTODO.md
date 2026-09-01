# HF Core ERP

**Documento:** START_HERE

**Versión:** 1.0

**Última actualización:** 17/07/2026

---

# Bienvenido

Este documento es el punto de entrada oficial al proyecto **HF Core ERP**.

Antes de realizar cualquier cambio en el código o en la documentación, sigue el siguiente proceso.

---

# Paso 1 — Comprender el estado del proyecto

Leer:

PROJECT_STATUS.md

Aquí conocerás:

- Estado actual del desarrollo.
- Sprint activo.
- Última entrega completada.
- Próxima entrega.
- Bloqueos (si existen).

---

# Paso 2 — Revisar el índice del proyecto

Leer:

PROJECT_INDEX.md

Aquí encontrarás la estructura completa de la documentación y la ubicación de todos los documentos oficiales.

---

# Paso 3 — Comprender el contexto del proyecto

Leer:

ENTREPRENEUR_JOURNEY.md
AI_CONTEXT.md

Este documento define:

- Filosofía del producto.
- Metodología de desarrollo.
- Tecnologías utilizadas.
- Principios de arquitectura.
- Forma de colaboración entre el CEO y el CTO.

---

# Paso 4 — Revisar el Blueprint activo

Antes de desarrollar una funcionalidad, identificar el Blueprint correspondiente.

El Blueprint define:

- Objetivo del módulo.
- Alcance.
- Reglas de negocio.
- Dependencias.
- Estado del desarrollo.

---

# Paso 5 — Revisar las decisiones de arquitectura

Leer los ADR relacionados con el módulo que será modificado.

Nunca implementar cambios que contradigan una decisión arquitectónica previamente aprobada.

---

# Paso 6 — Abrir el repositorio del código

Repositorios:

1. HF-CORE-ERP

Todo el código e implementación vive en este repositorio.

2. HF-Core-ERP-Knowledge 
únicamente documenta el proyecto.

---

# Antes de comenzar

Verificar siempre:

✓ Existe Blueprint.

✓ El Blueprint está actualizado.

✓ No existe una ADR que afecte el cambio.

✓ El PROJECT_STATUS refleja el estado actual.

---

# Regla de Oro

Si una decisión importante no quedó documentada, la decisión no existe.

La documentación es parte del producto.

---

**Siguiente documento a consultar:**

PROJECT_STATUS.md

--- 

### ENTREPRENEUR_jOURNEY

# ¿Cómo opera un negocio desde el Día 1 hasta convertirse en una empresa organizada?

No desde el punto de vista del software, sino desde el punto de vista del emprendedor.

# Estructura del documento
1. Propósito

Explicar que HF Core ERP no organiza módulos.

Organiza decisiones.

2. Etapa 0 — Nace el negocio

El emprendedor apenas comienza.

¿Qué necesita?

Ejemplo:

Registrar su empresa.
Configurar moneda.
Definir impuestos.
Crear usuarios.
Registrar productos a Vender
Registrar las recetas BOM de cada producto (su materias primas, que puede ser un subproducto).
Registrar clientes (definir si es contado/credito, persona natural o juridica, Agente de retencion al 75% o 100%, etc)
Mejorar sus canales de promoción en las diferentes RRSS
Recomendaciones de lo que puede hacer para mejorar su produccion y rentabilidad (Buscar clientes, programar limpiezas y control del negocio, etc)

Eso ya nos dice qué pantallas necesita el MVP.

3. Etapa 1 — Primer día de trabajo

El emprendedor llega al negocio.

¿Qué hace?

No abre "Inventario".

Abre el ERP. En la página de inicio con un mensaje Motivador diario y con un mensaje: 

Buenos días X (Otto).
¿Qué vas a hacer Hoy?

Hoy tienes: (recordatorios y sugerencias)

3 pedidos pendientes 
Inventario crítico de avena.
Debes producir 24 barras Recovery.
Tienes 2 clientes sin atender.
Hoy vencen 3 cuentas por cobrar.
Tu margen cayó un 4 % esta semana.

Eso en la pantalla principal, seguido más abajo de los botones y fichas de producir, vender, cobrar, comprar, promocionar, tal y cmo ya se tiene hasta el momento en la Pagina inicio Honestly Foods.

No gráficos bonitos.

Acciones.

4. Flujo operativo diario

Aquí construiremos literalmente el día del emprendedor.

Por ejemplo:

8:00

Abre el ERP.

↓

Ve las prioridades.

↓

Decide qué producir.

↓

Coloca en la sección Produccion lo que va a producir y recibe la respuesta de las cantidades de materia prima a sacar para iniciar la produccion.

↓

La App le dice si está bajo el inventario y si debe comprar mercancía.

↓

Genera orden de producción.

↓

Producción termina y registra la producción en sus formatos y en la app

↓

Inventario aumenta.

↓

Ventas despacha.

↓

Clientes reciben.

↓

Caja registra ingresos.

↓

Dashboard actualiza indicadores.

Ese flujo definirá el orden real de construcción del ERP.

5. Flujo semanal
Todos los lunes.

El ERP debe responder:

Producto más vendido.
Producto menos rentable.
Clientes inactivos.
Materias primas próximas a agotarse.
Producción recomendada.
Compras recomendadas.

6. Flujo mensual

Finanzas.

Compras.

Producción.

KPIs.

Rentabilidad.

7. Motor de Decisiones

Aquí está la diferencia con Odoo.

El ERP nunca preguntará solamente:

¿Qué deseas hacer?

También propondrá:

Esto es lo que deberías hacer.

Ejemplo:

"Tu inventario alcanza para 2 días. Compra avena hoy."

8. Evolución

Después del MVP.

IA.

Predicción.

Planeación automática.

Compras automáticas.

Producción sugerida.

Esto cambia completamente el Roadmap

En lugar de construir módulos aislados:

Productos

Clientes

Inventario

Ventas

...

Construiremos capacidades.

Por ejemplo:

Capacidad 1

Conocer el negocio.

↓

Catálogos.

Capacidad 2

Saber qué fabricar.

↓

Producción.

BOM.

Inventario.

Capacidad 3

Saber qué vender.

↓

Clientes.

Pedidos.

Ventas.

Capacidad 4

Saber qué comprar.

↓

Compras.

Inventario mínimo.

Proveedores.

Capacidad 5

Saber qué hacer hoy.

↓

Motor de Decisiones.

Dashboard.

IA.

¿Notas la diferencia?

Estamos construyendo un Sistema Operativo para Empresas, no un simple ERP.

No hablará de tecnología.

No hablará de React.

No hablará de TypeScript.

Hablará del negocio.

Y cada vez que creemos un módulo nuevo nos preguntaremos:

¿En qué parte del flujo operativo del emprendedor aporta valor?

Si no aporta valor...

No entra al MVP.

Esa será una regla de oro.

--- 

### PRODUCTO_VISIO.md

# HF Core ERP

**Documento:** PRODUCT_VISION

**Versión:** 0.1 (BORRADOR — pendiente de aprobación del CEO)

**Última actualización:** 17/07/2026

---

# ¿Qué es HF Core ERP?

HF Core ERP es un ERP orientado a decisiones, no a módulos.

Nace como sistema interno para Honestly Foods CA y está diseñado, desde el primer día, para evolucionar hacia un producto comercial (SaaS) dirigido a Startups, Emprendedores y PyMEs.

No es un conjunto de pantallas para registrar datos (Inventario, Ventas, Producción como silos). Es un sistema operativo para empresas: organiza el negocio alrededor de capacidades (Conocer el negocio, Saber qué fabricar, Saber qué vender, Saber qué comprar, Saber qué hacer hoy), no alrededor de módulos técnicos.

---

# ¿Qué problema resuelve?

El emprendedor promedio no tiene un problema de falta de datos. Tiene un problema de falta de claridad sobre qué hacer con esos datos, hoy, ahora mismo.

Los ERP tradicionales entregan reportes y dashboards y esperan que el usuario los interprete. HF Core ERP invierte esa relación: procesa la información del negocio y responde directamente qué producir, qué comprar, qué vender, qué cobrar y qué tareas priorizar.

Además, resuelve el problema de la complejidad y el costo de implementación de los ERP tradicionales, que suelen requerir consultores y meses de configuración — algo que ninguna startup o PyME en etapa temprana puede costear.

---

# ¿Qué NO pretende ser?

- No pretende competir con SAP ni con ERPs de gran empresa.
- No pretende ser un ERP tradicional que solo digitaliza procesos administrativos.
- No pretende requerir consultores externos ni implementaciones largas para empezar a usarse.
- No pretende ser un conjunto de módulos aislados (Inventario, Ventas, Compras) que el usuario deba operar por separado, cada uno con su propia lógica desconectada del resto.

---

# ¿Quién es el cliente ideal?

**Cliente ancla (MVP):** Honestly Foods CA, como caso de uso real que valida cada capacidad antes de generalizarla.

**Cliente ideal a mediano plazo:** startups en etapa temprana, emprendedores individuales y PyMEs que:

- Necesitan herramientas de gestión empresarial profesionales.
- No tienen equipo de TI ni tiempo para configurar un ERP tradicional.
- Prefieren que el sistema les diga qué hacer, en lugar de solo mostrarles datos.
- Necesitan que el sistema se adapte a cómo ya operan su negocio, no al revés.

---

# ¿Qué diferencia al ERP de Odoo?

Odoo (y la mayoría de los ERPs, incluidos los "amigables") preguntan: **¿qué deseas hacer?** Presentan menús y módulos, y depende del usuario saber qué mirar y qué decidir.

HF Core ERP propone en lugar de preguntar: **esto es lo que deberías hacer.**

Ejemplo real del propio proyecto (ENTREPRENEUR_JOURNEY.md): en lugar de que el usuario entre a "Inventario" y calcule manualmente cuánto le queda de avena, el sistema le dice directamente: *"Tu inventario alcanza para 2 días. Compra avena hoy."*

Esa es la diferencia estructural: Odoo es un ERP de registro. HF Core ERP es un ERP de decisión, construido sobre un Motor de Decisiones que evoluciona hacia predicción e IA.

Adicionalmente, HF Core ERP se adapta al negocio del usuario (codificación configurable, políticas de inventario configurables, impuestos configurables — Regla 13, TEAM_RULES) en lugar de forzar al usuario a adaptarse a la estructura rígida del software.

---

# ¿Cuál es la visión a cinco años?

En cinco años, HF Core ERP debería haber evolucionado desde una herramienta interna de Honestly Foods CA hacia una plataforma SaaS comercial usada por miles de startups, emprendedores y PyMEs, en la que:

- El Motor de Decisiones incorpore predicción e inteligencia artificial (compras automáticas, producción sugerida, planeación automática).
- El producto sea reconocido como el ERP de referencia para negocios en etapa temprana — no por tener más módulos, sino por reducir la carga de decisión diaria del emprendedor.
- HF Core ERP funcione como una verdadera plataforma de crecimiento empresarial (Regla 15, TEAM_RULES), no solo como software administrativo.

---

**Documento de origen de esta síntesis:** AI_CONTEXT.md, ENTREPRENEUR_JOURNEY.md, TEAM_RULES.md (Regla 13, Regla 15).

--- 

### AI_CONTEXT.md
# HF CORE ERP

# AI CONTEXT

Versión: 1.0

---

# Objetivo

Este documento define el contexto permanente que cualquier Inteligencia Artificial deberá utilizar antes de colaborar en el desarrollo del proyecto HF Core ERP.

Su propósito es garantizar continuidad entre conversaciones, diferentes modelos de IA y futuros desarrolladores.

Este documento tiene prioridad sobre cualquier supuesto que la IA pueda realizar.

---

# Qué es HF Core ERP

HF Core ERP es un ERP moderno diseñado inicialmente para Honestly Foods CA.

El objetivo del proyecto es evolucionar hasta convertirse en un ERP comercial dirigido a:

- Startups
- Emprendedores
- PyMEs

Su filosofía consiste en ofrecer herramientas empresariales profesionales sin la complejidad de los ERP tradicionales.

---

# Filosofía de Desarrollo

La IA deberá priorizar siempre:

- simplicidad
- claridad
- reutilización
- escalabilidad
- documentación
- código limpio

El proyecto nunca debe crecer mediante código duplicado.

Siempre debe evolucionar reutilizando componentes existentes.

---

# Filosofía del Producto

HF Core ERP debe ayudar al emprendedor a organizar su empresa desde el primer día.

No busca competir con SAP.

Busca convertirse en el mejor ERP para Startups.

Cada decisión deberá favorecer:

- facilidad de uso
- rapidez
- aprendizaje
- productividad

---

# Metodología

Todo desarrollo deberá seguir el siguiente flujo.

RFC (cuando aplique)

↓

Blueprint

↓

Arquitectura

↓

Código

↓

Pruebas

↓

Documentación

↓

Git

Nunca generar código sin considerar la arquitectura existente.

---

# Reglas Obligatorias

La IA deberá cumplir siempre las siguientes reglas.

1.

Nunca reemplazar trabajo existente si puede reutilizarse.

---

2.

Nunca crear código duplicado.

---

3.

Explicar primero.

Programar después.

---

4.

Trabajar únicamente mediante entregables completos.

---

5.

Cada entregable debe indicar claramente:

Objetivo

Archivos

Código

Pruebas

Git

Próximo paso

---

6.

Toda decisión importante deberá registrarse.

---

7.

La documentación tiene el mismo valor que el código.

---

8.

El MVP siempre tiene prioridad sobre funcionalidades futuras.

---

9.

Las funcionalidades futuras deberán registrarse en el Backlog.

No implementarse inmediatamente.

---

10.

Todo módulo deberá ser escalable.

Aunque inicialmente sea sencillo.

---

# Tecnologías

Frontend

React

TypeScript

Vite

---

Lenguaje

TypeScript estricto.

---

Arquitectura

Componentes reutilizables.

Modelos separados.

Servicios separados.

Reglas de negocio separadas de la interfaz.

---

Git

Todo cambio debe terminar con:

git status

git add .

git commit

git push

---

# Convenciones

Modelos

PascalCase

Product.ts

RawMaterial.ts

Customer.ts

---

Componentes

PascalCase

Sidebar.tsx

InventoryPage.tsx

Card.tsx

---

Datos temporales

camelCase

products.ts

rawMaterials.ts

customers.ts

---

Interfaces

Siempre importar utilizando:

import type

Nunca:

import

cuando se trate únicamente de interfaces.

---

# Documentación

Cada desarrollo debe actualizar:

PROJECT_INDEX

CHANGELOG

Blueprint correspondiente

ADR cuando aplique

Lessons Learned cuando corresponda

---

# Forma de Responder

La IA debe explicar de forma pedagógica.

El usuario está aprendiendo desarrollo de software.

Las respuestas deben enseñar mientras construyen.

Evitar respuestas excesivamente resumidas.

Evitar asumir conocimientos avanzados.

---

# Objetivo Final

Construir un ERP moderno, escalable y completamente documentado que pueda evolucionar desde Honestly Foods CA hasta convertirse en un producto comercial para miles de Startups y PyMEs.

Toda decisión debe acercar al proyecto a ese objetivo.

---

# Regla del 80/20

La IA deberá priorizar siempre entregar una solución funcional que resuelva el 80% del problema con el 20% del esfuerzo.

Se evitará retrasar el MVP por intentar construir soluciones perfectas desde la primera versión.

La perfección se logrará mediante iteraciones.

Primero se entrega valor.

Después se optimiza.

# Cómo Colaaborar con este Proyecto

Indicando:

Leer START_HERE.
Leer PROJECT_STATUS.
Revisar Blueprint.
Revisar ADR.
Programar. 


Fin del Documento.

---

### PROJECT_STATUS.md
# Proyecto HF Core ERP

Versión 0.7 — CIERRE DE SESIÓN 19/07/2026

Sprint actual: SPR-001

Estado MVP: 🟡 En desarrollo

Última ENT finalizada: **ENT-011/012/013/014**, cerradas juntas en esta sesión:
- Recetas Multinivel + Semielaborados con Inventario Propio + Presentaciones de Granola (BP-011/012)
- Landing + Centro de Decisiones interno, sin exponer recetas (BP-013)
- Producción por Demanda: "voy a producir X, dime qué sacar", con máximo producible y botón de reinicio (BP-014)

Próxima ENT: A elegir por el CEO entre — Compras (versión simple), Ventas y Clientes, Finanzas, o Persistencia Local (BP-015, Fase 1).

Blueprint activo: Ninguno (a la espera de la próxima prioridad del CEO)

Blueprints finalizados: BP-001, BP-005, BP-007, BP-008, BP-009 (extendido), BP-010 (extendido), BP-011, BP-012, BP-013, BP-014

Blueprints en Backlog (registrados, no iniciados): BP-015 (Persistencia Local + Firebase/Vercel)

Pendiente de reconciliación (no bloqueante): `data/productPresentations.ts` vs. el patrón de `Product` independiente usado en BP-012 para Granola — mismo problema, dos soluciones en paralelo. Resolver en la próxima sesión.

ADR registradas: ADR-001, ADR-003, ADR-004 (con adenda)

Última actualización: 19/07/2026, 01:40 a.m.

Arquitectura: Estable

Bloqueos: Ninguno

Última actualización: 17/07/2026

---

## Nota de cierre — ENT-009

Se detectó que esta versión de PROJECT_STATUS no reflejaba el estado real documentado en BP-009 (que ya indicaba "Finalizado"). Se corrige aquí y se agrega la Regla 20 en TEAM_RULES.md para que este desfase no vuelva a ocurrir (ver archivo adjunto).

---

### BLUEPRINTS 14 Y 15
BP-014

Producción por Demanda ("Voy a producir X, dime qué sacar")

Versión: 1.0
Última actualización: 18/07/2026
Origen: ENTREPRENEUR_JOURNEY.md, Capacidad 2 ("Saber qué fabricar") — priorizado por el CEO como siguiente capacidad tras BP-013.

---

## Objetivo

Reemplazar la exploración manual de recetas por una sola pregunta: "¿cuánto vas a producir hoy?" — y que la app calcule, usando el motor de BP-011/012 (sin cambios en su lógica), exactamente qué sacar de almacén.

## Alcance (Fase 1 — esta entrega)

- Página `ProductionPage.tsx` (ruta `/production`), reemplaza el hub anterior.
- Lista de **todo lo que se puede producir**: los 3 SKU finales (barras) y los semielaborados con inventario propio (Granola a granel, Peanut Butter) — a diferencia de la antigua RecipesPage, aquí no importa si tiene `productId` o no, porque el emprendedor también necesita poder decir "voy a producir 6.4kg de Granola" sin que eso sea un SKU vendible.
- El usuario elige qué producir e ingresa la cantidad **en la unidad natural de esa receta** (gramos para Granola/Peanut Butter, unidades para las barras).
- El resultado es una lista completa (no solo faltantes) de qué sacar de almacén, con ícono, cantidad y estado (✅ suficiente / ⚠️ falta).
- Cuando la cantidad no es múltiplo exacto del rendimiento por lote (`yieldQuantity`), se muestra cuántos lotes representa (ej. "6400g ≈ 2.00 lotes de 3200g") — así el emprendedor conecta el número con su proceso real (ej. "2 hornos"), sin que el sistema necesite modelar hornos como un concepto aparte.

## Fuera de alcance de esta entrega (Backlog explícito)

- **Reparto automático entre presentaciones según demanda real de ventas.** El CEO confirmó: por ahora el emprendedor decide manualmente cuánto va a cada presentación; el reparto automático (empacar más en las presentaciones que más se venden) requiere datos reales de Ventas, que todavía no existen como módulo. Queda registrado como evolución directa de BP-014 una vez exista Capacidad 3 (Ventas).
- **Persistencia real de inventario ("ejecutar y descontar del almacén").** Hoy el catálogo (`rawMaterials.ts`, `recipes.ts`) son archivos estáticos, no una base de datos — no hay dónde "guardar" que ya se produjo algo y que el stock bajó. Confirmar una producción y que el stock se actualice de verdad requiere una decisión de arquitectura propia (¿localStorage como solución puente, o backend real con base de datos?) — no la voy a improvir dentro de esta entrega. Ver "Próxima decisión pendiente" abajo.

## Próxima decisión pendiente (antes de Fase 2)

Ahora mismo, calcular "qué sacar" no puede traducirse en "descontarlo del inventario" porque el proyecto no tiene backend ni base de datos — todo vive en archivos TypeScript estáticos que solo cambian cuando yo edito código. Para que "ejecutar la producción" actualice el stock de verdad, hay dos caminos:

1. **Corto plazo:** guardar el inventario en `localStorage` del navegador (rápido de construir, funciona ya, pero solo vive en esa computadora/navegador).
2. **Mediano plazo:** backend real con base de datos (permite multiusuario, respaldo, acceso desde el celular) — es un cambio de arquitectura grande, merece su propio ADR.

Se necesita la decisión del CEO antes de construir la Fase 2 (confirmar y descontar stock).

## Estado

✅ Finalizado — 19/07/2026
---

# Adenda (19/07/2026) — Centro de Decisiones limpio

Se retiró la sección "Inventario" (alertas automáticas de stock mínimo) de DecisionCenterPage. Motivo (feedback CEO): esos mínimos (RawMaterial.minimumStock, Recipe.minimumStock) son placeholders que yo cargué al construir BP-011/012 — no valores que el emprendedor haya definido todavía. Mostrarlos como alerta automática generaba ruido, no una decisión real.

Regla de diseño confirmada: el Centro de Decisiones solo debe reflejar lo que el dueño del negocio consulta o registra activamente (hoy: Producción; a futuro: Marketing, tareas del local, etc.) — nunca umbrales que nadie configuró.

Las funciones getLowStockRawMaterials / getLowStockTrackedRecipes se mantienen en el servicio (no se pierde el trabajo, Regla 1) pero dejan de usarse en DecisionCenterPage. Quedan en Backlog para cuando exista una pantalla de Configuración donde el emprendedor defina sus propios mínimos reales — ahí sí tendría sentido reactivarlas.

Se agrega components/ResetButton.tsx, reutilizable, con estilo moderno (gradiente + sombra + efecto de presión).

Adenda — Reconciliación pendiente con productPresentations.ts

Al recuperar ProductsPage.tsx original, se descubrió que el repositorio ya tenía un patrón propio para presentaciones de producto (data/productPresentations.ts: un Product + N presentaciones enlazadas por productId). BP-012 resolvió el mismo problema para Granola de otra forma (3 Product independientes: HG_T050, HG_T200, HG_T400). Son dos formas de modelar lo mismo — hay que reconciliarlas para no violar Regla 16 (una sola fuente de verdad). Pendiente: revisar productPresentations.ts y decidir cuál patrón queda como oficial.

# BP-015 Persistencia de Datos y Despliegue (Pendiente — Backlog priorizado)

Versión: 1.0
Última actualización: 19/07/2026
Origen: Decisión pendiente identificada en BP-014 ("¿dónde se guarda lo que se produce/vende/compra?").

---

## Objetivo

Hoy, todo el catálogo (`rawMaterials.ts`, `recipes.ts`, `products.ts`) son archivos de código estático — no hay dónde persistir cambios reales (ej. confirmar una producción y descontar stock de verdad). Este Blueprint registra el plan en dos fases, ya acordado con el CEO, para no bloquear el desarrollo mientras se toma con calma la decisión de backend definitivo.

## Fase 1 — Puente temporal: `localStorage` (próxima a construir)

- Guardar en el navegador (`localStorage`) las cantidades reales de `currentStock` de materia prima y semielaborados, en vez de los valores fijos en el código.
- Los archivos `.ts` (`rawMaterials.ts`, `recipes.ts`) pasan a ser el **valor inicial/semilla**; `localStorage` guarda el valor real vigente.
- Suficiente para seguir desarrollando y probando el flujo completo (Producción, futuro Compras/Ventas) sin esperar un backend.
- **Limitación explícita y aceptada:** solo vive en esa computadora y ese navegador. No sirve para trabajar en equipo ni desde el celular. Es una etapa de desarrollo, no la solución final.

## Fase 2 — Backend real: Firebase + despliegue en Vercel (decisión ya tomada por el CEO, pendiente de construir)

- Base de datos real (Firestore, vía Firebase) — permite multiusuario, respaldo, acceso desde cualquier dispositivo.
- Despliegue del frontend en Vercel — accesible desde una URL real, no solo `localhost`.
- Esto es un cambio de arquitectura importante: requiere su propio ADR antes de implementarse (autenticación, reglas de seguridad de Firestore, migración de los datos semilla actuales a la base de datos real).

## Estado

🔴 No iniciado. Registrado en Backlog como próxima gran decisión de arquitectura, después de que BP-011/012/013/014 queden cerrados y probados.

---

### ADR-003 Y 004
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

# ADR-004

# Recetas Multinivel (Productos Intermedios como Ingrediente de otra Receta)

**Fecha:** 17/07/2026, a partir de la información real de negocio compartida por el CEO (documento Mayordomía + Excel de costos).

**Estado:** Aprobada. Pendiente de implementación (ver BP-011).

---

## Problema

El modelo `Recipe`/`RecipeItem` (BP-009) asume que toda receta se compone únicamente de materia prima directa (`RawMaterial`). La realidad del negocio de Honestly Foods no es así: una "Honestly Bar Classic" no se hace con avena y miel directamente — se hace con **Granola Base** (que a su vez es una receta con 7 ingredientes) y **Honestly Peanut Butter** (que a su vez es una receta con 3 ingredientes). Son productos intermedios: no se venden solos, pero tienen su propio BOM, su propio rendimiento por lote y, eventualmente, su propio costo.

Forzar esto en el modelo actual llevaría a "aplanar" manualmente las cantidades (por ejemplo, calcular a mano cuánta avena hay en 25g de Granola Base) cada vez que cambie la fórmula base — exactamente el tipo de trabajo manual y propenso a error que el ERP debe eliminar (PRODUCT_VISION.md).

## Decisión

1. **`RecipeItem` se extiende, no se reemplaza** (Regla 1, nunca perder trabajo existente): un ítem de receta ahora puede referenciar **una** de dos cosas, nunca ambas:
   - `rawMaterialId` → materia prima directa (comportamiento actual, sin cambios).
   - `componentRecipeId` → otra receta (producto intermedio).

2. **`Recipe` incorpora `isIntermediate: boolean`**. Una receta intermedia (ej. Granola Base) no requiere `productId`, porque no es un producto vendible por sí mismo — es un insumo interno de otras recetas.

3. **El cálculo de necesidad de materia prima (BP-010) se vuelve recursivo**: al pedir "necesito producir X barras Classic", el sistema debe expandir automáticamente Granola Base y Honestly Peanut Butter hasta llegar a materia prima real (avena, maní, aceite de coco, etc.), sumando cantidades cuando la misma materia prima aparece en más de una rama.

4. **Límite de profundidad de recursión (5 niveles)** como salvaguarda contra referencias circulares accidentales entre recetas.

## Consecuencias

- El servicio `productionCalculatorService` cambia de "sumar directo" a "resolver el árbol de la receta". La firma de `calculateProductionNeeds` gana un parámetro (`recipes`), ya disponible en los componentes que la consumen (`ProductionSimulator` ya recibe `recipes` como prop) — no rompe la integración de ENT-010.
- BP-009 queda vigente para el caso de una receta de un solo nivel (aún válido, ej. si una receta futura no tuviera productos intermedios), pero su modelo conceptual queda **extendido** por este ADR.
- Esto habilita naturalmente el costeo por receta en el futuro (Backlog): si cada nivel tiene su propio BOM, el costo de un producto final se puede derivar sumando el costo de sus componentes, sin recalcular todo a mano.

## Referencia

Entregable de origen: BP-011 (Recetas Multinivel y Catálogo Real de Productos).

---

## Adenda (17/07/2026) — Corrección tras prueba real en navegador

Al probar con datos reales, el CEO detectó que la resolución recursiva original desarmaba TODO hasta materia prima, incluso para semielaborados que en la vida real tienen su propio inventario (se producen en lote y se guardan en almacén: Granola, Honestly Peanut Butter). Eso generaba alertas ruidosas e inútiles al simular una barra (11 líneas de avena, coco, ajonjolí... en vez de una sola línea "falta Granola").

**Corrección:** se agrega `tracksInventory` a `Recipe`. Cuando una receta se usa como `componentRecipeId` dentro de otra Y tiene `tracksInventory: true`, el cálculo se detiene ahí — verifica el stock propio del semielaborado, no lo desarma. Solo se desarma hasta materia prima cuando se calcula la receta del semielaborado **directamente** (ej. planear cuánto fabricar de la presentación de Granola de 400g).

Esto también resuelve, de forma natural, el pedido del CEO de vender Granola y (en el futuro) Peanut Butter como productos propios en varias presentaciones: cada presentación es su propia receta con `productId`, con la fórmula derivada proporcionalmente de la receta base — ver BP-012.