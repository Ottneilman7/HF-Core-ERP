# BP-023  Migración a Firebase — Fase A (Setup + Autenticación)

Versión: 1.0
Última actualización: 20/07/2026
Origen: ADR-008.

---

## Objetivo

Dejar la base técnica lista: SDK conectado, login funcionando, reglas de seguridad activas — antes de migrar el primer servicio de negocio.

## Alcance (esta entrega)

- `src/lib/firebase.ts`: inicialización del SDK vía variables de entorno.
- `.env.example`: plantilla de variables (sin valores reales — el CEO las completa en `.env.local`).
- `services/authService.ts`: login, logout, suscripción a cambios de sesión.
- `contexts/AuthContext.tsx`: expone `user`/`loading` a toda la app.
- `pages/LoginPage.tsx`.
- `firestore.rules`: reglas de seguridad (solo usuarios autenticados, acceso a `businesses/{businessId}`).

## Instalación (paso del CEO, antes de probar)

```
npm install firebase
```

## Checklist de esta entrega (antes de pasar a migrar el primer servicio)

- [X] Completar los 5 pasos de configuración en la consola de Firebase (proyecto, Firestore, Authentication, app web) — hecho por el CEO.
- [X] `npm install firebase`.
- [X] Crear `.env.local` a partir de `.env.example` con los valores reales.
- [X] Pegar `firestore.rules` en la consola de Firebase.
- [X] Crear el primer usuario (el CEO) en Authentication → Users → "Add user".
- [X] Copiar `firebase.ts`, `authService.ts`, `AuthContext.tsx`, `LoginPage.tsx` al repo.
- [X] En `AppRouter.tsx`: envolver todo con `<AuthProvider>` (mismo patrón que `ConfigProvider`), y mostrar `<LoginPage />` cuando `!user` en vez del router normal (con `loading` mostrando algo simple mientras se resuelve la sesión).
- [X] Probar: entrar con el correo/contraseña creados, confirmar que carga la app.
- [X] Confirmación del CEO.
- [X] Commit + push (el `.env.local` NO se commitea — confirmar que está en `.gitignore`).

## Próximo paso: BP-024 (a definir orden con el CEO)

Migrar servicios uno por uno de `localStorage` a Firestore. Recomendación de orden (mismo criterio que usamos con localStorage: lo más simple primero, valida el patrón): **Configuración** (ya lo hicimos de piloto en BP-016, mismo espíritu) → Materia Prima → Recetas/Semielaborados → Compras → Ventas/Clientes → Cobranza → Marketing. Cada uno se documenta con su propio BP, como los anteriores.

## Estado

✅ Finalizado — código y pruebas listos, listo checklist arriba.