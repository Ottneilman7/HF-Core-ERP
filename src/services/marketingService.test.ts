// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as marketingService from "./marketingService";

describe("marketingService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("sin configurar, devuelve la estrategia por defecto (2/semana + pilares sugeridos)", () => {
    const strategy = marketingService.getStrategy();
    expect(strategy.postsPerWeekTarget).toBe(2);
    expect(strategy.contentPillars.length).toBeGreaterThan(0);
  });

  it("guarda una estrategia personalizada", () => {
    marketingService.saveStrategy({
      postsPerWeekTarget: 4,
      contentPillars: ["Producto", "Promociones"],
      updatedAt: new Date().toISOString(),
    });
    expect(marketingService.getStrategy().postsPerWeekTarget).toBe(4);
  });

  it("crea una publicación planificada y la lista", () => {
    marketingService.createPost("Foto del proceso de granola", "2026-08-01");
    expect(marketingService.getPosts()).toHaveLength(1);
    expect(marketingService.getPosts()[0].status).toBe("planned");
  });

  it("rechaza una publicación sin título", () => {
    expect(() => marketingService.createPost("", "2026-08-01")).toThrow();
  });

  it("marca una publicación como publicada", () => {
    const post = marketingService.createPost("Testimonio cliente", "2026-08-01");
    marketingService.setPostStatus(post.id, "published");
    expect(marketingService.getPosts()[0].status).toBe("published");
  });

  it("sugiere publicar si hay una planificada para hoy", () => {
    const today = new Date().toISOString().slice(0, 10);
    marketingService.createPost("Post de hoy", today);
    const suggestions = marketingService.getSuggestions();
    expect(suggestions.some((s) => s.includes("Hoy toca publicar"))).toBe(true);
  });

  it("sugiere recuperar una publicación atrasada", () => {
    marketingService.createPost("Post viejo", "2020-01-01");
    const suggestions = marketingService.getSuggestions();
    expect(suggestions.some((s) => s.includes("pendiente de publicar"))).toBe(true);
  });

  it("sugiere completar la meta semanal si faltan publicaciones planificadas", () => {
    const suggestions = marketingService.getSuggestions();
    expect(suggestions.some((s) => s.includes("tu meta es"))).toBe(true);
  });
});