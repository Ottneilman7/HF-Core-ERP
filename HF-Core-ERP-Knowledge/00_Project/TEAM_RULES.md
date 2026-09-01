# HF CORE ERP

# TEAM RULES

Versión 1.0

---

# Propósito

Estas reglas definen la forma oficial de desarrollar HF Core ERP.

Se aplican tanto a desarrolladores humanos como a asistentes de Inteligencia Artificial.

---

# Regla 1

Nunca perder trabajo existente.

Siempre reutilizar.

---

# Regla 2

La documentación tiene el mismo valor que el código.

---

# Regla 3

Cada entregable debe estar completamente terminado antes de iniciar el siguiente.

---

# Regla 4

Todo desarrollo debe quedar registrado mediante:

- Blueprint

- Git

- CHANGELOG

- PROJECT_INDEX

---

# Regla 5

El código debe ser sencillo de entender.

La simplicidad tiene prioridad sobre la complejidad.

---

# Regla 6

Las reglas de negocio nunca deben vivir dentro de la interfaz gráfica.

Siempre deberán evolucionar hacia servicios reutilizables.

---

# Regla 7

Construir primero un MVP funcional.

Optimizar después.

---

# Regla 8

No desarrollar funcionalidades futuras únicamente porque son interesantes.

Toda nueva idea deberá registrarse en el Backlog.

---

# Regla 9

Explicar antes de programar.

El proyecto también tiene un objetivo educativo.

---

# Regla 10

Cada mejora debe aumentar el valor del producto.

No solamente agregar funcionalidades.

---

# Regla 11

Las decisiones importantes deberán documentarse.

Nunca depender únicamente de la memoria de una conversación.

---

# Regla 12

Cada módulo deberá poder evolucionar sin romper módulos anteriores.

---

# Regla 13

El usuario controla el negocio.

El ERP debe adaptarse al negocio del usuario.

No obligar al usuario a adaptarse al ERP.

Ejemplos:

- Codificación configurable

- Parámetros configurables

- Políticas de inventario configurables

- Impuestos configurables

---

# Regla 14

Pensar siempre como Startup.

Antes de desarrollar una funcionalidad preguntar:

¿Genera valor para el MVP?

Si la respuesta es NO...

Registrar en Backlog.

---

# Regla 15

HF Core ERP no es solamente software.

Es una plataforma de crecimiento empresarial.

Toda decisión debe acercarnos a ese objetivo.
---
# Regla 16

Una sola fuente de verdad.

---
# Regla 17

No duplicar documentación.
---

# REGLA 18 Consideración importante:

Los documentos del repositorio de conocimiento tendrán una única responsabilidad, un único propósito.

Ningún documento duplicará información cuyo origen oficial sea otro documento.

Esa regla, aplicada durante todo el proyecto, evitará que la documentación se vuelva inconsistente.

# Regla 19 FLUJO OFICIAL DE TRABAJO

Idea
        ↓
Validación con PRODUCT_VISION
        ↓
Blueprint
        ↓
Revisión CEO
        ↓
Aprobación
        ↓
Implementación
        ↓
Pruebas
        ↓
Actualizar Blueprint
        ↓
Actualizar PROJECT_STATUS
        ↓
Actualizar CHANGELOG
        ↓
Commit
        ↓
Push
        ↓
Cerrar ENT
---

# Regla 20 — Checklist obligatorio de cierre de Entregable

Ningún Blueprint puede marcarse como "✅ Finalizado" sin que, en el mismo momento, se actualicen estos tres documentos:


1. Blueprint correspondiente → sección "Estado" con fecha y confirmación de commit/push.
2. PROJECT_STATUS.md → "Última ENT finalizada" y "Blueprint activo" (apuntando ya al siguiente).
3. CHANGELOG → entrada de la entrega cerrada.


Un Blueprint y PROJECT_STATUS nunca deben decir cosas distintas sobre el mismo entregable. Si eso ocurre, ninguno de los dos se asume como verdad hasta que el CEO confirme cuál es el estado real (Regla de Oro, START_HERE.md).

Checklist de cierre, en orden:

[ ] Pruebas verificadas en navegador
[ ] git status
[ ] git add .
[ ] git commit -m "..."
[ ] git push
[ ] Confirmación explícita del CEO (fecha)
[ ] Blueprint → Estado: ✅ Finalizado + fecha
[ ] PROJECT_STATUS.md actualizado en el mismo momento
[ ] CHANGELOG actualizado


Fin del Documento.
