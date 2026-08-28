// ProductionAlertsContext.tsx — puente entre Producción y Centro de
// Decisiones. Ahora incluye resetAlerts() (feedback del CEO: poder limpiar
// la consulta actual para empezar una nueva) y el máximo producible.

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ProductionNeed } from "../models/ProductionNeed";

export interface ProductionAlert {
  productName: string;
  shortages: ProductionNeed[];
  warnings: ProductionNeed[];
  maxProducible?: number;
  yieldUnit?: string;
}

interface ProductionAlertsContextValue {
  alerts: Record<string, ProductionAlert>;
  reportProductionNeeds: (
    productId: string,
    productName: string,
    shortages: ProductionNeed[],
    warnings: ProductionNeed[],
    maxProducible?: number,
    yieldUnit?: string
  ) => void;
  resetAlerts: () => void;
}

const ProductionAlertsContext = createContext<ProductionAlertsContextValue | undefined>(undefined);

export function ProductionAlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Record<string, ProductionAlert>>({});

  function reportProductionNeeds(
    productId: string,
    productName: string,
    shortages: ProductionNeed[],
    warnings: ProductionNeed[],
    maxProducible?: number,
    yieldUnit?: string
  ) {
    setAlerts((prev) => {
      const next = { ...prev };
      if (shortages.length === 0 && warnings.length === 0) {
        delete next[productId];
      } else {
        next[productId] = { productName, shortages, warnings, maxProducible, yieldUnit };
      }
      return next;
    });
  }

  function resetAlerts() {
    setAlerts({});
  }

  return (
    <ProductionAlertsContext.Provider value={{ alerts, reportProductionNeeds, resetAlerts }}>
      {children}
    </ProductionAlertsContext.Provider>
  );
}

export function useProductionAlerts() {
  const ctx = useContext(ProductionAlertsContext);
  if (!ctx) {
    throw new Error("useProductionAlerts debe usarse dentro de <ProductionAlertsProvider>.");
  }
  return ctx;
}
