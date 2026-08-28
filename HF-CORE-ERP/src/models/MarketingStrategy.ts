export interface MarketingStrategy {
  postsPerWeekTarget: number;
  contentPillars: string[]; // ej. "Producto", "Detrás de cámaras", "Testimonios"
  updatedAt: string; // ISO date
}