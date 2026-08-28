import StatCard from "../components/dashboard/StatCard";
import Card from "../components/ui/Card";
import { products } from "../data/products";
import { productPresentations } from "../data/productPresentations";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export default function ProductsPage() {
  return (
    <>
      <h1
        style={{
          color: colors.primary,
          fontSize: typography.title,
          marginBottom: "32px",
        }}
      >
        Catálogo Maestro de Productos
      </h1>

      <div
    style={{
        display: "flex",
        gap: "20px",
        marginBottom: "30px",
    }}
>
    <StatCard
        title="Productos"
        value={products.length}
    />

    <StatCard
        title="Presentaciones"
        value={productPresentations.length}
    />

    <StatCard
        title="Activos"
        value={products.filter((p) => p.active).length}
    />
</div>

      {products.map((product) => {
        const presentations = productPresentations.filter(
          (p) => p.productId === product.id
        );

        return (
          <div key={product.id} style={{ marginBottom: "24px" }}>
            <Card>
              <h2>{product.name}</h2>

              <p>{product.description}</p>

              <p>
                <strong>Categoría:</strong> {product.category}
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                {product.active ? "🟢 Activo" : "🔴 Inactivo"}
              </p>

              <hr
                style={{
                  margin: "20px 0",
                  borderColor: colors.border,
                }}
              />

              <h3 style={{ color: colors.secondary }}>
                Presentaciones
              </h3>

              {presentations.map((presentation) => (
                <div
                  key={presentation.id}
                  style={{
                    padding: "10px",
                    marginTop: "10px",
                    background: colors.card,
                    borderRadius: "8px",
                  }}
                >
                  <strong>{presentation.code}</strong>

                  <br />

                  {presentation.name}

                  <br />

                  {presentation.quantity} {presentation.salesUnit}
                </div>
              ))}
            </Card>
          </div>
        );
      })}
    </>
  );
}