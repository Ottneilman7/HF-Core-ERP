/**
 * Servicio: Marketing (Flujo 7 — Campañas → Publicaciones → Seguimiento)
 *
 * A propósito NO es un CRM ni un calendario complejo (EL-Verdadero-MVP-EIF.md
 * lo excluye explícitamente). Es un asistente simple: una meta de
 * publicaciones por semana, pilares de contenido de partida (como los
 * sugeriría un marketing manager en una empresa pequeña), un calendario
 * plano de publicaciones, y recordatorios/sugerencias calculados —
 * mismo espíritu del EIF aplicado a este flujo.
 */
import type { MarketingStrategy } from "../models/MarketingStrategy";
import type { MarketingPost, MarketingPostStatus } from "../models/MarketingPost";

const STRATEGY_KEY = "hf_marketing_strategy";
const POSTS_KEY = "hf_marketing_posts";

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Estrategia ---

const DEFAULT_STRATEGY: MarketingStrategy = {
  postsPerWeekTarget: 2,
  contentPillars: [
    "Producto (fotos, video del proceso)",
    "Detrás de cámaras",
    "Testimonios de clientes",
    "Educativo (tips de salud/nutrición)",
    "Promociones",
  ],
  updatedAt: new Date(0).toISOString(),
};

export function getStrategy(): MarketingStrategy {
  return read<MarketingStrategy>(STRATEGY_KEY, DEFAULT_STRATEGY);
}

export function saveStrategy(strategy: MarketingStrategy): void {
  write(STRATEGY_KEY, strategy);
}

// --- Calendario de publicaciones ---

export function getPosts(): MarketingPost[] {
  return read<MarketingPost[]>(POSTS_KEY, []);
}

export function createPost(title: string, scheduledDate: string, notes?: string): MarketingPost {
  if (!title.trim()) {
    throw new Error("La publicación necesita un tema o título.");
  }
  const post: MarketingPost = {
    id: crypto.randomUUID(),
    title,
    scheduledDate,
    status: "planned",
    notes,
    createdAt: new Date().toISOString(),
  };
  write(POSTS_KEY, [...getPosts(), post]);
  return post;
}

export function setPostStatus(postId: string, status: MarketingPostStatus): void {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    throw new Error(`Publicación no encontrada: ${postId}`);
  }
  post.status = status;
  write(POSTS_KEY, posts);
}

// --- Asistente: sugerencias y recordatorios ---

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export function getSuggestions(): string[] {
  const posts = getPosts();
  const strategy = getStrategy();
  const today = todayISO();
  const suggestions: string[] = [];

  const dueToday = posts.filter((p) => p.status === "planned" && p.scheduledDate === today);
  dueToday.forEach((p) => suggestions.push(`📌 Hoy toca publicar: ${p.title}`));

  const overdue = posts.filter((p) => p.status === "planned" && p.scheduledDate < today);
  overdue.forEach((p) =>
    suggestions.push(`⚠️ Quedó pendiente de publicar: ${p.title} (programado para ${p.scheduledDate})`)
  );

  const publishedPosts = posts.filter((p) => p.status === "published");
  if (publishedPosts.length === 0) {
    suggestions.push("🚀 Todavía no has marcado ninguna publicación como hecha — empieza con la primera de tu semana.");
  } else {
    const lastPublished = publishedPosts.reduce((latest, p) =>
      p.scheduledDate > latest.scheduledDate ? p : latest
    );
    const daysSince = daysBetween(lastPublished.scheduledDate, today);
    if (daysSince > 7) {
      suggestions.push(`🕐 Llevas ${daysSince} días sin publicar. Tus clientes podrían olvidarte.`);
    }
  }

  // Cuenta TODO lo programado en la semana calendario actual (lunes-domingo),
  // sea planificado o ya publicado — el bug original solo miraba "planned"
  // (desaparecía al marcar como publicada) y luego solo miraba adelante desde
  // hoy (no contaba lo ya publicado ANTES de hoy en la misma semana).
  const weekRange = getCurrentWeekRange(today);
  const scheduledThisWeek = posts.filter(
    (p) => p.scheduledDate >= weekRange.start && p.scheduledDate <= weekRange.end
  );
  if (scheduledThisWeek.length < strategy.postsPerWeekTarget) {
    const missing = strategy.postsPerWeekTarget - scheduledThisWeek.length;
    suggestions.push(
      `📋 Llevas ${scheduledThisWeek.length} publicación(es) esta semana; tu meta es ${strategy.postsPerWeekTarget}. Planifica ${missing} más.`
    );
  }

  return suggestions;
}

/** Semana calendario lunes-domingo que contiene `dateISO`. */
function getCurrentWeekRange(dateISO: string): { start: string; end: string } {
  const date = new Date(dateISO + "T00:00:00");
  const dayOfWeek = date.getDay(); // 0 = domingo, 1 = lunes, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}