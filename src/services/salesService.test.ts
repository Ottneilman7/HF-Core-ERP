// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import * as salesService from "./salesService";
import * as finishedGoodsInventoryService from "./finishedGoodsInventoryService";
import * as customerBalanceService from "./customerBalanceService";

describe("salesService", () => {
  beforeEach(() => {
    localStorage.clear();
    finishedGoodsInventoryService.increaseStock("1", 100); // Honestly Bar Classic
  });

  it("venta de contado descuenta inventario y NO toca el saldo del cliente", () => {
    customerBalanceService.getCustomerById("2"); // Fit Market, balance semilla 0
    salesService.createSale("2", [{ productId: "1", quantity: 10, unitPrice: 1.5 }], "cash");

    expect(finishedGoodsInventoryService.getStock("1")).toBe(90);
    expect(customerBalanceService.getCustomerById("2")?.balance).toBe(0);
  });

  it("venta a crédito descuenta inventario Y aumenta el saldo del cliente", () => {
    salesService.createSale("1", [{ productId: "1", quantity: 10, unitPrice: 1.5 }], "credit");

    expect(finishedGoodsInventoryService.getStock("1")).toBe(90);
    expect(customerBalanceService.getCustomerById("1")?.balance).toBe(135); // 120 (semilla) + 15
  });

  it("rechaza la venta si no hay inventario suficiente y no descuenta nada", () => {
    expect(() =>
      salesService.createSale("1", [{ productId: "1", quantity: 200, unitPrice: 1.5 }], "cash")
    ).toThrow();
    expect(finishedGoodsInventoryService.getStock("1")).toBe(100); // sin cambios
  });

  it("con varios ítems, si uno falla no se descuenta ninguno (todo o nada)", () => {
    finishedGoodsInventoryService.increaseStock("2", 5);
    expect(() =>
      salesService.createSale(
        "1",
        [
          { productId: "1", quantity: 10, unitPrice: 1.5 }, // hay stock
          { productId: "2", quantity: 999, unitPrice: 2 }, // no hay stock
        ],
        "cash"
      )
    ).toThrow();

    expect(finishedGoodsInventoryService.getStock("1")).toBe(100); // no se tocó
    expect(finishedGoodsInventoryService.getStock("2")).toBe(5); // no se tocó
  });

  it("calcula el total correctamente y lo guarda en la venta", () => {
    const sale = salesService.createSale(
      "1",
      [{ productId: "1", quantity: 4, unitPrice: 1.5 }],
      "cash"
    );
    expect(sale.total).toBe(6);
    expect(salesService.getSales()).toHaveLength(1);
  });
});