import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><div /></Layout>}>
            <Route index element={<Index />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="clients" element={<Clients />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="services" element={<Services />} />
            <Route path="stylists" element={<Stylists />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;