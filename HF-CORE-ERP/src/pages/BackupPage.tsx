// BackupPage.tsx — NUEVO. Ruta: /backup. Solo owner/manager.
// Sin backend propio (ADR-008): el respaldo es un export manual a JSON
// desde el propio cliente, usando los mismos permisos de lectura que ya
// tiene el usuario. No sustituye un backup automático de pago (Cloud
// Scheduler + Cloud Function), pero cuesta $0 y es mejor que nada — se deja
// documentado como mejora futura si el negocio crece.
import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import { FormButton } from "../components/FormButton";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

// Todas las colecciones reales del negocio (ver auditoría — lista
// confirmada contra el código, no adivinada).
const COLLECTIONS = [
  "customers", "finishedGoods", "inventoryAdjustments", "invoices",
  "marketingPosts", "marketingStrategy", "payments", "purchaseOrders",
  "rawMaterials", "recipes", "sales", "supplierPayments", "suppliers",
  "wasteLog", "products", "members",
];

export default function BackupPage() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);

  async function handleExport() {
    setRunning(true);
    setError(null);
    try {
      const result: Record<string, unknown[]> = {};
      for (const name of COLLECTIONS) {
        setProgress(`Leyendo ${name}...`);
        const snap = await getDocs(collection(db, "businesses", CURRENT_BUSINESS_ID, name));
        result[name] = snap.docs.map((d) => d.data());
      }
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `hf-core-erp-respaldo-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setLastExportAt(new Date().toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo exportar.");
    } finally {
      setRunning(false);
      setProgress("");
    }
  }

  return (
    <>
      <h1 style={{ color: colors.primary, fontSize: typography.title, marginBottom: "8px" }}>Respaldo de Datos</h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px", maxWidth: "560px" }}>
        Descarga una copia completa de todos tus datos (clientes, ventas, inventario, recetas, compras, etc.) en un
        solo archivo. Guárdalo en Google Drive o donde respaldes tus archivos importantes. Recomendado: una vez por
        semana, o antes de hacer cambios grandes.
      </p>
      <FormButton type="button" onClick={handleExport} disabled={running}>
        {running ? progress || "Exportando..." : "Descargar respaldo ahora"}
      </FormButton>
      {error && <p style={{ color: colors.danger, marginTop: "12px" }}>⚠️ {error}</p>}
      {lastExportAt && !running && <p style={{ color: colors.primary, marginTop: "12px" }}>✅ Último respaldo: {lastExportAt}</p>}
    </>
  );
}