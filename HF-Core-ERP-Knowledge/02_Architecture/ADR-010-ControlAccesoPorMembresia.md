# ADR-010 — Control de acceso por membresía (Firestore Rules), no por PIN ni por lista fija

## Contexto
Las reglas actuales solo verifican `request.auth != null` — cualquier sesión
válida en el proyecto de Firebase accede a todo. Se necesita una forma de
verificar pertenencia real a un negocio y rol, sin backend propio (ADR-008:
seguimos sin servidor propio, la lógica vive en Firestore Rules + servicios
del cliente).

## Decisión
Se usa el propio Firestore como fuente de verdad del rol: un `get()` dentro
de la regla, contra `businesses/{businessId}/members/{uid}`, en vez de
Custom Claims de Firebase Auth (que requerirían una Cloud Function para
asignarse) o un PIN compartido (inseguro por diseño: cualquier valor en
`VITE_*` es legible en el bundle del navegador, como ya quedó documentado en
`.env.example`).

## Alternativas consideradas
1. **Custom Claims + Cloud Function** — más "correcto" a largo plazo, pero
   agrega una pieza de infraestructura nueva (Cloud Functions, con costo y
   despliegue propio) que hoy no existe en el proyecto. Se deja como
   evolución futura si el volumen de usuarios lo justifica.
2. **PIN compartido (actual)** — descartado: no es control de acceso real,
   es un secreto compartido visible en el cliente.
3. **`get()` en Firestore Rules (elegida)** — cero infraestructura nueva,
   reutiliza lo que ya existe (Firestore), y el costo de lectura extra por
   regla es marginal para el volumen de un solo negocio pequeño.

## Consecuencias
- Cada colección dentro de `businesses/{businessId}/` queda protegida por
  membresía real, no por convención del cliente.
- El campo `CURRENT_BUSINESS_ID` en `lib/firebase.ts` sigue siendo solo una
  comodidad de UX en el cliente (qué negocio se está mostrando) — la
  seguridad real nunca depende de él, depende de las Rules.
- Cambiar el rol de alguien es editar un documento (`members/{uid}`), no
  redesplegar código.

## Estado
Propuesta — pendiente de aprobación (acompaña a BP-053).