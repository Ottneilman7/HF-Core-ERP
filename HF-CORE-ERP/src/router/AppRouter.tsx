import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLayout from "../layouts/MainLayout";
import { ProductionAlertsProvider } from "../contexts/ProductionAlertsContext";
import { ConfigProvider } from "../contexts/ConfigContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

// Code-split all pages to keep chunks < 300 KB (Fase 1.3)
const HomePage = lazy(() => import("../pages/HomePage"));
const DecisionCenterPage = lazy(() => import("../pages/DecisionCenterPage"));
const InventoryPage = lazy(() => import("../pages/InventoryPage"));
const CustomersPage = lazy(() => import("../pages/CustomersPage"));
const ProductionPage = lazy(() => import("../pages/ProductionPage"));
const ConfigPage = lazy(() => import("../pages/ConfigPage"));
const PurchasesPage = lazy(() => import("../pages/PurchasesPage"));
const SupplierPaymentsPage = lazy(() => import("../pages/SupplierPaymentsPage"));
const SalesPage = lazy(() => import("../pages/SalesPage"));
const FinancePage = lazy(() => import("../pages/FinancePage"));
const MarketingPage = lazy(() => import("../pages/MarketingPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const InvoicesPage = lazy(() => import("../pages/InvoicesPage"));
const PaymentsPage = lazy(() => import("../pages/PaymentsPage"));
const OrdersPage = lazy(() => import("../pages/OrdersPage"));
const DashboardsPage = lazy(() => import("../pages/DashboardsPage"));
const RecipeConfigPage = lazy(() => import("../pages/RecipeConfigPage"));
const PricingSimulatorPage = lazy(() => import("../pages/PricingSimulatorPage"));
const WasteLogPage = lazy(() => import("../pages/WasteLogPage"));
const AdjustmentLogPage = lazy(() => import("../pages/AdjustmentLogPage"));
const TeamPage = lazy(() => import("../pages/TeamPage"));
const BackupPage = lazy(() => import("../pages/BackupPage"));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AuthGate() {
  const { user, loading, role, roleLoading } = useAuth();
  if (loading) return <p style={{ color: "#94A3B8", padding: "24px" }}>Cargando...</p>;
  if (!user) return <LoginPage />;
  if (roleLoading) return <p style={{ color: "#94A3B8", padding: "24px" }}>Cargando...</p>;

  // BP-050: antes de aquí existía BootstrapMembershipPage — se retiró
  // porque ya cumplió su propósito (dar de alta al primer owner). Dejarla
  // activa habría permitido que cualquier usuario autenticado sin membresía
  // se auto-asignara "owner". Ahora, cualquier alta nueva pasa por /team,
  // que solo un owner/manager ya existente puede usar.
  if (!role) {
    return (
      <div style={{ padding: "48px", maxWidth: "480px", margin: "0 auto", color: "#F8FAFC", textAlign: "center" }}>
        <h1 style={{ color: "#22C55E" }}>Sin acceso</h1>
        <p style={{ color: "#94A3B8" }}>
          Tu usuario ({user.email}) no tiene un rol asignado en este negocio todavía. Pide al Dueño o Gerente que te
          agregue desde la sección "Equipo".
        </p>
      </div>
    );
  }

  return (
    <ConfigProvider>
      <ProductionAlertsProvider>
        <MainLayout>
          <Suspense fallback={<p style={{ color: "#94A3B8", padding: "24px" }}>Cargando página...</p>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/decisions" element={<DecisionCenterPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/dashboards" element={<DashboardsPage />} />
              <Route path="/settings/recipes" element={<RecipeConfigPage />} />
              <Route path="/settings/pricing" element={<PricingSimulatorPage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/purchases/payments" element={<SupplierPaymentsPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/marketing" element={<MarketingPage />} />
              <Route path="/settings" element={<ConfigPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/backup" element={<BackupPage />} />
              {/* BP-046: historial de merma */}
              <Route path="/waste" element={<WasteLogPage />} />
              <Route path="/adjustments" element={<AdjustmentLogPage />} />
            </Routes>
          </Suspense>
        </MainLayout>
      </ProductionAlertsProvider>
    </ConfigProvider>
  );
}