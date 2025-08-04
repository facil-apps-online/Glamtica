import {
  BarChart3,
  Calendar,
  Package,
  Scissors,
  Settings,
  UserCheck,
  Users,
  Warehouse,
  TrendingUp,
  Store
} from 'lucide-react';

export const tenantNavigationConfig = [
  {
    group: "Gestión Principal",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: BarChart3,
        roles: ['tenant_super_admin', 'tenant_admin', 'tenant_user']
      },
      {
        title: "Citas",
        url: "/appointments",
        icon: Calendar,
        roles: ['tenant_super_admin', 'tenant_admin', 'tenant_user']
      },
      {
        title: "Clientes",
        url: "/clients",
        icon: Users,
        roles: ['tenant_super_admin', 'tenant_admin', 'tenant_user']
      },
      {
        title: "Servicios",
        url: "/services",
        icon: Scissors,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Equipo",
        url: "/team",
        icon: UserCheck,
        roles: ['tenant_super_admin', 'tenant_admin']
      }
    ]
  },
  {
    group: "Inventario",
    items: [
      {
        title: "Productos",
        url: "/products",
        icon: Package,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Inventario",
        url: "/inventory",
        icon: Warehouse,
        roles: ['tenant_super_admin', 'tenant_admin']
      }
    ]
  },
  {
    group: "Análisis",
    items: [
      {
        title: "Reportes",
        url: "/reports",
        icon: TrendingUp,
        roles: ['tenant_super_admin', 'tenant_admin']
      }
    ]
  },
  {
    group: "Configuración",
    items: [
      {
        title: "Configuración",
        url: "/settings",
        icon: Settings,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Sucursales",
        url: "/branches",
        icon: Store,
        roles: ['tenant_super_admin']
      }
    ]
  }
];
