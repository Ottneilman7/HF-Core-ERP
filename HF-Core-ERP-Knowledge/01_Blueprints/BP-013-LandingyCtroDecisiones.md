BP-013

Landing de Inicio + Centro de Decisiones como Página Interna

Versión: 1.0
Última actualización: 18/07/2026
Origen: Feedback del CEO tras ver la app en navegador — el Centro de Decisiones como portada no se sentía práctico para el día a día de un emprendedor, que no siempre está produciendo.

---

## Objetivo

Que la portada (`/`) reciba al emprendedor con calidez y lo oriente a elegir qué va a hacer hoy — no que lo reciba con una lista de alertas. El Centro de Decisiones sigue existiendo, pero como una sección más, no como la puerta de entrada.

## Alcance

- `HomePage.tsx` (ruta `/`) se convierte en una landing real: nombre y datos de la empresa, frase motivadora, y accesos directos a las tareas del día (Producir, Vender, Cobrar, Comprar, Promocionar, y un enlace directo al Centro de Decisiones).
- El contenido que antes vivía en `HomePage.tsx` (alertas) se mueve a `DecisionCenterPage.tsx`, en la ruta `/decisions`.
- Se registran rutas para todas las entradas del Sidebar que hoy no tenían página (`/purchases`, `/sales`, `/finance`, `/settings`, nueva `/marketing`), usando un componente genérico `ComingSoonPage` — **honestidad con el usuario**: si el módulo no existe todavía, se dice claramente, no se deja una pantalla en blanco.
- "Recetas" se retira del Sidebar y de las rutas activas. La fórmula de cada producto deja de exponerse en la interfaz (Regla del CEO: es información de cocina, no de dominio público). El archivo `RecipesPage.tsx` no se borra (Regla 1, TEAM_RULES) pero deja de estar enlazado.
- Sidebar gana una entrada "🏠 Inicio" (→ `/`) y "🎯 Centro de Decisiones" ahora apunta a `/decisions`.

## Estado

✅ Finalizado — 19/07/2026