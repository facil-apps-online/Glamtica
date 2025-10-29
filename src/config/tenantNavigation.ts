import {
  BarChart3,
  Calendar,
  Combine,
  Package,
  Scissors,
  Settings,
  UserCheck,
  Users,
  Warehouse,
  TrendingUp,
  Store,
  HardHat,
  Plane
} from 'lucide-react';

export const tenantNavigationConfig = [
  {
    group: "Gestión Principal",
    items: [
      {
        title: "Dashboard",
        url: "/app",
        icon: BarChart3,
        roles: ['tenant_super_admin', 'tenant_admin', 'tenant_user']
      },
      {
        title: "Atenciones",
        url: "/app/attentions",
        icon: Calendar,
        roles: ['tenant_super_admin', 'tenant_admin', 'tenant_user']
      },
      {
        title: "Clientes",
        url: "/app/clients",
        icon: Users,
        roles: ['tenant_super_admin', 'tenant_admin', 'tenant_user']
      }
    ]
  },
  {
    group: "Staff",
    items: [
      {
        title: "Equipo",
        url: "/app/team",
        icon: UserCheck,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Ausencias",
        url: "/app/time-off-management",
        icon: Plane,
        roles: ['tenant_super_admin', 'tenant_admin']
      }
    ]
  },
  {
    group: "Inventario",
    items: [
      {
        title: "Servicios",
        url: "/app/services",
        icon: Scissors,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Productos",
        url: "/app/products",
        icon: Package,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Combos",
        url: "/app/combos",
        icon: Combine,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Inventario",
        url: "/app/inventory",
        icon: Warehouse,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Equipos",
        url: "/app/equipment",
        icon: HardHat,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      
    ]
  },
  {
    group: "Análisis",
    items: [
      {
        title: "Reportes",
        url: "/app/reports",
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
        url: "/app/settings",
        icon: Settings,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Sucursales",
        url: "/app/branches",
        icon: Store,
        roles: ['tenant_super_admin']
      }
    ]
  }
];