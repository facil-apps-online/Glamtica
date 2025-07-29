import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { SuperadminLayout } from '../layouts/MainLayout';
import SuperadminDashboard from '../index';
import PlatformsList from '../pages/Platforms/PlatformsList';
import PlatformSettings from '../pages/Platforms/PlatformSettings';
import SystemCatalogs from '../pages/SystemCatalogs/SystemCatalogs';
import TenantList from '../pages/Tenants/TenantList';
import CreateTenant from '../pages/Tenants/CreateTenant';
import EditTenant from '../pages/Tenants/EditTenant';
import TenantDetails from '../pages/Tenants/TenantDetails';
import SetupSuperadmin from '../pages/SetupSuperadmin';

const SuperadminRoutes = () => {
  return (
    <Routes>
      
      <Route element={<SuperadminLayout />}>
        <Route index element={<SuperadminDashboard />} />
        <Route path="platforms" element={<PlatformsList />} />
        <Route path="platforms/:platformId/settings" element={<PlatformSettings />} />
        <Route path="system-catalogs" element={<SystemCatalogs />} />
        <Route path="tenants" element={<TenantList />} />
        <Route path="tenants/create" element={<CreateTenant />} />
        <Route path="tenants/:tenantId/edit" element={<EditTenant />} />
        <Route path="tenants/:tenantId" element={<TenantDetails />} />
      </Route>
    </Routes>
  );
};

export default SuperadminRoutes;
