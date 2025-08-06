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
import BranchesPage from "@/pages/BranchesPage";
import EditBranchPage from "@/pages/EditBranchPage";
import BranchSettingsPage from "@/pages/BranchSettingsPage";
import NotFound from "@/pages/NotFound";
import { queryClient } from "@/lib/queryClient";
import Products from "@/pages/Products";
import Inventory from "@/pages/Inventory";
import { SuppliersPage } from "@/pages/SuppliersPage";
import BranchProductsPage from "@/pages/Inventory/BranchProductsPage";



import ProfileSettings from "@/pages/ProfileSettings";
import TenantSettings from "@/pages/TenantAdmin/TenantSettings";
import RegisterTenant from "@/pages/RegisterTenant";
import TranslationAdmin from "@/components/TranslationAdmin";
import AppInitializer from "@/components/AppInitializer";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthPage from "@/pages/Auth";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
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
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/register-tenant" element={<RegisterTenant />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
              <Route path="/integrations/google/callback" element={<GoogleCallbackPage />} />

              <Route element={<ProtectedRoute />}>
                
                {/* RUTA PADRE CON LAYOUT */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} /> {/* RUTA INDEX PARA LA PÁGINA DE INICIO */}
                  <Route path="profile-settings" element={<ProfileSettings />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="products" element={<Products />} />
                  <Route path="inventory">
                    <Route index element={<Inventory />} />
                    <Route path="suppliers" element={<SuppliersPage />} />
                    <Route path="branch-products" element={<BranchProductsPage />} />
                  </Route>
                  <Route path="services" element={<Services />} />
                  <Route path="team" element={<Team />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="branches" element={<BranchesPage />} />
                  <Route path="branches/:branchId/edit" element={<EditBranchPage />} />
                  <Route path="branches/:branchId/settings" element={<BranchSettingsPage />} />
                  <Route path="translations" element={<TranslationAdmin />} />
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