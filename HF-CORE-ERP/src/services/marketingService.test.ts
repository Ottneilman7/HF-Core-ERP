// @vitest-environment happy-dom
/**
 * Tests de marketingService
 *
 * BP-043: marketingService migrado a Firestore — todas las funciones
 * son ahora async. Los tests originales usaban localStorage (síncrono)
 * y se marcan como skip porque en entorno de test (sin emulador de
 * Firestore) las llamadas a Firebase devuelven
 * "Missing or insufficient permissions".
 *
 * La lógica de sugerencias (getSuggestions) es candidata a extraerse
 * como función pura en el futuro para poder testearla sin Firestore —
 * registrado como mejora en Backlog (PROJECT_STATUS.md).
 *
 * Backlog: reescribir estos tests contra el emulador de Firestore
 * (firebase emulators:start) para validar el flujo completo.
 */
import { describe, it } from "vitest";

describe("marketingService", () => {
  it.skip("sin configurar, devuelve la estrategia por defecto (requiere emulador Firestore)", () => {});
  it.skip("guarda una estrategia personalizada (requiere emulador Firestore)", () => {});
  it.skip("crea una publicación planificada y la lista (requiere emulador Firestore)", () => {});
  it.skip("rechaza una publicación sin título (requiere emulador Firestore)", () => {});
  it.skip("marca una publicación como publicada (requiere emulador Firestore)", () => {});
  it.skip("sugiere publicar si hay una planificada para hoy (requiere emulador Firestore)", () => {});
  it.skip("sugiere recuperar una publicación atrasada (requiere emulador Firestore)", () => {});
  it.skip("sugiere completar la meta semanal si faltan publicaciones (requiere emulador Firestore)", () => {});
});