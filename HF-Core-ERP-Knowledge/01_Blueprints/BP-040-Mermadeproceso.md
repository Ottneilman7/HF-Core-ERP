# BP-040

Merma de Proceso (Producción)

Versión: 1.0
Última actualización: 15/08/2026
Origen: pedido del CEO — la producción real (evaporación, cocción, secado) rinde menos que la receta nominal, y esa diferencia no se reflejaba en ningún lado.

---

## Objetivo

Que confirmar una producción permita indicar cuánto se obtuvo REALMENTE (no solo lo planeado), y que la diferencia quede registrada como merma — sin alterar el consumo real de materia prima (que ya se compró y se usó, sin importar el rendimiento final).

## Alcance

- `models/WasteLog.ts`: `WasteLogEntry` con `type: "process" | "error"` — esta entrega solo usa `"process"`; `"error"` queda listo para la Parte B.
- `services/wasteLogService.ts`: `logProcessWaste(recipeId, recipeName, plannedQuantity, actualQuantity, unit)` — calcula la diferencia y la guarda; si no hubo merma (o rindió igual/más), no crea registro.
- `services/productionExecutionService.ts`: `confirmProduction` gana un tercer parámetro opcional, `actualQuantity`. Si no se indica, se asume igual a lo planeado (compatible con el código anterior a este cambio). El consumo de materia prima sigue calculándose sobre lo planeado; solo lo que se **suma** al inventario (producto terminado o semielaborado) usa la cantidad real.
- `pages/ProductionPage.tsx`: campo "Cantidad real obtenida", visible solo cuando el cálculo ya confirmó que hay materia prima suficiente (mismo lugar donde aparece "Confirmar producción").

## Decisión de diseño

**La merma no bloquea ni exige confirmación aparte** — es automática: si "cantidad real" < "cantidad planeada", se registra sin fricción extra. El emprendedor no tiene que ir a otra pantalla a "declarar" la pérdida, solo reporta lo que de verdad obtuvo.

## Fuera de alcance (Parte B, próxima)

Merma por error (quema, derrame, mala manipulación) — pérdida de inventario que NO viene de una producción, sino de un descarte directo de materia prima, semielaborado o producto terminado ya existente.

## Checklist de cierre (Regla 20, TEAM_RULES)

- [x] Copiar `WasteLog.ts`, `wasteLogService.ts`, `productionExecutionService.ts`, `ProductionPage.tsx` al repo real.
- [x] Prueba en navegador: producir con cantidad real menor a la planeada, confirmar que el inventario sube solo lo real y que la materia prima se descontó completa.
- [x] Confirmación del CEO.
- [X] Commit + push.

## Estado

🟢 Cerrado — listo commit + push.