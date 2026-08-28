import Card from "../components/ui/Card";
import { recipes } from "../data/recipes";
import { products } from "../data/products";
import { rawMaterials } from "../data/rawMaterials";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { ProductionSimulator } from "../components/ProductionSimulator";

export default function RecipesPage() {
  // Solo se listan recetas atadas a un producto vendible (tienen productId).
  const sellableRecipes = recipes.filter((r) => !!r.productId);

  return (
    <>
      <h1 style={{ color: colors.primary, fontSize: typography.title, marginBottom: "24px" }}>
        Recetas de Producción
      </h1>

      {sellableRecipes.map((recipe) => {
        const product = products.find((p) => p.id === recipe.productId);

        return (
          <Card key={recipe.id}>
            <h2>
              {product?.name ?? "Producto"}
              {product?.code && (
                <span style={{ color: colors.textMuted, fontSize: "14px" }}> ({product.code})</span>
              )}
            </h2>

            <p>Código receta: {recipe.code}</p>
            <p>Produce: {recipe.yieldQuantity} {recipe.yieldUnit}</p>

            <hr />
            <h3>Ingredientes</h3>

            {recipe.items.map((item, index) => {
              const key = item.rawMaterialId ?? item.componentRecipeId ?? String(index);

              let label: string | undefined;
              if (item.rawMaterialId) {
                label = rawMaterials.find((m) => m.id === item.rawMaterialId)?.name;
              } else if (item.componentRecipeId) {
                const componentRecipe = recipes.find((r) => r.id === item.componentRecipeId);
                label = componentRecipe?.name ?? componentRecipe?.code;
              }

              return (
                <p key={key} style={{ margin: "6px 0" }}>
                  • {label} — {item.quantity} {item.unit}
                </p>
              );
            })}

            <hr />

            <ProductionSimulator
              productId={recipe.productId!}
              productName={product?.name ?? "Producto"}
              recipes={recipes}
              rawMaterials={rawMaterials}
            />
          </Card>
        );
      })}
    </>
  );
}
