import { useState } from "react";
import * as marketingService from "../services/marketingService";
import { FormInput } from "../components/FormInput";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";

/**
 * Página: Marketing (Flujo 7)
 * Ruta: /marketing
 *
 * A propósito simple: estrategia (meta semanal + pilares), calendario
 * plano de publicaciones, y un asistente de sugerencias — no un CRM.
 */
export default function MarketingPage() {
  const [, forceRefresh] = useState(0);
  const strategy = marketingService.getStrategy();
  const posts = marketingService
    .getPosts()
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const suggestions = marketingService.getSuggestions();

  const [postsPerWeekTarget, setPostsPerWeekTarget] = useState(strategy.postsPerWeekTarget);
  const [newPillar, setNewPillar] = useState("");
  const [pillars, setPillars] = useState(strategy.contentPillars);

  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  function refresh() {
    forceRefresh((n) => n + 1);
  }

  function handleSaveStrategy() {
    marketingService.saveStrategy({
      postsPerWeekTarget,
      contentPillars: pillars,
      updatedAt: new Date().toISOString(),
    });
    refresh();
  }

  function handleAddPillar() {
    if (!newPillar.trim()) return;
    setPillars([...pillars, newPillar]);
    setNewPillar("");
  }

  function handleRemovePillar(pillar: string) {
    setPillars(pillars.filter((p) => p !== pillar));
  }

  function handleCreatePost() {
    if (!title.trim()) return;
    marketingService.createPost(title, scheduledDate, notes || undefined);
    setTitle("");
    setNotes("");
    refresh();
  }

  function handleMarkPublished(postId: string) {
    marketingService.setPostStatus(postId, "published");
    refresh();
  }

  const sectionStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      <h1 style={{ color: colors.text }}>Marketing</h1>
      <p style={{ color: colors.textMuted }}>
        Publica con constancia y de forma profesional — sin necesitar un experto en redes.
      </p>

      {suggestions.length > 0 && (
        <section style={{ ...sectionStyle, borderColor: colors.primary }}>
          <h2 style={{ color: colors.text, marginTop: 0 }}>🤖 Tu asistente de marketing</h2>
          <ul style={{ paddingLeft: "0", listStyle: "none" }}>
            {suggestions.map((s, idx) => (
              <li
                key={idx}
                style={{
                  color: colors.text,
                  background: colors.card,
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={sectionStyle}>
        <h2 style={{ color: colors.text, marginTop: 0 }}>Estrategia de publicación</h2>
        <FormInput
          label="Meta de publicaciones por semana"
          type="number"
          value={postsPerWeekTarget}
          onChange={(e) => setPostsPerWeekTarget(Number(e.target.value))}
          min={0}
        />

        <p style={{ color: colors.textMuted, fontSize: "13px", marginBottom: "8px" }}>
          Pilares de contenido (de qué vas a hablar, para no depender de la inspiración del momento):
        </p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pillars.map((p) => (
            <li
              key={p}
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: colors.text,
                background: colors.card,
                borderRadius: "8px",
                padding: "6px 12px",
                marginBottom: "6px",
                fontSize: "13px",
              }}
            >
              {p}
              <button
                type="button"
                onClick={() => handleRemovePillar(p)}
                style={{ background: "transparent", border: "none", color: colors.danger, cursor: "pointer" }}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <FormInput
              label="Nuevo pilar"
              placeholder="ej. Recetas con nuestros productos"
              value={newPillar}
              onChange={(e) => setNewPillar(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <FormButton type="button" variant="secondary" onClick={handleAddPillar}>
              Agregar
            </FormButton>
          </div>
        </div>

        <FormButton type="button" onClick={handleSaveStrategy}>
          Guardar estrategia
        </FormButton>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ color: colors.text, marginTop: 0 }}>Calendario de publicaciones</h2>

        <FormInput label="Tema o título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <FormInput
          label="Fecha"
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />
        <FormInput
          label="Notas (opcional)"
          placeholder="ej. Usar foto del lote de esta semana"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <FormButton type="button" variant="secondary" onClick={handleCreatePost}>
          Planificar publicación
        </FormButton>

        <div style={{ marginTop: "20px" }}>
          {posts.length === 0 && (
            <p style={{ color: colors.textMuted }}>Todavía no hay publicaciones planificadas.</p>
          )}
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: colors.card,
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "8px",
              }}
            >
              <div>
                <div style={{ color: colors.text, fontWeight: 600 }}>{post.title}</div>
                <div style={{ color: colors.textMuted, fontSize: "12px" }}>
                  {post.scheduledDate} {post.notes ? `— ${post.notes}` : ""}
                </div>
              </div>
              {post.status === "published" ? (
                <span style={{ color: colors.primary, fontSize: "12px" }}>✅ Publicada</span>
              ) : (
                <FormButton type="button" onClick={() => handleMarkPublished(post.id)}>
                  Marcar publicada
                </FormButton>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}