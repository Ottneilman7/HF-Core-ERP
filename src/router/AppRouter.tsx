import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import HomePage from "../pages/HomePage";
import DecisionCenterPage from "../pages/DecisionCenterPage";
import InventoryPage from "../pages/InventoryPage";
import ProductsPage from "../pages/ProductsPage";
import CustomersPage from "../pages/CustomersPage";
import ProductionPage from "../pages/ProductionPage";
import ConfigPage from "../pages/ConfigPage";
import PurchasesPage from "../pages/PurchasesPage";
import SalesPage from "../pages/SalesPage";
import FinancePage from "../pages/FinancePage";
import MarketingPage from "../pages/MarketingPage";
import LoginPage from "../pages/LoginPage";
import InvoicesPage from "../pages/InvoicesPage";
import PaymentsPage from "../pages/PaymentsPage";
import OrdersPage from "../pages/OrdersPage";
import DashboardsPage from "../pages/DashboardsPage";
import RecipeConfigPage from "../pages/RecipeConfigPage";

import { ProductionAlertsProvider } from "../contexts/ProductionAlertsContext";
import { ConfigProvider } from "../contexts/ConfigContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

// BP-041: se elimina el import de ComingSoonPage que ya no se usaba
// en ninguna ruta — causaba TS6133 (declared but never read).

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * BP-023: puerta de autenticación. Mientras Firebase resuelve la sesión
 * (`loading`), no mostramos nada definitivo para evitar un parpadeo hacia
 * el login. Sin sesión → LoginPage. Con sesión → la app completa.
 */
function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p style={{ color: "#94A3B8", padding: "24px" }}>Cargando...</p>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <ConfigProvider>
      <ProductionAlertsProvider>
        <MainLayout>
          <Routes>
            {/* BP-013: "/" es la landing, no el Centro de Decisiones */}
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
            {/* BP-016: Configuración real (Empresa, Parámetros, Impuestos) */}
            <Route path="/settings" element={<ConfigPage />} />

            {/* /recipes deliberadamente NO se registra (BP-013) */}
          </Routes>
        </MainLayout>
      </ProductionAlertsProvider>
    </ConfigProvider>
  );
}