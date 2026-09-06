import { useEffect, useState } from "react";
import * as membershipService from "../services/membershipService";
import { createTeamMemberAccount } from "../lib/secondaryAuth";
import { sendPasswordReset } from "../services/authService";
import type { Membership, MembershipRole, ModuleKey } from "../models/Membership";
import { ROLE_LABELS, ALL_MODULES, MODULE_LABELS } from "../models/Membership";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { FormButton } from "../components/FormButton";
import Card from "../components/ui/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const EMPTY_FORM = {
  uid: "", email: "", password: "", displayName: "",
  role: "sales" as MembershipRole,
  modules: membershipService.defaultModulesFor("sales"),
  canCreateProducts: false,
};

export default function TeamPage() {
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<{ uid: string; text: string } | null>(null);

  const isEditing = !!form.uid;

  async function load() {
    setLoading(true);
    try {
      setMembers(await membershipService.listMembers());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function handleRoleChange(role: MembershipRole) {
    setForm({ ...form, role, modules: membershipService.defaultModulesFor(role) });
  }

  function toggleModule(m: ModuleKey) {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(m) ? f.modules.filter((x) => x !== m) : [...f.modules, m],
    }));
  }

  function startEdit(member: Membership) {
    setForm({ uid: member.uid, email: member.email, password: "", displayName: member.displayName ?? "", role: member.role, modules: member.modules ?? membershipService.defaultModulesFor(member.role), canCreateProducts: member.canCreateProducts ?? false });
    setSuccess(null);
  }
  function cancelEdit() {
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.email.trim()) { setError("Falta el correo."); return; }
    if (!isEditing && form.password.length < 6) { setError("La contraseña temporal debe tener al menos 6 caracteres."); return; }

    setSaving(true);
    try {
      let uid = form.uid;
      if (!isEditing) {
        uid = await createTeamMemberAccount(form.email.trim(), form.password);
      }
      await membershipService.upsertMembership(uid, form.email.trim(), form.role, form.modules, form.canCreateProducts, form.displayName.trim() || undefined);
      setSuccess(
        isEditing
          ? "Actualizado."
          : `Cuenta creada. Comparte con ${form.email}: correo + la contraseña temporal que escribiste — puede cambiarla después.`
      );
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        setError("Ese correo ya tiene una cuenta. Si es alguien que ya existe, edítalo desde la lista de abajo en vez de crear uno nuevo.");
      } else {
        setError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(member: Membership) {
    setRowMessage(null);
    try {
      await sendPasswordReset(member.email);
      setRowMessage({ uid: member.uid, text: `Correo de restablecimiento enviado a ${member.email}.` });
    } catch (err) {
      setRowMessage({ uid: member.uid, text: err instanceof Error ? err.message : "No se pudo enviar el correo." });
    }
  }

  async function handleDelete(member: Membership) {
    const label = member.displayName || member.email;
    if (!window.confirm(`¿Quitar el acceso de ${label} a este negocio? Podrás volver a agregarlo(a) después si hace falta.`)) return;
    setRowMessage(null);
    try {
      await membershipService.deleteMembership(member.uid);
      await load();
    } catch (err) {
      setRowMessage({ uid: member.uid, text: err instanceof Error ? err.message : "No se pudo eliminar." });
    }
  }

  const isElevatedForm = form.role === "owner" || form.role === "manager";

  return (
    <>
      <h1 style={{ color: colors.primary, fontSize: typography.title, marginBottom: "8px" }}>Equipo</h1>
      <p style={{ color: colors.textMuted, marginBottom: "32px" }}>
        Dueño y Gerente siempre tienen acceso completo. Para Ventas y Producción, elige exactamente qué módulos puede
        ver y usar cada persona.
      </p>

      <div style={{ maxWidth: "480px", marginBottom: "32px" }}>
        <Card>
          <h3 style={{ color: colors.secondary, marginBottom: "16px", alignSelf: "flex-start" }}>
            {isEditing ? `Editando: ${form.email}` : "Agregar miembro nuevo"}
          </h3>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <FormInput label="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={isEditing} />
            {!isEditing && (
              <FormInput label="Contraseña temporal (mín. 6 caracteres)" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="La compartes tú por el medio que prefieras" required />
            )}
            <FormInput label="Nombre (opcional)" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            <FormSelect label="Rol" value={form.role} onChange={(e) => handleRoleChange(e.target.value as MembershipRole)}>
              <option value="sales">Ventas</option>
              <option value="production">Producción</option>
              <option value="manager">Gerente</option>
              <option value="owner">Dueño</option>
            </FormSelect>

            {!isElevatedForm && (
              <div style={{ margin: "12px 0" }}>
                <label style={{ color: colors.textMuted, fontSize: "13px", display: "block", marginBottom: "8px" }}>
                  Módulos habilitados
                </label>
                {ALL_MODULES.map((m) => (
                  <label key={m} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", color: colors.text, fontSize: "14px" }}>
                    <input type="checkbox" checked={form.modules.includes(m)} onChange={() => toggleModule(m)} />
                    {MODULE_LABELS[m]}
                  </label>
                ))}
              </div>
            )}
            {isElevatedForm && (
              <p style={{ color: colors.textMuted, fontSize: "12px" }}>Este rol tiene acceso a todos los módulos, no requiere selección.</p>
            )}

            {form.role === "production" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", margin: "12px 0", color: colors.text, fontSize: "13px" }}>
                <input type="checkbox" checked={form.canCreateProducts} onChange={(e) => setForm({ ...form, canCreateProducts: e.target.checked })} style={{ marginTop: "2px" }} />
                Autorizar a crear productos/recetas nuevas (BOM) — excepción puntual, normalmente esto es solo Dueño/Gerente.
              </label>
            )}

            {error && <p style={{ color: colors.danger, fontSize: "13px", margin: "8px 0" }}>{error}</p>}
            {success && <p style={{ color: colors.primary, fontSize: "13px", margin: "8px 0" }}>✅ {success}</p>}
            <div style={{ display: "flex", gap: "12px" }}>
              <FormButton type="submit" disabled={saving}>{saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear cuenta y agregar"}</FormButton>
              {isEditing && <FormButton type="button" variant="secondary" onClick={cancelEdit}>Cancelar</FormButton>}
            </div>
          </form>
        </Card>
      </div>

      {loading ? (
        <p style={{ color: colors.textMuted }}>Cargando...</p>
      ) : (
        members.map((m) => (
          <div key={m.uid} style={{ marginBottom: "16px" }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-start" }}>
                <div>
                  <strong style={{ color: colors.text }}>{m.displayName || m.email}</strong>
                  <div style={{ color: colors.textMuted, fontSize: "13px" }}>{m.email}</div>
                  {!(m.role === "owner" || m.role === "manager") && (
                    <div style={{ color: colors.textMuted, fontSize: "12px", marginTop: "4px" }}>
                      Módulos: {(m.modules ?? []).map((mod) => MODULE_LABELS[mod]).join(", ") || "ninguno"}
                    </div>
                  )}
                  {rowMessage?.uid === m.uid && (
                    <div style={{ color: colors.secondary, fontSize: "12px", marginTop: "6px" }}>{rowMessage.text}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={{ color: colors.secondary, fontWeight: 700 }}>{ROLE_LABELS[m.role]}</span>
                  <FormButton type="button" variant="secondary" onClick={() => startEdit(m)}>Editar</FormButton>
                  <FormButton type="button" variant="secondary" onClick={() => handleResetPassword(m)}>Restablecer contraseña</FormButton>
                  <FormButton type="button" variant="secondary" onClick={() => handleDelete(m)}>Eliminar</FormButton>
                </div>
              </div>
            </Card>
          </div>
        ))
      )}
    </>
  );
}