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
const ProductsPage = lazy(() => import("../pages/ProductsPage"));
const CustomersPage = lazy(() => import("../pages/CustomersPage"));
const ProductionPage = lazy(() => import("../pages/ProductionPage"));
const ConfigPage = lazy(() => import("../pages/ConfigPage"));
const PurchasesPage = lazy(() => import("../pages/PurchasesPage"));
const SalesPage = lazy(() => import("../pages/SalesPage"));
const FinancePage = lazy(() => import("../pages/FinancePage"));
const MarketingPage = lazy(() => import("../pages/MarketingPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const InvoicesPage = lazy(() => import("../pages/InvoicesPage"));
const PaymentsPage = lazy(() => import("../pages/PaymentsPage"));
const OrdersPage = lazy(() => import("../pages/OrdersPage"));
const DashboardsPage = lazy(() => import("../pages/DashboardsPage"));
const RecipeConfigPage = lazy(() => import("../pages/RecipeConfigPage"));
const WasteLogPage = lazy(() => import("../pages/WasteLogPage"));
const AdjustmentLogPage = lazy(() => import("../pages/AdjustmentLogPage"));

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
  const { user, loading } = useAuth();
  if (loading) return <p style={{ color: "#94A3B8", padding: "24px" }}>Cargando...</p>;
  if (!user) return <LoginPage />;
  return (
    <ConfigProvider>
      <ProductionAlertsProvider>
        <MainLayout>
          <Suspense fallback={<p style={{ color: "#94A3B8", padding: "24px" }}>Cargando página...</p>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/decisions" element={<DecisionCenterPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/dashboards" element={<DashboardsPage />} />
              <Route path="/settings/recipes" element={<RecipeConfigPage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/marketing" element={<MarketingPage />} />
              <Route path="/settings" element={<ConfigPage />} />
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