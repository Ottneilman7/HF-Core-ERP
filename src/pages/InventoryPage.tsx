import Card from "../components/ui/Card";
import { rawMaterials } from "../data/rawMaterials";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export default function InventoryPage() {
  return (
    <>
      <h1
        style={{
          color: colors.primary,
          fontSize: typography.title,
          marginBottom: "24px",
        }}
      >
        Catálogo Maestro de Materias Primas
      </h1>

      {rawMaterials.map((material) => (
        <Card key={material.id}>
          <h2>{material.name}</h2>

          <p>Código: {material.code}</p>

          <p>Categoría: {material.category}</p>

          <p>Unidad: {material.unit}</p>

          <p>Stock: {material.currentStock}</p>

          <p>Stock mínimo: {material.minimumStock}</p>
        </Card>
      ))}
    </>
  );
}