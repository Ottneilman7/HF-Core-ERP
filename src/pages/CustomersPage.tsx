import Card from "../components/ui/Card";
import StatCard from "../components/dashboard/StatCard";

import * as customerBalanceService from "../services/customerBalanceService";

import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

/**
 * Fix (encontrado antes de BP-026): esta página leía `data/customers.ts`
 * directo — nunca reflejaba ventas a crédito ni pagos registrados desde
 * BP-019/BP-020. Se migra a customerBalanceService.getEffectiveCustomers()
 * (sigue en localStorage por ahora; Clientes/Ventas se migra a Firestore
 * más adelante, después de Recetas/Semielaborados).
 */
export default function CustomersPage() {
  const customers = customerBalanceService.getEffectiveCustomers();

  const activeCustomers = customers.filter((c) => c.active).length;
  const priorityCustomers = customers.filter(
    (customer) => customer.priority === "HIGH"
  ).length;

  const totalBalance = customers.reduce(
    (sum, customer) => sum + customer.balance,
    0
  );

  return (
    <>
      <h1
        style={{
          color: colors.primary,
          fontSize: typography.title,
          marginBottom: "24px",
        }}
      >
        Catálogo Maestro de Clientes
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >

        <StatCard
          title="Clientes"
          value={customers.length}
        />

        <StatCard
          title="Activos"
          value={activeCustomers}
        />

        <StatCard
          title="Prioritarios"
          value={priorityCustomers}
        />

        <StatCard
          title="Saldo total por cobrar"
          value={`$${totalBalance.toFixed(2)}`}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: "20px",
        }}
      >
        {customers.map((customer) => (
          <Card key={customer.id}>
            <h2>{customer.businessName}</h2>

            <p>
              <strong>Código:</strong> {customer.code}
            </p>

            <p>
              <strong>Contacto:</strong> {customer.contactName}
            </p>

            <p>
              <strong>Ciudad:</strong> {customer.city}
            </p>

            <p>
              <strong>Tipo:</strong> {customer.customerType}
            </p>

            <p>
              <strong>Saldo:</strong> ${customer.balance.toFixed(2)}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}