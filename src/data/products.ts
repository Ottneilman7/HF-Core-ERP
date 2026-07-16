import type { Product } from "../models/Product";

export const products: Product[] = [

  {
    id: crypto.randomUUID(),
    name: "Honestly Bar Classic",
    description: "Barra de Granola Classic",
    category: "Granola Bar",
    active: true,
  },

  {
    id: crypto.randomUUID(),
    name: "Honestly Bar Recovery",
    description: "Barra de Granola Recovery",
    category: "Granola Bar",
    active: true,
  },

  {
    id: crypto.randomUUID(),
    name: "Honestly Bar Energy",
    description: "Barra de Granola Energy",
    category: "Granola Bar",
    active: true,
  }

];