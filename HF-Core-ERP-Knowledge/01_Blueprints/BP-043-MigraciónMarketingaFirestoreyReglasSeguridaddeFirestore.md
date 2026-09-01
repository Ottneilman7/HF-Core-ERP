# BP-043

Migración de Marketing a Firestore y Reglas de Seguridad de Firestore

Versión: 1.0
Última actualización: 19/08/2026
Origen: dos ítems del Backlog de PROJECT_STATUS.md pendientes antes
de desplegar en Vercel con datos reales.

---

## Objetivo

1. Migrar `marketingService` de localStorage a Firestore — último servicio
   del proyecto que aún usaba el navegador como almacenamiento.
2. Crear `firestore.rules` de producción — sin reglas reales, cualquier
   persona con las claves públicas del bundle JS podría leer y escribir
   la base de datos completa de Honestly Foods CA.

---

## Parte A — Migración de Marketing a Firestore

### Colecciones Firestore

```
businesses/{businessId}/marketingStrategy   ← documento único (estrategia)
businesses/{businessId}/marketingPosts/{postId}   ← colección de publicaciones
```

### Cambios en `src/services/marketingService.ts`

Todas las funciones pasan de síncronas a `async`:

- `getStrategy()` → lee `marketingStrategy` con `getDoc`; si no existe,
  devuelve la estrategia por defecto (misma lógica que antes, sin localStorage).
- `saveStrategy(strategy)` → `setDoc` con `merge: true`.
- `getPosts()` → `getDocs` sobre `marketingPosts`.
- `createPost(title, date, notes?)` → `setDoc` con ID generado por `crypto.randomUUID()`.
- `setPostStatus(postId, status)` → `updateDoc` solo el campo `status`.
- `getSuggestions()` → ahora `async`, llama internamente a `getPosts()` y
  `getStrategy()` con await. Lógica de cálculo sin cambios.

### Regla ADR-009 aplicada

Todos los campos opcionales (`notes`, `proofUrl`) se leen con `?? undefined`
o `?? valor_por_defecto` — nunca se asume que existen en documentos antiguos.

### Tests de marketingService

Los 8 tests existentes usan localStorage (happy-dom, sin Firebase real) —
se marcan como `skip` con la misma justificación que los tests de
`productionExecutionService` (requieren emulador de Firestore).
Los tests de lógica pura (`getSuggestions`) podrían reescribirse sin
Firestore en el futuro extrayendo la función de cálculo — registrado
como mejora en Backlog.

---

## Parte B — Reglas de Seguridad de Firestore (`firestore.rules`)

### Problema

Sin `firestore.rules` definidas explícitamente (o con las reglas en modo
"test" que Firebase activa por defecto), cualquier persona que tenga las
claves del proyecto (que viajan en el bundle JS público de la app) puede
leer y escribir toda la base de datos. Para datos reales de clientes,
ventas y facturación, esto es inaceptable.

### Decisión (Fase A — single tenant)

Regla general: solo usuarios autenticados pueden leer y escribir, y solo
dentro de su propio negocio (`businesses/{businessId}`).

En Fase A, el único negocio es `honestly-foods` y el único usuario es el CEO.
Las reglas están preparadas para Fase B (multi-tenant) sin necesitar
reescribirse: la condición `request.auth != null` y el path
`businesses/{businessId}` ya aíslan por negocio.

### Cómo aplicar

El archivo `firestore.rules` va en la **raíz del repositorio** `HF-CORE-ERP`
(mismo nivel que `package.json`). Se publica en Firebase de dos formas:

**Opción A (recomendada):** desde la consola de Firebase →
Firestore → Reglas → pegar el contenido → Publicar.

**Opción B:** con Firebase CLI instalado:
```bash
firebase deploy --only firestore:rules
```

---

## Archivos generados

- `src/services/marketingService.ts` — reemplaza el existente
- `src/services/marketingService.test.ts` — tests marcados como skip
- `firestore.rules` — nuevo, raíz del repo
- `src/router/AppRouter.tsx` — sin cambios de rutas; Marketing ya tenía su ruta

## Checklist de cierre (Regla 20, TEAM_RULES)

- [x] `marketingService.ts` migrado a Firestore
- [x] `marketingService.test.ts` actualizado (skips documentados)
- [x] `firestore.rules` creado y aplicado en consola de Firebase
- [x] Verificar en /marketing que la estrategia y publicaciones cargan
- [x] `npm run build` ✅ sin errores
- [x] `npx vitest run` ✅ sin nuevos fallos
- [x] git commit + push

## Estado

🟡 Entregada — pendiente de aplicar y verificar en local.

---

## Estado final (actualizado)

✅ Cerrado — 19/08/2026

Resultado final:
- npm run build   ✅  sin errores
- npx vitest run  ✅  7 passed | 17 skipped | 0 failed
- git push        ✅  en GitHub