import { useState } from "react";
import { colors } from "../../theme/colors";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { logout, changeMyPassword } from "../../services/authService";
import { ROLE_LABELS } from "../../models/Membership";
import { menuItems, canAccess } from "../../router/menuConfig";

export default function Sidebar() {
  const { user, role, modules, canCreateProducts } = useAuth();
  const visibleItems = menuItems.filter((item) => !item.hideFromSidebar && canAccess(item, role, modules, canCreateProducts));

  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  async function handleChangePassword() {
    setPwMessage(null);
    if (newPw.length < 6) { setPwMessage("Mínimo 6 caracteres."); return; }
    setPwSaving(true);
    try {
      await changeMyPassword(currentPw, newPw);
      setPwMessage("✅ Contraseña actualizada.");
      setCurrentPw(""); setNewPw("");
    } catch (err) {
      setPwMessage(err instanceof Error ? err.message : "No se pudo cambiar.");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <aside
      style={{
        width: "240px",
        background: colors.surface,
        color: colors.text,
        padding: "24px",
        minHeight: "100vh",
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2 style={{ color: colors.primary, marginBottom: "32px" }}>HF CORE ERP</h2>

      <div style={{ flex: 1 }}>
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "block",
              marginBottom: "18px",
              color: colors.text,
              textDecoration: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "16px" }}>
        <div style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "4px" }}>{user?.email}</div>
        <div style={{ fontSize: "12px", color: colors.secondary, marginBottom: "12px" }}>
          {role ? ROLE_LABELS[role] : ""}
        </div>

        <button
          onClick={() => setChangingPw(!changingPw)}
          style={{ background: "none", border: "none", color: colors.secondary, fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "8px", display: "block" }}
        >
          {changingPw ? "Cancelar" : "Cambiar mi contraseña"}
        </button>

        {changingPw && (
          <div style={{ marginBottom: "12px" }}>
            <input
              type="password" placeholder="Contraseña actual" value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              style={{ width: "100%", marginBottom: "6px", padding: "6px", borderRadius: "6px", border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: "12px" }}
            />
            <input
              type="password" placeholder="Nueva contraseña" value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              style={{ width: "100%", marginBottom: "6px", padding: "6px", borderRadius: "6px", border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: "12px" }}
            />
            <button
              onClick={handleChangePassword} disabled={pwSaving}
              style={{ width: "100%", background: colors.primary, border: "none", color: "#fff", borderRadius: "6px", padding: "6px", fontSize: "12px", cursor: "pointer" }}
            >
              {pwSaving ? "Guardando..." : "Guardar"}
            </button>
            {pwMessage && <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "6px" }}>{pwMessage}</p>}
          </div>
        )}

        <button
          onClick={() => logout()}
          style={{ background: "none", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", width: "100%" }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}