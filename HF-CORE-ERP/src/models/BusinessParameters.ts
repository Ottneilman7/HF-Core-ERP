/**
 * Modelo: Parámetros del negocio (Flujo 1 — Configurar el negocio)
 * Moneda base y margen sugerido por defecto: usados por el módulo de
 * Costeo/Precio de Venta (Sprint 3) y por Ventas/Facturación (futuro).
 */
export type WeightUnit = 'g' | 'kg';
export type VolumeUnit = 'ml' | 'l';

/** Plazos de retorno de inversión permitidos, en meses (BP-XXX, módulo de Costeo/Precios). */
export type RoiPaybackMonths = 6 | 12 | 18 | 24 | 30 | 36 | 48 | 60;

/** Método para repartir los costos fijos mensuales entre productos. */
export type FixedCostAllocationMethod = 'direct_cost_proration' | 'abc_time_based';

/** Un renglón de costo fijo adicional que el usuario decide reflejar (ej. "Internet", "Seguro"). */
export interface CustomFixedCost {
  id: string;
  label: string;
  monthlyAmount: number;
}

/**
 * ROI simplificado (equipos + herramientas, con plazo de retorno elegido).
 * La cuota mensual se recalcula: (equipmentAmount + toolsAmount) / paybackMonths.
 */
export interface RoiSettings {
  equipmentAmount: number;   // monto total invertido en equipos
  toolsAmount: number;       // monto en herramientas/accesorios necesarios para producir
  paybackMonths: RoiPaybackMonths;
}

/** Costos Indirectos de Fabricación + Mano de Obra, mensuales. Todos los campos son opcionales — el usuario llena solo lo que aplica a su negocio. */
export interface CifSettings {
  laborCost?: number;         // mano de obra
  servicesCost?: number;      // servicios usados para producción (luz, agua, gas, etc.)
  rentCost?: number;          // alquiler / pago local
  otherCosts?: CustomFixedCost[]; // renglones adicionales que el usuario quiera agregar
}

export interface MarketingSettings {
  monthlyAmount?: number; // muestras, publicidad, promociones mensuales
}

/**
 * Configuración del módulo de Costeo/Precios (BP-XXX). Todos los montos
 * son mensuales. `totalOperativeHoursMonthly` solo aplica si
 * allocationMethod === 'abc_time_based' (Método 2 — ver
 * pricingService.ts para las fórmulas).
 */
export interface CostingSettings {
  roi: RoiSettings;
  cif: CifSettings;
  marketing: MarketingSettings;
  allocationMethod: FixedCostAllocationMethod;
  totalOperativeHoursMonthly?: number; // requerido solo para el método ABC por tiempo
}

export interface BusinessParameters {
  id: string;
  baseCurrency: string; // Código ISO, ej. 'USD', 'VES'
  defaultMarginPercentage: number; // Margen sugerido por defecto sobre el costo
  defaultWeightUnit: WeightUnit;
  defaultVolumeUnit: VolumeUnit;
  costingSettings?: CostingSettings; // opcional: el negocio puede no haberlo configurado aún
  updatedAt: string; // ISO date
}