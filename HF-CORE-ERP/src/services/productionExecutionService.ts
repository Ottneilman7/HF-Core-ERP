/**
 * Servicio: Ejecución real de Producción (BP-021 — Producción Fase 2)
 *
 * Cierra el puente manual de ADR-006 (BP-019): en vez de que el
 * emprendedor anote a mano cuánto fabricó, "Confirmar producción" aplica
 * de verdad el efecto: consume materia prima y semielaborados, y suma
 * el resultado a producto terminado vendible o al stock del semielaborado.
 *
 * Reutiliza el motor ya probado de productionCalculatorService
 * (calculateProductionNeeds) sin modificarlo — Regla 1.
 *
 * BP-042: increaseStock de finishedGoodsInventoryService es ahora async
 * (migrado a Firestore) — se agrega await en la llamada correspondiente.
 *
 * Auditoría de arquitectura (H3, 2026-08-31): esta función se reescribe
 * para correr dentro de una ÚNICA runTransaction de Firestore. Antes
 * descontaba cada insumo con un `await` independiente por fuera de toda
 * transacción — el comentario decía "todo o nada" pero no lo era: si la
 * escritura N fallaba, las N-1 anteriores ya habían quedado aplicadas, y
 * dos confirmaciones casi simultáneas podían pisarse los datos (lost
 * update) porque cada consumeStock/decreaseStock hacía su propio
 * "leer → calcular → escribir" por separado. Ahora todas las lecturas se
 * hacen primero (regla de Firestore: toda lectura de una transacción va
 * antes que cualquier escritura), se revalida disponibilidad con los
 * valores frescos leídos DENTRO de la transacción (no con el snapshot
 * previo, que puede estar desactualizado), y solo si todo alcanza se
 * agrupan las escrituras — si Firestore detecta que algún documento
 * cambió entre la lectura y el commit, reintenta la transacción sola.
 */
import { runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Recipe } from "../models/Recipe";
import { calculateProductionNeeds, ProductionCalculationError } from "./productionCalculatorService";
import * as rawMaterialInventoryService from "./rawMaterialInventoryService";
import * as recipeStockService from "./recipeStockService";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";
import * as wasteLogService from "./wasteLogService";

/**
 * Confirma una producción real. Todo o nada: primero valida que TODO lo
 * necesario (materia prima + semielaborados) esté disponible; si algo
 * falta, no se aplica ningún cambio. Si alcanza, descuenta cada insumo
 * según lo PLANEADO (`quantityToProduce`) y suma al inventario lo
 * REALMENTE OBTENIDO (`actualQuantity`, BP-040 — merma de proceso).
 *
 * Si no se indica `actualQuantity`, se asume igual a lo planeado (sin
 * merma) — compatible con cualquier llamada anterior a este cambio.
 */
export async function confirmProduction(
  recipe: Recipe,
  quantityToProduce: number,
  actualQuantity?: number
): Promise<void> {
  if (quantityToProduce <= 0) {
    throw new ProductionCalculationError("La cantidad a producir debe ser mayor que cero.");
  }
  const producedQuantity = actualQuantity ?? quantityToProduce;
  if (producedQuantity < 0) {
    throw new ProductionCalculationError("La cantidad real obtenida no puede ser negativa.");
  }

  // Primera pasada (fuera de la transacción): usamos el motor existente
  // solo para saber QUÉ documentos están involucrados (qué materias
  // primas/semielaborados exige esta receta). Las cantidades exactas se
  // vuelven a validar más abajo con datos leídos dentro de la transacción,
  // así que un snapshot desactualizado aquí no compromete la atomicidad.
  const rawMaterials = await rawMaterialInventoryService.getEffectiveRawMaterials();
  const effectiveRecipes = await recipeStockService.getEffectiveRecipes();
  const needs = calculateProductionNeeds(recipe, quantityToProduce, rawMaterials, effectiveRecipes);

  await runTransaction(db, async (tx) => {
    // --- FASE DE LECTURA (debe ir toda antes que cualquier escritura) ---
    const freshBySourceId = new Map<string, number>();
    for (const need of needs) {
      if (need.sourceType === "rawMaterial") {
        const snap = await tx.get(rawMaterialInventoryService.rawMaterialDocRef(need.sourceId));
        if (!snap.exists()) throw new ProductionCalculationError(`Materia prima no encontrada: ${need.sourceId}`);
        freshBySourceId.set(need.sourceId, (snap.data().currentStock as number) ?? 0);
      } else {
        const snap = await tx.get(recipeStockService.recipeDocRef(need.sourceId));
        if (!snap.exists()) throw new ProductionCalculationError(`Receta no encontrada: ${need.sourceId}`);
        freshBySourceId.set(need.sourceId, (snap.data().currentStock as number) ?? 0);
      }
    }

    const destinationRef = recipe.tracksInventory
      ? recipeStockService.recipeDocRef(recipe.id)
      : finishedGoodsInventoryService.productDocRef(recipe.id);
    const destinationSnap = await tx.get(destinationRef);
    const destinationCurrentStock = recipe.tracksInventory
      ? ((destinationSnap.data()?.currentStock as number) ?? 0)
      : ((destinationSnap.data()?.stock as number) ?? 0);

    // --- REVALIDACIÓN con datos frescos (no con el snapshot previo) ---
    const shortages = needs.filter((n) => (freshBySourceId.get(n.sourceId) ?? 0) < n.requiredQuantity);
    if (shortages.length > 0) {
      throw new ProductionCalculationError(
        `No se puede confirmar: falta ${shortages.map((s) => s.name).join(", ")}.`
      );
    }

    // --- FASE DE ESCRITURA ---
    // Importante: NO reutilizamos aquí consumeStockInTx/decreaseStockInTx
    // (esos helpers hacen su propio tx.get) porque Firestore prohíbe
    // leer después de haber escrito dentro de la misma transacción. Ya
    // tenemos los valores frescos de la fase de lectura (freshBySourceId),
    // así que escribimos directamente con ellos.
    for (const need of needs) {
      const fresh = freshBySourceId.get(need.sourceId) ?? 0;
      const newStock = fresh - need.requiredQuantity;
      if (need.sourceType === "rawMaterial") {
        tx.set(rawMaterialInventoryService.rawMaterialDocRef(need.sourceId), { currentStock: newStock }, { merge: true });
      } else {
        tx.set(recipeStockService.recipeDocRef(need.sourceId), { currentStock: newStock }, { merge: true });
      }
    }

    if (recipe.tracksInventory) {
      // Semielaborado con inventario propio (BP-048)
      tx.set(destinationRef, { currentStock: destinationCurrentStock + producedQuantity }, { merge: true });
    } else {
      // Producto terminado → indexado por recipe.id
      finishedGoodsInventoryService.increaseStockInTx(tx, recipe.id, producedQuantity, destinationCurrentStock);
    }
  });

  // Registrar merma si la hubo (BP-040). Se deja fuera de la transacción a
  // propósito: es un registro de auditoría "append-only" sin riesgo de
  // condición de carrera (siempre crea un doc nuevo con id aleatorio), y
  // así no hacemos más grande la transacción crítica de stock.
  if (producedQuantity < quantityToProduce) {
    await wasteLogService.logProcessWaste(
      recipe.id,
      recipe.name ?? recipe.code,
      quantityToProduce,
      producedQuantity,
      recipe.yieldUnit
    );
  }
}