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

<!-- Pega este bloque al final de tu BP-015-PersistenciadeDatosyDespliegue.md real -->

---

## Adenda (19/07/2026) — Decisión de arquitecto: posponer Fase 2 (Firebase/Vercel)

El CEO preguntó directamente, tras cerrar BP-018 (Compras), si convenía migrar a Firebase/Vercel ahora antes de seguir con Ventas. Decisión del CTO:

**No todavía.** Razones:

1. Hoy hay un solo usuario, en un solo dispositivo — el problema que Firebase resuelve (multiusuario, multi-dispositivo, respaldo en la nube) todavía no existe en la operación real del negocio.
2. Faltan 2-3 sprints para cerrar el ciclo completo del verdadero MVP (Vender, Cobrar). Migrar de backend a mitad de camino detiene la construcción de funcionalidad para migrar infraestructura — el tipo de desvío que EL-Verdadero-MVP-EIF.md pide evitar explícitamente.
3. El riesgo real de `localStorage` (perder todo al limpiar el navegador) se mitiga con una función de exportar/importar respaldo `.json` — mucho menor costo que un backend completo.

**Nuevo criterio de disparo para Fase 2:** cuando el ciclo completo (Configurar → Catálogo → Comprar → Producir → Vender → Cobrar) esté funcionando con datos reales del negocio Y exista una necesidad concreta de acceso multiusuario o multi-dispositivo. En ese punto, migrar una sola vez, con todos los módulos maduros — no módulo por módulo.

**Estado actualizado:** Fase 1 (localStorage) ya está en producción de facto, aplicada módulo por módulo a medida que cada uno la necesitó: Configuración (BP-016) y Materia Prima real (BP-018/ADR-005). Próximo módulo en usar el mismo patrón: Producto Terminado, cuando se aborde Ventas.

**Backlog agregado:** función de exportar/importar respaldo de `localStorage` (botón "Exportar respaldo" / "Importar respaldo", descarga/sube un `.json`) como red de seguridad mientras se sigue en Fase 1. Bajo esfuerzo, próximo sprint disponible.
