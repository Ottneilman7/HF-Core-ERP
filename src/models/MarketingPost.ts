export type MarketingPostStatus = "planned" | "published";

export interface MarketingPost {
  id: string;
  title: string; // idea o tema del post
  scheduledDate: string; // fecha YYYY-MM-DD
  status: MarketingPostStatus;
  notes?: string;
  createdAt: string; // ISO date
}