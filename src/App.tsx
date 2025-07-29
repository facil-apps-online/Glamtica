import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import Index from "@/pages/Index";
import Appointments from "@/pages/Appointments";
import Clients from "@/pages/Clients";
import Services from "@/pages/Services";
import Team from "@/pages/Team";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import BranchesPage from "@/pages/Settings/Branches";
import NotFound from "@/pages/NotFound";
import { queryClient } from "@/lib/queryClient";
import Products from "@/pages/Products";
import Inventory from "@/pages/Inventory";
import SuperadminRoutes from '@/pages/Superadmin/routes';
import ProfileSettings from "@/pages/ProfileSettings";
import TenantSettings from "@/pages/TenantAdmin/TenantSettings";
import RegisterTenant from "@/pages/RegisterTenant";
import TranslationAdmin from "@/components/TranslationAdmin";
import AppInitializer from "@/components/AppInitializer";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthPage from "@/pages/Auth";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import SetupSuperadmin from "@/pages/Superadmin/pages/SetupSuperadmin";
import ResetPasswordPage from "@/pages/ResetPassword";
import GoogleCallbackPage from "@/pages/integrations/google/Callback";

import UpdatePasswordPage from "@/pages/UpdatePasswordPage";

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
              <Route path="/update-password" element={<UpdatePasswordPage />} />
              <Route path="/integrations/google/callback" element={<GoogleCallbackPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/superadmin/*" element={<SuperadminRoutes />} />

                <Route path="/" element={<Layout><Index /></Layout>}>
                  <Route index element={<Index />} />
                  <Route path="profile-settings" element={<ProfileSettings />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="products" element={<Products />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="services" element={<Services />} />
                  <Route path="team" element={<Team />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="settings/branches" element={<BranchesPage />} />
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