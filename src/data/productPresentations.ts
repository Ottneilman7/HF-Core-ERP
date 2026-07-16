import type { ProductPresentation } from "../models/ProductPresentation";
import { products } from "./products";

const classic = products.find(
  (p) => p.name === "Honestly Bar Classic"
)!;

const recovery = products.find(
  (p) => p.name === "Honestly Bar Recovery"
)!;

const energy = products.find(
  (p) => p.name === "Honestly Bar Energy"
)!;

export const productPresentations: ProductPresentation[] = [

  {
    id: crypto.randomUUID(),
    productId: classic.id,
    code: "HB-C1",
    name: "Classic Unidad",
    salesUnit: "Unidad",
    quantity: 1,
    active: true,
  },

  {
    id: crypto.randomUUID(),
    productId: classic.id,
    code: "HB-C3",
    name: "Classic Pack x3",
    salesUnit: "Paquete",
    quantity: 3,
    active: true,
  },

  {
    id: crypto.randomUUID(),
    productId: classic.id,
    code: "HB-C6",
    name: "Classic Pack x6",
    salesUnit: "Paquete",
    quantity: 6,
    active: true,
  },

  {
    id: crypto.randomUUID(),
    productId: recovery.id,
    code: "HB-R1",
    name: "Recovery Unidad",
    salesUnit: "Unidad",
    quantity: 1,
    active: true,
  },

  {
    id: crypto.randomUUID(),
    productId: energy.id,
    code: "HB-E1",
    name: "Energy Unidad",
    salesUnit: "Unidad",
    quantity: 1,
    active: true,
  }

];