// products.ts — catálogo real de productos vendibles (BP-011/012)

import type { Product } from "../models/Product";

export const products: Product[] = [
  { id: "1", code: "HB_C1", name: "Honestly Bar Classic", description: "Granola, mantequilla de maní artesanal, miel y tira de fruta deshidratada.", category: "Barras", active: true },
  { id: "2", code: "HB_R1", name: "Honestly Bar Recovery", description: "Granola, almendra fileteada, chía, mantequilla de maní y miel.", category: "Barras", active: true },
  { id: "3", code: "HB_E1", name: "Honestly Bar Energy", description: "Granola, tira de fruta, mantequilla de maní, miel y cobertura de chocolate oscuro 70%.", category: "Barras", active: true },

  // Presentaciones reales de Granola Tradicional (BP-012)
  { id: "4", code: "HG_T050", name: "Granola Tradicional 50g", description: "Presentación individual de 50g.", category: "Granola", active: true },
  { id: "5", code: "HG_T200", name: "Granola Tradicional 200g", description: "Presentación de 200g.", category: "Granola", active: true },
  { id: "6", code: "HG_T400", name: "Granola Tradicional 400g", description: "Presentación de 400g.", category: "Granola", active: true },
];