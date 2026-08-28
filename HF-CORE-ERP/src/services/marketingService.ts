/**
 * Servicio: Marketing (Flujo 7 — Campañas → Publicaciones → Seguimiento)
 *
 * BP-043: migrado de localStorage a Firestore.
 * Colecciones:
 *   businesses/{businessId}/marketingStrategy   (documento único)
 *   businesses/{businessId}/marketingPosts/{postId}
 *
 * A propósito NO es un CRM ni un calendario complejo — es un asistente
 * simple: meta de publicaciones por semana, pilares de contenido, calendario
 * plano y sugerencias calculadas. Mismo espíritu del EIF aplicado a Marketing.
 *
 * Regla ADR-009: todos los campos opcionales se leen con ?? para no romper
 * documentos creados antes de que el campo existiera.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { MarketingStrategy } from "../models/MarketingStrategy";
import type { MarketingPost, MarketingPostStatus } from "../models/MarketingPost";

// --- Referencias a Firestore ---

function strategyRef() {
  return doc(db, "businesses", CURRENT_BUSINESS_ID, "marketingStrategy", "config");
}

function postsCol() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "marketingPosts");
}

function postRef(postId: string) {
  return doc(db, "businesses", CURRENT_BUSINESS_ID, "marketingPosts", postId);
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

export async function getStrategy(): Promise<MarketingStrategy> {
  const snap = await getDoc(strategyRef());
  if (!snap.exists()) return DEFAULT_STRATEGY;
  const data = snap.data();
  return {
    postsPerWeekTarget: Number.isFinite(data?.postsPerWeekTarget)
      ? (data.postsPerWeekTarget as number)
      : DEFAULT_STRATEGY.postsPerWeekTarget,
    contentPillars: Array.isArray(data?.contentPillars)
      ? (data.contentPillars as string[])
      : DEFAULT_STRATEGY.contentPillars,
    updatedAt: (data?.updatedAt as string) ?? DEFAULT_STRATEGY.updatedAt,
  };
}

export async function saveStrategy(strategy: MarketingStrategy): Promise<void> {
  await setDoc(strategyRef(), strategy, { merge: true });
}

// --- Calendario de publicaciones ---

export async function getPosts(): Promise<MarketingPost[]> {
  const snap = await getDocs(postsCol());
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: (data.title as string) ?? "",
      scheduledDate: (data.scheduledDate as string) ?? "",
      status: (data.status as MarketingPostStatus) ?? "planned",
      notes: (data.notes as string | undefined) ?? undefined,
      createdAt: (data.createdAt as string) ?? new Date().toISOString(),
    };
  });
}

export async function createPost(
  title: string,
  scheduledDate: string,
  notes?: string
): Promise<MarketingPost> {
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
  await setDoc(postRef(post.id), post);
  return post;
}

export async function setPostStatus(
  postId: string,
  status: MarketingPostStatus
): Promise<void> {
  const ref = postRef(postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error(`Publicación no encontrada: ${postId}`);
  }
  await updateDoc(ref, { status });
}

// --- Asistente: sugerencias y recordatorios ---

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / msPerDay
  );
}

function getCurrentWeekRange(dateISO: string): { start: string; end: string } {
  const date = new Date(dateISO + "T00:00:00");
  const dayOfWeek = date.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export async function getSuggestions(): Promise<string[]> {
  const [posts, strategy] = await Promise.all([getPosts(), getStrategy()]);
  const today = todayISO();
  const suggestions: string[] = [];

  const dueToday = posts.filter(
    (p) => p.status === "planned" && p.scheduledDate === today
  );
  dueToday.forEach((p) =>
    suggestions.push(`📌 Hoy toca publicar: ${p.title}`)
  );

  const overdue = posts.filter(
    (p) => p.status === "planned" && p.scheduledDate < today
  );
  overdue.forEach((p) =>
    suggestions.push(
      `⚠️ Quedó pendiente de publicar: ${p.title} (programado para ${p.scheduledDate})`
    )
  );

  const publishedPosts = posts.filter((p) => p.status === "published");
  if (publishedPosts.length === 0) {
    suggestions.push(
      "🚀 Todavía no has marcado ninguna publicación como hecha — empieza con la primera de tu semana."
    );
  } else {
    const lastPublished = publishedPosts.reduce((latest, p) =>
      p.scheduledDate > latest.scheduledDate ? p : latest
    );
    const daysSince = daysBetween(lastPublished.scheduledDate, today);
    if (daysSince > 7) {
      suggestions.push(
        `🕐 Llevas ${daysSince} días sin publicar. Tus clientes podrían olvidarte.`
      );
    }
  }

  const weekRange = getCurrentWeekRange(today);
  const scheduledThisWeek = posts.filter(
    (p) =>
      p.scheduledDate >= weekRange.start && p.scheduledDate <= weekRange.end
  );
  if (scheduledThisWeek.length < strategy.postsPerWeekTarget) {
    const missing = strategy.postsPerWeekTarget - scheduledThisWeek.length;
    suggestions.push(
      `📋 Llevas ${scheduledThisWeek.length} publicación(es) esta semana; tu meta es ${strategy.postsPerWeekTarget}. Planifica ${missing} más.`
    );
  }

  return suggestions;
}