// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import * as customerBalanceService from "./customerBalanceService";

describe("customerBalanceService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("sin overrides, devuelve el saldo de la semilla (El Centro: 120)", () => {
    const customer = customerBalanceService.getCustomerById("1");
    expect(customer?.balance).toBe(120);
  });

  it("adjustBalance suma sobre el saldo vigente", () => {
    customerBalanceService.adjustBalance("1", 50);
    expect(customerBalanceService.getCustomerById("1")?.balance).toBe(170);
  });

  it("adjustBalance con monto negativo resta (uso futuro: registrar un pago)", () => {
    customerBalanceService.adjustBalance("1", 50); // 120 + 50 = 170
    customerBalanceService.adjustBalance("1", -70); // 170 - 70 = 100
    expect(customerBalanceService.getCustomerById("1")?.balance).toBe(100);
  });

  it("lanza error si el cliente no existe", () => {
    expect(() => customerBalanceService.adjustBalance("no-existe", 10)).toThrow();
  });
});