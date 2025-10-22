import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import Index from "@/pages/Index";
import Attentions from "@/pages/Attentions";
import Clients from "@/pages/Clients";
import ClientDetailPage from "@/pages/ClientDetailPage";
import ServiceDetailPage from "@/pages/ServiceDetailPage";
import ProductEditPage from "@/pages/Products/ProductEditPage"; // Añadido
import EditComboPage from "@/pages/Combos/EditComboPage";
import Services from "@/pages/Services";
import Team from "@/pages/Team";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import BranchesPage from "@/pages/BranchesPage";
import NewBranchPage from "@/pages/NewBranchPage";
import EditBranchPage from "@/pages/EditBranchPage";
import BranchSettingsPage from "@/pages/BranchSettingsPage";
import NotFound from "@/pages/NotFound";
import { queryClient } from "@/lib/queryClient";
import Products from "@/pages/Products";
import Combos from "@/pages/Combos";
import Inventory from "@/pages/Inventory";
import SuppliersPage from "@/pages/SuppliersPage";
import EditSupplierPage from "@/pages/Suppliers/EditSupplierPage";
import BranchProductsPage from "@/pages/Inventory/BranchProductsPage";
import { PurchasesPage } from "@/pages/Inventory/PurchasesPage";
import { TransfersPage } from "@/pages/Inventory/TransfersPage";
import TimeOffManagementPage from "@/pages/TimeOffManagementPage";
import TimeOffHistoryPage from "@/pages/TimeOffHistoryPage";
import EquipmentPage from "@/pages/EquipmentPage";
import EditEquipmentPage from "@/pages/Equipments/EditEquipmentPage";




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
import TvManagementPage from "@/pages/TvManagementPage";
import TvDisplayPage from "@/pages/TvDisplayPage";
import RegisterTvPage from "@/pages/RegisterTvPage";
import LandingPage from "@/pages/LandingPage";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import FeaturesPage from "@/pages/FeaturesPage";
import UIKit from "@/pages/Dev/UIKit";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider supabaseClient={supabase}>
          <AppInitializer>
            <Toaster position="bottom-right" />
            <Routes>
              {/* Rutas Públicas */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/register-tenant" element={<RegisterTenant />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
              <Route path="/integrations/google/callback" element={<GoogleCallbackPage />} />
              <Route path="/tv" element={<TvDisplayPage />} />
              <Route path="/tv/:registrationCode" element={<TvDisplayPage />} />

              {/* Rutas Protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/register-tv/:registrationCode" element={<RegisterTvPage />} />
                
                {/* RUTA PADRE CON LAYOUT */}
                <Route path="/app" element={<Layout />}>
                  <Route index element={<Index />} /> {/* RUTA INDEX PARA LA PÁGINA DE INICIO */}
                  <Route path="profile-settings" element={<ProfileSettings />} />
                  <Route path="attentions" element={<Attentions />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="clients/:id" element={<ClientDetailPage />} />
                  <Route path="products" element={<Products />} />
                  <Route path="products/:id" element={<ProductEditPage />} />
                  <Route path="combos" element={<Combos />} />
                  <Route path="combos/edit/:id" element={<EditComboPage />} />
                  <Route path="inventory">
                    <Route index element={<Inventory />} />
                    <Route path="suppliers" element={<SuppliersPage />} />
                    <Route path="suppliers/edit/:id" element={<EditSupplierPage />} />
                    <Route path="branch-products" element={<BranchProductsPage />} />
                    <Route path="purchases" element={<PurchasesPage />} />
                    <Route path="transfers" element={<TransfersPage />} />
                  </Route>
                  <Route path="services" element={<Services />} />
                  <Route path="services/:id" element={<ServiceDetailPage />} />
                  <Route path="team" element={<Team />} />
                  <Route path="equipment">
                    <Route index element={<EquipmentPage />} />
                    <Route path="edit/:id" element={<EditEquipmentPage />} />
                  </Route>
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="settings/tv-management" element={<TvManagementPage />} />
                  <Route path="branches" element={<BranchesPage />} />
                  <Route path="branches/new" element={<NewBranchPage />} />
                  <Route path="branches/:branchId/edit" element={<EditBranchPage />} />
                  <Route path="branches/:branchId/settings" element={<BranchSettingsPage />} />
                  <Route path="translations" element={<TranslationAdmin />} />
                  <Route path="time-off-management" element={<TimeOffManagementPage />} />
                  <Route path="time-off-history" element={<TimeOffHistoryPage />} />
                  
                  {/* Ruta de desarrollo para el UI Kit */}
                  <Route path="dev/uikit" element={<UIKit />} />

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