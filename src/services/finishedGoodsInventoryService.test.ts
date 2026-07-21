// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";

describe("finishedGoodsInventoryService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("un producto sin movimientos empieza en 0", () => {
    expect(finishedGoodsInventoryService.getStock("1")).toBe(0);
  });

  it("increaseStock suma sobre el stock actual", () => {
    finishedGoodsInventoryService.increaseStock("1", 50);
    finishedGoodsInventoryService.increaseStock("1", 20);
    expect(finishedGoodsInventoryService.getStock("1")).toBe(70);
  });

  it("decreaseStock resta si hay suficiente", () => {
    finishedGoodsInventoryService.increaseStock("1", 50);
    finishedGoodsInventoryService.decreaseStock("1", 30);
    expect(finishedGoodsInventoryService.getStock("1")).toBe(20);
  });

  it("decreaseStock lanza error si no hay suficiente inventario", () => {
    finishedGoodsInventoryService.increaseStock("1", 10);
    expect(() => finishedGoodsInventoryService.decreaseStock("1", 11)).toThrow();
    expect(finishedGoodsInventoryService.getStock("1")).toBe(10); // no se modificó
  });
});