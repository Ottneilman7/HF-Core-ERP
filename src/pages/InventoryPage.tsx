import { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import * as rawMaterialInventoryService from "../services/rawMaterialInventoryService";
import * as recipeStockService from "../services/recipeStockService";
import * as finishedGoodsInventoryService from "../services/finishedGoodsInventoryService";
import { products } from "../data/products";
import type { RawMaterial } from "../models/RawMaterial";
import type { Recipe } from "../models/Recipe";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

/**
 * Fix (feedback CEO, 25/07/2026): esta página solo mostraba materia
 * prima — causaba confusión real (la materia prima deprecada
 * "Mantequilla de Maní" y el semielaborado real "Peanut Butter" tienen
 * casi el mismo nombre, en colecciones distintas). Ahora consolida los
 * TRES tipos de inventario del negocio en un solo lugar, y oculta
 * materia prima inactiva/deprecada (mismo filtro que ya tenía Compras).
 */
export default function InventoryPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [semiFinished, setSemiFinished] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const finishedGoodsStock = finishedGoodsInventoryService.getAllStock();

  useEffect(() => {
    Promise.all([
      rawMaterialInventoryService.getEffectiveRawMaterials(),
      recipeStockService.getEffectiveRecipes(),
    ]).then(([materials, recipes]) => {
      setRawMaterials(materials.filter((m) => m.active));
      setSemiFinished(recipes.filter((r) => r.active && r.tracksInventory));
      setLoading(false);
    });
  }, []);

  const sectionTitleStyle = {
    color: colors.secondary,
    fontSize: typography.subtitle,
    margin: "32px 0 16px",
  };

  return (
    <>
      <h1 style={{ color: colors.primary, fontSize: typography.title, marginBottom: "8px" }}>
        Inventario
      </h1>
      <p style={{ color: colors.textMuted, marginBottom: "24px" }}>
        Todo lo que el negocio tiene disponible ahora mismo: materia prima, semielaborados y producto
        terminado.
      </p>

      {loading && <p style={{ color: colors.textMuted }}>Cargando inventario...</p>}

      {!loading && (
        <>
          <h2 style={sectionTitleStyle}>Materia Prima</h2>
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

          <h2 style={sectionTitleStyle}>Semielaborados</h2>
          <p style={{ color: colors.textMuted, fontSize: "13px", marginTop: "-8px", marginBottom: "16px" }}>
            Se producen en /production, o se compran ya hechos en /purchases (caso de emergencia).
          </p>
          {semiFinished.map((recipe) => (
            <Card key={recipe.id}>
              <h2>{recipe.name ?? recipe.code}</h2>
              <p>Unidad: {recipe.unit}</p>
              <p>Stock: {recipe.currentStock ?? 0}</p>
              <p>Stock mínimo: {recipe.minimumStock ?? 0}</p>
            </Card>
          ))}

          <h2 style={sectionTitleStyle}>Producto Terminado</h2>
          <p style={{ color: colors.textMuted, fontSize: "13px", marginTop: "-8px", marginBottom: "16px" }}>
            Se actualiza automáticamente al confirmar una producción en /production.
          </p>
          {products.map((product) => (
            <Card key={product.id}>
              <h2>{product.name}</h2>
              <p>Stock: {finishedGoodsStock[product.id] ?? 0} unidades</p>
            </Card>
          ))}
        </>
      )}
    </>
  );
}