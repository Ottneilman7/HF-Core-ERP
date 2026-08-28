import { useState, type FormEvent } from "react";
import { login } from "../services/authService";
import { FormInput } from "../components/FormInput";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // No hace falta redirigir manualmente: AuthProvider detecta la sesión
      // y AppRouter decide qué mostrar.
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.background,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          padding: "32px",
          width: "320px",
        }}
      >
        <h1 style={{ color: colors.primary, marginTop: 0 }}>HF CORE ERP</h1>
        <FormInput label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <FormInput
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: colors.danger, fontSize: "13px" }}>{error}</p>}
        <FormButton type="submit" style={{ width: "100%" }}>
          {loading ? "Entrando..." : "Entrar"}
        </FormButton>
      </form>
    </div>
  );
}