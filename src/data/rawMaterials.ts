import type { RawMaterial } from "../models/RawMaterial";

export const rawMaterials: RawMaterial[] = [

  {
    id: "1",
    code: "MP-0001",
    name: "Avena en Hojuelas",
    category: "Cereal",
    unit: "Gramos",
    supplier: "",
    currentStock: 12000,
    minimumStock: 3000,
    unitCost: 0,
    active: true,
  },

  {
    id: "2",
    code: "MP-0002",
    name: "Miel",
    category: "Endulzante",
    unit: "Gramos",
    supplier: "",
    currentStock: 500,
    minimumStock: 1000,
    unitCost: 0,
    active: true,
  },

  {
    id: "3",
    code: "MP-0003",
    name: "Mantequilla de Maní",
    category: "Proteína",
    unit: "Gramos",
    supplier: "",
    currentStock: 3500,
    minimumStock: 500,
    unitCost: 0,
    active: true,
  },

];