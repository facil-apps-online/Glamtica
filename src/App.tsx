import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import Index from "@/pages/Index";
import Appointments from "@/pages/Appointments";
import Clients from "@/pages/Clients";
import Services from "@/pages/Services";
import Stylists from "@/pages/Stylists";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import { queryClient } from "@/lib/queryClient";
import Products from "@/pages/Products";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import CreateTenant from "@/pages/Superadmin/CreateTenant";
import TenantsList from "@/pages/Superadmin/TenantsList";
import EditTenant from "@/pages/Superadmin/EditTenant";
import TenantDetails from "@/pages/Superadmin/TenantDetails";
import CreateTenantAdmin from "@/pages/Superadmin/CreateTenantAdmin";
import SubscriptionPlans from "@/pages/Superadmin/SubscriptionPlans";
import CreateSubscriptionPlan from "@/pages/Superadmin/CreateSubscriptionPlan";
import EditSubscriptionPlan from "@/pages/Superadmin/EditSubscriptionPlan";
import PlanPricingManager from "@/pages/Superadmin/PlanPricingManager";
import GlobalSettings from "@/pages/Superadmin/GlobalSettings";
import { SuperadminLayout } from "@/pages/Superadmin/SuperadminLayout";
import SuperadminStats from "@/pages/Superadmin/SuperadminStats";
import SystemAlerts from "@/pages/Superadmin/SystemAlerts";
import ErrorReports from "@/pages/Superadmin/ErrorReports";
import PerformanceMetrics from "@/pages/Superadmin/PerformanceMetrics";
import IntegrationsPage from "@/pages/Superadmin/Integrations";
import IntegrationProviderForm from "@/pages/Superadmin/IntegrationProviderForm"; // <-- Nueva importación
import ProfileSettings from "@/pages/Superadmin/ProfileSettings";
import TenantSettings from "@/pages/TenantAdmin/TenantSettings";
import RegisterTenant from "@/pages/RegisterTenant";
import TranslationAdmin from "@/components/TranslationAdmin";
import AppInitializer from "@/components/AppInitializer";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthPage from "@/pages/Auth";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import SetupSuperadmin from "@/pages/SetupSuperadmin";
import ResetPasswordPage from "@/pages/ResetPassword";
import GoogleCallbackPage from "@/pages/integrations/google/Callback";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider supabaseClient={supabase}>
          <AppInitializer>
            <Toaster position="bottom-right" />
            <Routes>
              <Route path="/setup-superadmin" element={<SetupSuperadmin />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/register-tenant" element={<RegisterTenant />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/integrations/google/callback" element={<GoogleCallbackPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/superadmin" element={<SuperadminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<SuperadminStats />} />
                  <Route path="create-tenant" element={<CreateTenant />} />
                  <Route path="tenants" element={<TenantsList />} />
                  <Route path="tenants/:tenantId/edit" element={<EditTenant />} />
                  <Route path="tenants/:tenantId" element={<TenantDetails />} />
                  <Route path="tenants/:tenantId/create-admin" element={<CreateTenantAdmin />} />
                  <Route path="subscription-plans" element={<SubscriptionPlans />} />
                  <Route path="subscription-plans/create" element={<CreateSubscriptionPlan />} />
                  <Route path="subscription-plans/edit/:planId" element={<EditSubscriptionPlan />} />
                  <Route path="plan-pricing" element={<PlanPricingManager />} />
                  <Route path="global-settings" element={<GlobalSettings />} />
                  <Route path="system-alerts" element={<SystemAlerts />} />
                  <Route path="error-reports" element={<ErrorReports />} />
                  <Route path="performance-metrics" element={<PerformanceMetrics />} />
                  <Route path="integrations" element={<IntegrationsPage />} />
                  <Route path="integrations/new" element={<IntegrationProviderForm />} /> {/* <-- Nueva ruta */}
                  <Route path="integrations/edit/:id" element={<IntegrationProviderForm />} /> {/* <-- Nueva ruta */}
                  <Route path="profile-settings" element={<ProfileSettings />} />
                </Route>

                <Route path="/" element={<Layout><Index /></Layout>}>
                  <Route index element={<Index />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="products" element={<Products />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="services" element={<Services />} />
                  <Route path="stylists" element={<Stylists />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="translations" element={<TranslationAdmin />} />
                  <Route path="tenant-admin/settings" element={<TenantSettings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </AppInitializer>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;