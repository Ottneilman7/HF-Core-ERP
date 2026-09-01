# HF CORE ERP

# AI CONTEXT

Versión: 2.0 — actualizado 01/08/2026 (refleja la migración a Firebase y las lecciones de BP-023 a BP-038)

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

**Estado actual (01/08/2026):** los 8 flujos del MVP están completos y en uso real por Honestly Foods CA (ver `PROJECT_STATUS.md` para el detalle). El proyecto está en fase de estabilización, no de construcción inicial.

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

11. (agregada 01/08/2026, ver ADR-009)

**Todo campo nuevo agregado a un modelo ya en uso (`Sale`, `Payment`, `Invoice`, `Customer`, `Supplier`, `PurchaseOrder`, etc.) debe leerse siempre con respaldo** (`?? valorPorDefecto`, `Number.isFinite(...)`) en cada lugar donde se consulta — nunca asumir que todos los registros ya existentes en Firestore lo tienen. Esta regla se adoptó después de que el mismo tipo de bug (un registro antiguo sin el campo nuevo tumbando toda una pantalla) se repitiera varias veces entre BP-035 y BP-038.

---

# Tecnologías

Frontend

React

TypeScript

Vite

---

Backend / Persistencia

**Firebase**: Firestore (base de datos) + Authentication (login por correo/contraseña).

Sin backend propio — la lógica de negocio vive en `src/services/*.ts`, que hablan directo con Firestore desde el cliente. Reglas de seguridad de Firestore (`firestore.rules`) restringen todo a `businesses/{businessId}` y usuarios autenticados.

Cada colección de Firestore tuvo, en su momento, una "semilla" en código (`data/*.ts`) migrada una sola vez mediante una página temporal (`Migrate*Page.tsx`, siempre borrada después de usarse) — de ahí en adelante Firestore es la única fuente de verdad, el archivo de semilla queda solo como referencia histórica.

Despliegue previsto: Vercel (conectado al repo de GitHub).

---

Lenguaje

TypeScript estricto.

---

Arquitectura

Componentes reutilizables.

Modelos separados.

Servicios separados.

Reglas de negocio separadas de la interfaz.

**Patrón "uno de dos, nunca ambos"**: cuando un ítem puede ser de más de un tipo (`RecipeItem`: materia prima o receta componente; `PurchaseOrderItem`: materia prima o semielaborado; `SaleItem`: producto, semielaborado o materia prima), se usa un set de campos opcionales mutuamente excluyentes, no un `enum` + unión de tipos. Consistente desde ADR-004; repetido a propósito en ADR-007 y BP-028 por la misma razón: menos tipos que sincronizar, más fácil de validar con una función simple.

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

Datos temporales (semillas, ya no fuente de verdad para los módulos migrados a Firestore)

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

CHANGELOG (o el Blueprint correspondiente, que ha reemplazado al CHANGELOG único como registro principal desde BP-023 en adelante)

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

# Cómo Colaborar con este Proyecto

Indicando:

Leer START_HERE.

Leer PROJECT_STATUS.

Revisar Blueprint.

Revisar ADR.

Programar.

**Si el proyecto se traspasa a un equipo nuevo:** además de lo anterior, leer completo este documento y `PROJECT_STATUS.md` primero — ambos reflejan el estado real al 01/08/2026, no el estado inicial del proyecto.

Fin del Documento.