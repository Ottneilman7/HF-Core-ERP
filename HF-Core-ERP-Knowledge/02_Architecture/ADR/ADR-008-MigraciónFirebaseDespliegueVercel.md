# ADR-008  Migración a Firebase (Firestore + Auth) y despliegue en Vercel — Fase A

**Fecha:** 20/07/2026.

**Estado:** Aprobada. En implementación, módulo por módulo (ver BP-023).

---

## Contexto

BP-015 dejó registrado el plan de dos fases (localStorage puente → Firebase/Vercel definitivo) y una adenda posterior fijó el criterio de disparo: ciclo completo del MVP funcionando (cumplido, BP-022) + necesidad real de multiusuario/multi-dispositivo. El CEO confirmó ambas condiciones y pidió avanzar.

Se separan explícitamente dos alcances (decisión de secuencia, no de descarte):

- **Fase A (este ADR):** migrar los datos reales de Honestly Foods de `localStorage` a Firebase, con un solo usuario (el CEO) autenticado, desplegado en Vercel. Resuelve backup real y acceso multi-dispositivo.
- **Fase B (Backlog, próximo proyecto grande):** convertir la app en SaaS multiusuario — cualquier emprendedor se registra y opera su propio negocio aislado. Es la visión de `PRODUCT_VISION.md` a mediano plazo, pero requiere aislamiento de datos por negocio (multi-tenancy) y no se construye hasta que Fase A esté probada.

## Decisión

### Autenticación
Firebase Authentication, método correo/contraseña. Una sola cuenta por ahora (el CEO). El diseño de datos ya deja espacio para más usuarios en Fase B sin rehacer nada (ver modelo de datos).

### Modelo de datos en Firestore

Se preserva la lógica de negocio de cada servicio (`configService`, `rawMaterialInventoryService`, etc.) — cambia solo el mecanismo de persistencia, de `localStorage` a Firestore. Estructura elegida, pensando ya en Fase B sin migrar de nuevo:

```
businesses/{businessId}
  company: { ... }              (antes hf_config_company)
  parameters: { ... }            (antes hf_config_parameters)
  taxConfig: { ... }             (antes hf_config_taxes)
  rawMaterials/{rawMaterialId}
  recipes/{recipeId}
  products/{productId}
  suppliers/{supplierId}
  purchaseOrders/{orderId}
  customers/{customerId}
  sales/{saleId}
  payments/{paymentId}
  marketingStrategy: { ... }
  marketingPosts/{postId}
```

Todo vive bajo `businesses/{businessId}` desde el día uno — en Fase A, `businessId` es fijo ("honestly-foods"), pero la estructura ya está lista para que en Fase B cada negocio nuevo sea otro documento en `businesses/`, sin migrar nada de lo de Honestly Foods.

### Reglas de seguridad de Firestore (borrador Fase A)

Acceso solo a usuarios autenticados, y solo al documento de su propio negocio (hoy: uno solo). Se entrega el archivo `firestore.rules` completo en esta misma entrega — el CEO debe pegarlo en la consola de Firebase (Firestore → Reglas).

### Migración de datos semilla

`rawMaterials.ts`, `recipes.ts`, `products.ts`, `customers.ts` dejan de ser la semilla en código — sus datos se cargan UNA VEZ a Firestore (script de migración, ver BP-023) y de ahí en adelante Firestore es la única fuente de verdad. Los archivos `.ts` se conservan en el repo como referencia histórica pero ya no se importan desde los servicios.

### Despliegue

Vercel, conectado directo al repositorio de GitHub (`HF-CORE-ERP`) — cada push a la rama principal despliega automáticamente. Variables de entorno de Firebase se configuran en el panel de Vercel, no se suben al repo.

## Consecuencias

- Cada servicio migrado pasa de funciones síncronas a `async/await` (Firestore es asíncrono). Esto obliga a actualizar cada página que los use (estados de carga, `useEffect`). Es un cambio real de código en cada módulo, no solo de "backend" — se hace uno por uno (BP-023 empieza por Configuración, mismo orden que localStorage).
- El patrón "semilla + overrides" (ADR-005, ADR-006) desaparece — ya no hace falta, porque Firestore ya es la fuente de verdad persistente. Se simplifica cada servicio al migrarlo.
- Mientras dura la migración módulo por módulo, la app va a tener MÓDULOS EN FIREBASE y MÓDULOS TODAVÍA EN LOCALSTORAGE al mismo tiempo — se documenta claramente en cada Blueprint cuál es cuál, para no generar el mismo tipo de confusión que tuvimos en BP-018/BP-021 con materia prima.

## Referencia

Extiende BP-015 (Fase 2, activada). Ver BP-023 para el plan de ejecución.