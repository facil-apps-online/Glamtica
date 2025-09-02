import {
  BarChart3,
  Calendar,
  Combine, // Añadido para Combos
  Package,
  Scissors,
  Settings,
  UserCheck,
  Users,
  Warehouse,
  TrendingUp,
  Store,
  HardHat // New import for Equipment icon
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
        title: "Atenciones",
        url: "/attentions",
        icon: Calendar,
        roles: ['tenant_super_admin', 'tenant_admin', 'tenant_user']
      },
      {
        title: "Clientes",
        url: "/clients",
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
        url: "/team",
        icon: UserCheck,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Gestión de Ausencias",
        url: "/time-off-management",
        icon: UserCheck, // Opcional: puedes usar otro ícono
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Historial de Ausencias",
        url: "/time-off-history",
        icon: UserCheck, // Opcional: puedes usar otro ícono
        roles: ['tenant_super_admin', 'tenant_admin']
      }
    ]
  },
  {
    group: "Inventario",
    items: [
      {
        title: "Servicios",
        url: "/services",
        icon: Scissors,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Productos",
        url: "/products",
        icon: Package,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Combos",
        url: "/combos",
        icon: Combine,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Inventario",
        url: "/inventory",
        icon: Warehouse,
        roles: ['tenant_super_admin', 'tenant_admin']
      },
      {
        title: "Equipos",
        url: "/equipment",
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